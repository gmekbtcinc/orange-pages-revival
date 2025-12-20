-- Migration 1: Rename event_type enum value 'secondary' to 'partner'
-- First drop the default to allow the type change
ALTER TABLE public.events ALTER COLUMN event_type DROP DEFAULT;

-- Rename the old type
ALTER TYPE public.event_type RENAME TO event_type_old;

-- Create the new type
CREATE TYPE public.event_type AS ENUM ('flagship', 'regional', 'partner');

-- Change the column type with proper casting
ALTER TABLE public.events ALTER COLUMN event_type TYPE public.event_type
  USING (CASE event_type::text WHEN 'secondary' THEN 'partner'::public.event_type ELSE event_type::text::public.event_type END);

-- Set the new default
ALTER TABLE public.events ALTER COLUMN event_type SET DEFAULT 'regional'::public.event_type;

-- Drop the old type
DROP TYPE public.event_type_old;