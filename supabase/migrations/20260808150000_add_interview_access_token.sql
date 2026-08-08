-- Migration: Add access_token to interview_slots
-- This token is generated when a worker schedules an interview and is used
-- to create a unique, expirable link to the interview chatroom.
-- The link becomes invalid once the interview status is 'completed' or 'cancelled'.

alter table public.interview_slots
  add column if not exists access_token text unique;

-- Also add columns that the app relies on but may be missing from the initial schema
-- (safe to run even if they already exist thanks to IF NOT EXISTS)
alter table public.interview_slots
  add column if not exists passed boolean,
  add column if not exists format text not null default 'chat',
  add column if not exists rejection_reason text;

-- Update the status check constraint to include 'live' which is used by the app
-- (Do this safely: drop the old one and recreate with the full set)
alter table public.interview_slots
  drop constraint if exists interview_slots_status_check;

alter table public.interview_slots
  add constraint interview_slots_status_check
  check (status in ('scheduled', 'live', 'completed', 'cancelled', 'no_show'));

-- RLS: Workers must be able to SELECT their own slot by access_token
-- (the existing policy already covers worker_id = auth.uid(), which is sufficient
--  since getWorkerInterviewSlotByToken queries by access_token but the worker is
--  authenticated and the row's worker_id matches their uid — no policy change needed)
