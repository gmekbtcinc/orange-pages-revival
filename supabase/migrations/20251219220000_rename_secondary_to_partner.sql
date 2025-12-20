-- Migration: Rename event_type 'secondary' to 'partner'
-- This requires recreating the enum since PostgreSQL doesn't support direct rename of enum values

-- Step 1: Rename old enum
ALTER TYPE public.event_type RENAME TO event_type_old;

-- Step 2: Create new enum with 'partner' instead of 'secondary'
CREATE TYPE public.event_type AS ENUM ('flagship', 'regional', 'partner');

-- Step 3: Update the events table to use the new enum
ALTER TABLE public.events
  ALTER COLUMN event_type TYPE public.event_type
  USING (
    CASE event_type::text
      WHEN 'secondary' THEN 'partner'::public.event_type
      ELSE event_type::text::public.event_type
    END
  );

-- Step 4: Drop the old enum
DROP TYPE public.event_type_old;

-- Add comment for documentation
COMMENT ON TYPE public.event_type IS 'Event classification: flagship (major conferences), regional (location-specific), partner (smaller/partner events)';
