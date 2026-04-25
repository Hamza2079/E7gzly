-- ============================================================
-- 015: Real-Time Doctor ↔ Patient Sync
--
-- Adds bidirectional transparency columns:
--   queues        → break_until, delay_minutes, doctor_message
--   queue_entries → patient_eta, patient_message, is_checked_in,
--                   travel_updated_at
--
-- These columns power the real-time sync between doctor and
-- patient so every action on one side is visible on the other.
-- ============================================================


-- ============================================================
-- PART 1: Queue-level sync state (Doctor → Patients)
-- ============================================================

-- When the doctor takes a break, store when they'll return.
-- Patients see: "Doctor on break until 1:30 PM"
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS break_until TIMESTAMPTZ;

-- How many minutes behind schedule the doctor is running.
-- Calculated by comparing actual avg_duration vs expected pace.
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS delay_minutes INTEGER NOT NULL DEFAULT 0;

-- Doctor can broadcast a message to all waiting patients.
-- e.g. "Running 15 min late" or "Emergency — closing early"
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS doctor_message TEXT;


-- ============================================================
-- PART 2: Entry-level sync state (Patient → Doctor)
-- ============================================================

-- When the patient expects to arrive (computed from travel_category
-- or manually set). Doctor sees ETA per patient.
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS patient_eta TIMESTAMPTZ;

-- Quick message from patient to clinic.
-- e.g. "Stuck in traffic, 5 more min" or "I'm in the parking lot"
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS patient_message TEXT;

-- Patient taps "I'm here" when physically at the clinic.
-- Doctor sees a ✅ badge on the waiting list.
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN NOT NULL DEFAULT false;

-- Timestamp of last travel status update from the patient.
-- Helps doctor see how fresh the travel info is.
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS travel_updated_at TIMESTAMPTZ;


-- ============================================================
-- PART 3: Ensure Replica Identity stays FULL for Realtime
-- (Already set in 010, but re-affirm after schema changes)
-- ============================================================

ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
