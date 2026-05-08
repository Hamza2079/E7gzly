-- ============================================================
-- 018: Future Day Reservations
--
-- Creates:
--   1. queue_day_limits    — per-day reservation capacity config
--   2. queue_reservations  — staging table for future bookings
--
-- Design Philosophy:
--   queue_reservations is a STAGING table. On the day of the
--   reservation, openQueue() automatically converts pending
--   reservations into real queue_entries (status='not_ready').
--   The live queue architecture is completely unchanged.
-- ============================================================

BEGIN;

-- ─── queue_day_limits ────────────────────────────────────────
-- Separate from doctor_schedules to avoid touching the hot
-- queue join path. One row per provider per day-of-week.

CREATE TABLE IF NOT EXISTS public.queue_day_limits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week       INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  max_reservations  INTEGER NOT NULL DEFAULT 20 CHECK (max_reservations > 0),
  advance_days      INTEGER NOT NULL DEFAULT 7  CHECK (advance_days BETWEEN 1 AND 90),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT day_limits_unique_day UNIQUE (provider_id, day_of_week)
);

ALTER TABLE public.queue_day_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_day_limits REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "day_limits_public_read" ON public.queue_day_limits;
CREATE POLICY "day_limits_public_read" ON public.queue_day_limits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "day_limits_doctor_all" ON public.queue_day_limits;
CREATE POLICY "day_limits_doctor_all" ON public.queue_day_limits
  FOR ALL USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "day_limits_admin_all" ON public.queue_day_limits;
CREATE POLICY "day_limits_admin_all" ON public.queue_day_limits
  FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS day_limits_updated_at ON public.queue_day_limits;
CREATE TRIGGER day_limits_updated_at
  BEFORE UPDATE ON public.queue_day_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ─── queue_reservations ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.queue_reservations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  patient_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reserved_date         DATE NOT NULL,
  reservation_number    INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'converted', 'cancelled', 'no_show')),
  visit_reason          TEXT,
  notes                 TEXT,
  converted_entry_id    UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reservations_unique_number UNIQUE (provider_id, reserved_date, reservation_number)
);

-- One active reservation per patient per provider per day
CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_active_per_patient
  ON public.queue_reservations (provider_id, patient_id, reserved_date)
  WHERE status NOT IN ('cancelled');

CREATE INDEX IF NOT EXISTS reservations_provider_date
  ON public.queue_reservations (provider_id, reserved_date, status);

CREATE INDEX IF NOT EXISTS reservations_patient
  ON public.queue_reservations (patient_id, status);

ALTER TABLE public.queue_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_reservations REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "reservations_public_count" ON public.queue_reservations;
CREATE POLICY "reservations_public_count" ON public.queue_reservations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reservations_patient_insert" ON public.queue_reservations;
CREATE POLICY "reservations_patient_insert" ON public.queue_reservations
  FOR INSERT WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "reservations_patient_update" ON public.queue_reservations;
CREATE POLICY "reservations_patient_update" ON public.queue_reservations
  FOR UPDATE USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "reservations_doctor_read" ON public.queue_reservations;
CREATE POLICY "reservations_doctor_read" ON public.queue_reservations
  FOR SELECT USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reservations_doctor_update" ON public.queue_reservations;
CREATE POLICY "reservations_doctor_update" ON public.queue_reservations
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reservations_admin_all" ON public.queue_reservations;
CREATE POLICY "reservations_admin_all" ON public.queue_reservations
  FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS reservations_updated_at ON public.queue_reservations;
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.queue_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;
