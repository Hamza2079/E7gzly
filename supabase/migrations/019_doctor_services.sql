-- ============================================================
-- 019: Doctor Services & Visit Service Linking
--
-- Creates:
--   1. services             — doctor's billable services catalog
--   2. queue_entry_services — pivot: entry → services post-examination
--
-- Product rule: Patients NEVER pre-select services.
-- Services are assigned by the doctor after examination.
-- Patients see the receipt (assigned services + prices) after completion.
-- ============================================================

BEGIN;

-- ─── services ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name_ar             TEXT NOT NULL,
  name_en             TEXT,
  price               NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  estimated_duration  INTEGER NOT NULL DEFAULT 10 CHECK (estimated_duration > 0),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_provider_active
  ON public.services (provider_id, is_active, sort_order);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "services_doctor_all" ON public.services;
CREATE POLICY "services_doctor_all" ON public.services
  FOR ALL USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Patients can read active services for receipt display
DROP POLICY IF EXISTS "services_public_read_active" ON public.services;
CREATE POLICY "services_public_read_active" ON public.services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ─── queue_entry_services ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.queue_entry_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id        UUID NOT NULL REFERENCES public.queue_entries(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_override  NUMERIC(10,2) CHECK (price_override >= 0),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by     UUID NOT NULL REFERENCES public.users(id),

  CONSTRAINT entry_services_unique UNIQUE (entry_id, service_id)
);

CREATE INDEX IF NOT EXISTS entry_services_entry
  ON public.queue_entry_services (entry_id);

CREATE INDEX IF NOT EXISTS entry_services_service
  ON public.queue_entry_services (service_id);

ALTER TABLE public.queue_entry_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entry_services REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "entry_services_doctor_all" ON public.queue_entry_services;
CREATE POLICY "entry_services_doctor_all" ON public.queue_entry_services
  FOR ALL USING (
    entry_id IN (
      SELECT qe.id FROM public.queue_entries qe
      JOIN public.queues q ON q.id = qe.queue_id
      JOIN public.providers p ON p.id = q.provider_id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "entry_services_patient_read" ON public.queue_entry_services;
CREATE POLICY "entry_services_patient_read" ON public.queue_entry_services
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM public.queue_entries WHERE patient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "entry_services_admin_all" ON public.queue_entry_services;
CREATE POLICY "entry_services_admin_all" ON public.queue_entry_services
  FOR ALL USING (public.is_admin());

COMMIT;
