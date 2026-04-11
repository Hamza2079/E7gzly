-- ============================================================
-- 010: Queue Management System — Core Tables
--
-- Creates:
--   1. doctor_schedules  — weekly working hours per doctor
--   2. queues            — one queue session per doctor per day
--   3. queue_entries     — each patient in a queue
--
-- Also:
--   - Archives old appointment/availability tables
--   - RLS policies for all new tables
--   - Helper functions
--   - Replica Identity for Supabase Realtime
-- ============================================================


-- ============================================================
-- PART 1: Archive old booking tables
-- We rename instead of drop so data is not lost
-- ============================================================

ALTER TABLE IF EXISTS public.appointments RENAME TO _archived_appointments;
ALTER TABLE IF EXISTS public.availability RENAME TO _archived_availability;


-- ============================================================
-- PART 2: doctor_schedules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  break_start TIME,            -- NULL = no break
  break_end   TIME,            -- NULL = no break
  max_active  INTEGER NOT NULL DEFAULT 33,
  queue_window INTEGER NOT NULL DEFAULT 10,
  grace_period INTEGER NOT NULL DEFAULT 3,  -- minutes
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT schedules_unique_day UNIQUE (provider_id, day_of_week),
  CONSTRAINT schedules_time_order CHECK (end_time > start_time),
  CONSTRAINT schedules_break_order CHECK (
    (break_start IS NULL AND break_end IS NULL) OR
    (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)
  ),
  CONSTRAINT schedules_break_within_hours CHECK (
    break_start IS NULL OR (break_start >= start_time AND break_end <= end_time)
  ),
  CONSTRAINT schedules_max_active_positive CHECK (max_active > 0),
  CONSTRAINT schedules_window_positive CHECK (queue_window > 0),
  CONSTRAINT schedules_grace_positive CHECK (grace_period > 0)
);

-- Enable RLS
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- Doctors can read & manage their own schedules
DROP POLICY IF EXISTS "schedules_read_own" ON public.doctor_schedules;
CREATE POLICY "schedules_read_own" ON public.doctor_schedules
  FOR SELECT USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "schedules_write_own" ON public.doctor_schedules;
CREATE POLICY "schedules_write_own" ON public.doctor_schedules
  FOR ALL USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Anyone can read schedules (to see doctor availability)
DROP POLICY IF EXISTS "schedules_public_read" ON public.doctor_schedules;
CREATE POLICY "schedules_public_read" ON public.doctor_schedules
  FOR SELECT USING (true);

-- Admins can manage all schedules
DROP POLICY IF EXISTS "schedules_admin_all" ON public.doctor_schedules;
CREATE POLICY "schedules_admin_all" ON public.doctor_schedules
  FOR ALL USING (public.is_admin());


-- ============================================================
-- PART 3: queues
-- ============================================================

CREATE TABLE IF NOT EXISTS public.queues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  schedule_id     UUID REFERENCES public.doctor_schedules(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'paused', 'closed', 'completed')),
  current_number  INTEGER NOT NULL DEFAULT 0,
  current_serving INTEGER,
  avg_duration    INTEGER NOT NULL DEFAULT 10,  -- rolling avg minutes
  admin_override  BOOLEAN NOT NULL DEFAULT false,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at       TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT queues_unique_day UNIQUE (provider_id, date)
);

-- Enable RLS
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Anyone can read queue status (public info)
DROP POLICY IF EXISTS "queues_public_read" ON public.queues;
CREATE POLICY "queues_public_read" ON public.queues
  FOR SELECT USING (true);

-- Queue owner (doctor) can update their queue
DROP POLICY IF EXISTS "queues_doctor_update" ON public.queues;
CREATE POLICY "queues_doctor_update" ON public.queues
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- System/cron inserts queues (use service_role key)
-- Doctors should also be able to insert (for manual open if needed)
DROP POLICY IF EXISTS "queues_doctor_insert" ON public.queues;
CREATE POLICY "queues_doctor_insert" ON public.queues
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

-- Admins can do everything
DROP POLICY IF EXISTS "queues_admin_all" ON public.queues;
CREATE POLICY "queues_admin_all" ON public.queues
  FOR ALL USING (public.is_admin());


-- ============================================================
-- PART 4: queue_entries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.queue_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id        UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  queue_number    INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'waiting'
                    CHECK (status IN (
                      'waiting', 'called', 'in_progress',
                      'completed', 'no_show', 'cancelled'
                    )),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at       TIMESTAMPTZ,
  grace_deadline  TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  visit_reason    TEXT,
  travel_category TEXT NOT NULL DEFAULT 'here'
                    CHECK (travel_category IN (
                      'here', 'nearby', 'medium', 'far', 'very_far'
                    )),
  notified_at     TIMESTAMPTZ,
  source          TEXT NOT NULL DEFAULT 'app'
                    CHECK (source IN ('app', 'walk_in', 'reinserted')),
  reinserted_from UUID REFERENCES public.queue_entries(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT entries_unique_number UNIQUE (queue_id, queue_number)
);

-- Partial unique index: prevent double-join while allowing reinsertion
-- A patient can only have ONE active entry (waiting/called/in_progress) per queue
CREATE UNIQUE INDEX IF NOT EXISTS entries_unique_active_patient
  ON public.queue_entries (queue_id, patient_id)
  WHERE status IN ('waiting', 'called', 'in_progress');

-- Index for common queries
CREATE INDEX IF NOT EXISTS entries_queue_status
  ON public.queue_entries (queue_id, status, queue_number);

CREATE INDEX IF NOT EXISTS entries_grace_deadline
  ON public.queue_entries (grace_deadline)
  WHERE status = 'called' AND grace_deadline IS NOT NULL;

-- Enable RLS
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Patients can read all entries in a queue (to see position)
DROP POLICY IF EXISTS "entries_public_read" ON public.queue_entries;
CREATE POLICY "entries_public_read" ON public.queue_entries
  FOR SELECT USING (true);

-- Patients can insert their own entry (join queue)
DROP POLICY IF EXISTS "entries_patient_insert" ON public.queue_entries;
CREATE POLICY "entries_patient_insert" ON public.queue_entries
  FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Patients can update their own entry (cancel)
DROP POLICY IF EXISTS "entries_patient_update" ON public.queue_entries;
CREATE POLICY "entries_patient_update" ON public.queue_entries
  FOR UPDATE USING (patient_id = auth.uid());

-- Queue owner (doctor) can update entries (call, complete, etc.)
DROP POLICY IF EXISTS "entries_doctor_update" ON public.queue_entries;
CREATE POLICY "entries_doctor_update" ON public.queue_entries
  FOR UPDATE USING (
    queue_id IN (
      SELECT q.id FROM public.queues q
      JOIN public.providers p ON p.id = q.provider_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Queue owner (doctor) can insert entries (walk-in)
DROP POLICY IF EXISTS "entries_doctor_insert" ON public.queue_entries;
CREATE POLICY "entries_doctor_insert" ON public.queue_entries
  FOR INSERT WITH CHECK (
    queue_id IN (
      SELECT q.id FROM public.queues q
      JOIN public.providers p ON p.id = q.provider_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admins can do everything
DROP POLICY IF EXISTS "entries_admin_all" ON public.queue_entries;
CREATE POLICY "entries_admin_all" ON public.queue_entries
  FOR ALL USING (public.is_admin());


-- ============================================================
-- PART 5: queue_history (analytics)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.queue_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id          UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  total_patients    INTEGER NOT NULL DEFAULT 0,
  total_served      INTEGER NOT NULL DEFAULT 0,
  total_no_shows    INTEGER NOT NULL DEFAULT 0,
  total_cancelled   INTEGER NOT NULL DEFAULT 0,
  avg_wait_time     INTEGER,  -- minutes
  avg_consultation  INTEGER,  -- minutes
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT history_unique_queue UNIQUE (queue_id)
);

ALTER TABLE public.queue_history ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "history_public_read" ON public.queue_history;
CREATE POLICY "history_public_read" ON public.queue_history
  FOR SELECT USING (true);

-- Admin full access
DROP POLICY IF EXISTS "history_admin_all" ON public.queue_history;
CREATE POLICY "history_admin_all" ON public.queue_history
  FOR ALL USING (public.is_admin());


-- ============================================================
-- PART 6: Helper functions
-- ============================================================

-- Check if the current user owns a specific queue
CREATE OR REPLACE FUNCTION public.is_queue_owner(p_queue_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.queues q
    JOIN public.providers p ON p.id = q.provider_id
    WHERE q.id = p_queue_id
      AND p.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Calculate remaining work minutes for a doctor today
CREATE OR REPLACE FUNCTION public.remaining_work_minutes(p_provider_id UUID)
RETURNS integer AS $$
DECLARE
  v_schedule public.doctor_schedules%ROWTYPE;
  v_now TIME;
  v_remaining INTEGER := 0;
BEGIN
  -- Get today's schedule
  SELECT * INTO v_schedule
  FROM public.doctor_schedules
  WHERE provider_id = p_provider_id
    AND day_of_week = EXTRACT(DOW FROM now())
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_now := LOCALTIME;

  -- If past end_time, no time left
  IF v_now >= v_schedule.end_time THEN
    RETURN 0;
  END IF;

  -- Total remaining = end_time - max(now, start_time)
  v_remaining := EXTRACT(EPOCH FROM (v_schedule.end_time - GREATEST(v_now, v_schedule.start_time))) / 60;

  -- Subtract break time if it hasn't passed yet
  IF v_schedule.break_start IS NOT NULL AND v_schedule.break_end IS NOT NULL THEN
    IF v_now < v_schedule.break_end THEN
      -- Break hasn't fully passed
      v_remaining := v_remaining - EXTRACT(EPOCH FROM (
        v_schedule.break_end - GREATEST(v_now, v_schedule.break_start)
      )) / 60;
    END IF;
  END IF;

  RETURN GREATEST(v_remaining, 0)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- PART 7: Replica Identity for Supabase Realtime
-- ============================================================

ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_schedules REPLICA IDENTITY FULL;


-- ============================================================
-- PART 8: Auto-update updated_at on doctor_schedules
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS schedules_updated_at ON public.doctor_schedules;
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON public.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
