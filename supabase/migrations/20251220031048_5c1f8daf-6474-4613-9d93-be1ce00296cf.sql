-- Migration 2: Add pass type columns to event_allocations
ALTER TABLE public.event_allocations
  ADD COLUMN IF NOT EXISTS ga_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whale_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_pass_name TEXT;

UPDATE public.event_allocations
SET ga_tickets = COALESCE(conference_tickets, 0)
WHERE ga_tickets = 0 OR ga_tickets IS NULL;