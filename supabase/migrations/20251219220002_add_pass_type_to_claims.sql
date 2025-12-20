-- Migration: Add pass_type column to ticket_claims
-- Tracks which type of ticket is being claimed

-- Create pass_type enum
DO $$ BEGIN
  CREATE TYPE public.pass_type AS ENUM ('ga', 'pro', 'whale', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add pass_type column to ticket_claims
-- Default to 'ga' for backward compatibility with existing claims
ALTER TABLE public.ticket_claims
  ADD COLUMN IF NOT EXISTS pass_type public.pass_type NOT NULL DEFAULT 'ga';

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ticket_claims_pass_type
  ON public.ticket_claims(pass_type);

CREATE INDEX IF NOT EXISTS idx_ticket_claims_business_event_pass
  ON public.ticket_claims(business_id, event_id, pass_type);

-- Add comment for documentation
COMMENT ON COLUMN public.ticket_claims.pass_type IS 'Type of pass being claimed: ga (General Admission), pro (Pro Pass), whale (Whale Pass), custom';
COMMENT ON TYPE public.pass_type IS 'Conference ticket pass types: ga=General Admission, pro=Pro Pass, whale=Whale Pass (VIP), custom=Event-specific custom pass';
