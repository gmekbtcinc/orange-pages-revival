-- Migration: Enhance benefits table with tracking metadata
-- Adds columns to support fulfillment tracking

-- Add new columns for tracking behavior
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

-- Add comments
COMMENT ON COLUMN public.benefits.fulfillment_mode IS 'How this benefit is fulfilled: self_service (member claims) or admin (staff delivers)';
COMMENT ON COLUMN public.benefits.scope IS 'When this benefit applies: per_event, per_period (membership year), or one_time';
COMMENT ON COLUMN public.benefits.tracking_type IS 'How to track: count (quantity) or boolean (yes/no)';
