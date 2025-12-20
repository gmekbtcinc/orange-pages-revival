-- Migration 1: Enhance benefits table
-- Add tracking metadata columns
ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'per_period',
  ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'count';

-- Add constraints
ALTER TABLE public.benefits
  ADD CONSTRAINT benefits_fulfillment_mode_check
    CHECK (fulfillment_mode IN ('self_service', 'admin')),
  ADD CONSTRAINT benefits_scope_check
    CHECK (scope IN ('per_event', 'per_period', 'one_time')),
  ADD CONSTRAINT benefits_tracking_type_check
    CHECK (tracking_type IN ('count', 'boolean'));

-- Migrate existing is_quantifiable to tracking_type
UPDATE public.benefits
SET tracking_type = CASE
  WHEN is_quantifiable = true THEN 'count'
  ELSE 'boolean'
END;