-- Migration 5: Add available_pass_types to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS available_pass_types TEXT[] DEFAULT ARRAY['ga', 'pro', 'whale'];

UPDATE public.events
SET available_pass_types =
  CASE
    WHEN event_type = 'flagship' THEN ARRAY['ga', 'pro', 'whale']
    WHEN event_type = 'regional' THEN ARRAY['ga', 'pro', 'whale']
    WHEN event_type = 'partner' THEN ARRAY['ga']
  END
WHERE available_pass_types IS NULL OR available_pass_types = ARRAY['ga', 'pro', 'whale'];