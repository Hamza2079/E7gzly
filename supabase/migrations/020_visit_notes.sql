-- ============================================================
-- 020: Visit Notes — Internal + Patient-Visible Split
--
-- Creates:
--   1. visit_notes              — one row per queue_entry
--   2. patient_visit_summaries  — security-invoker view for patients
--
-- Q4 Decision: Two distinct sections in one table row:
--   INTERNAL (provider-only):   chief_complaint, internal_notes
--   PATIENT-VISIBLE:            prescription, follow_up_instructions
--
-- Patients query the view (patient_visit_summaries), never the raw table.
-- The view does NOT use security_invoker = true, so it runs as the owner (bypassing RLS)
-- and then filters by auth.uid(), enforcing row-level separation securely.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.visit_notes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id                UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE CASCADE,
  patient_id              UUID NOT NULL REFERENCES public.users(id),
  provider_id             UUID NOT NULL REFERENCES public.providers(id),

  -- ── INTERNAL (provider-only) ──────────────────────────────
  chief_complaint         TEXT,
  internal_notes          TEXT,

  -- ── PATIENT-VISIBLE ───────────────────────────────────────
  prescription            TEXT,
  follow_up_instructions  TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT visit_notes_unique_entry UNIQUE (entry_id)
);

CREATE INDEX IF NOT EXISTS visit_notes_patient_provider
  ON public.visit_notes (patient_id, provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS visit_notes_entry
  ON public.visit_notes (entry_id);

ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_notes REPLICA IDENTITY FULL;

-- Doctor can do everything for their patients' notes
DROP POLICY IF EXISTS "visit_notes_doctor_all" ON public.visit_notes;
CREATE POLICY "visit_notes_doctor_all" ON public.visit_notes
  FOR ALL USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Admin full access
DROP POLICY IF EXISTS "visit_notes_admin_all" ON public.visit_notes;
CREATE POLICY "visit_notes_admin_all" ON public.visit_notes
  FOR ALL USING (public.is_admin());

-- NOTE: No patient policy on the raw table.
-- Patients access patient_visit_summaries view instead.

DROP TRIGGER IF EXISTS visit_notes_updated_at ON public.visit_notes;
CREATE TRIGGER visit_notes_updated_at
  BEFORE UPDATE ON public.visit_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ─── Patient-facing view ─────────────────────────────────────
-- Standard view (security definer). Runs as the view owner (postgres),
-- which bypasses RLS on visit_notes. It filters by patient_id = auth.uid()
-- exposing only patient-safe columns + aggregated receipt data.

DROP VIEW IF EXISTS public.patient_visit_summaries;
CREATE VIEW public.patient_visit_summaries
AS
SELECT
  vn.id,
  vn.entry_id,
  vn.patient_id,
  vn.provider_id,
  vn.prescription,
  vn.follow_up_instructions,
  vn.created_at,
  COALESCE(svc.services_json, '[]'::json) AS services,
  COALESCE(svc.total_amount, 0)           AS total_amount
FROM public.visit_notes vn
LEFT JOIN LATERAL (
  SELECT
    json_agg(json_build_object(
      'name_ar',   s.name_ar,
      'name_en',   s.name_en,
      'quantity',  qes.quantity,
      'price',     COALESCE(qes.price_override, s.price),
      'subtotal',  COALESCE(qes.price_override, s.price) * qes.quantity
    ) ORDER BY qes.assigned_at) AS services_json,
    SUM(COALESCE(qes.price_override, s.price) * qes.quantity) AS total_amount
  FROM public.queue_entry_services qes
  JOIN public.services s ON s.id = qes.service_id
  WHERE qes.entry_id = vn.entry_id
) svc ON true
WHERE vn.patient_id = auth.uid();

GRANT SELECT ON public.patient_visit_summaries TO authenticated;

COMMIT;
