-- Migration: Add pass type columns to event_allocations
-- Replaces single 'conference_tickets' with per-pass-type columns

-- Add new columns for each pass type
ALTER TABLE public.event_allocations
  ADD COLUMN IF NOT EXISTS ga_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whale_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_tickets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_pass_name TEXT;

-- Migrate existing conference_tickets data to ga_tickets
-- (Existing allocations become General Admission by default)
UPDATE public.event_allocations
SET ga_tickets = COALESCE(conference_tickets, 0)
WHERE ga_tickets = 0 OR ga_tickets IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.event_allocations.ga_tickets IS 'Number of General Admission passes allocated to this tier';
COMMENT ON COLUMN public.event_allocations.pro_tickets IS 'Number of Pro Pass tickets allocated to this tier';
COMMENT ON COLUMN public.event_allocations.whale_tickets IS 'Number of Whale Pass (VIP) tickets allocated to this tier';
COMMENT ON COLUMN public.event_allocations.custom_tickets IS 'Number of custom pass type tickets (if event has a 4th pass type)';
COMMENT ON COLUMN public.event_allocations.custom_pass_name IS 'Name of the custom pass type (e.g., "Speaker Pass", "Media Pass")';

-- Note: conference_tickets column is kept for backward compatibility
-- It will be removed in a future migration after UI is fully updated
COMMENT ON COLUMN public.event_allocations.conference_tickets IS 'DEPRECATED: Use ga_tickets, pro_tickets, whale_tickets instead';
