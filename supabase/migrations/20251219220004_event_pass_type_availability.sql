-- Migration: Add available_pass_types to events table
-- Tracks which pass types are available for each event

-- Add column to store available pass types as an array
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS available_pass_types TEXT[] DEFAULT ARRAY['ga', 'pro', 'whale'];

-- Set default pass types based on event type for existing events
UPDATE public.events
SET available_pass_types =
  CASE
    WHEN event_type = 'flagship' THEN ARRAY['ga', 'pro', 'whale']
    WHEN event_type = 'regional' THEN ARRAY['ga', 'pro', 'whale']
    WHEN event_type = 'partner' THEN ARRAY['ga'] -- Partner events typically have fewer pass types
  END
WHERE available_pass_types IS NULL OR available_pass_types = ARRAY['ga', 'pro', 'whale'];

-- Add comment for documentation
COMMENT ON COLUMN public.events.available_pass_types IS 'Array of pass types available for this event: ga, pro, whale, custom';
