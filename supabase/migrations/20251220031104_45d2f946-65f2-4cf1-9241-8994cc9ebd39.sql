-- Migration 3: Add pass_type to ticket_claims
DO $$ BEGIN
  CREATE TYPE public.pass_type AS ENUM ('ga', 'pro', 'whale', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.ticket_claims
  ADD COLUMN IF NOT EXISTS pass_type public.pass_type NOT NULL DEFAULT 'ga';

CREATE INDEX IF NOT EXISTS idx_ticket_claims_pass_type ON public.ticket_claims(pass_type);
CREATE INDEX IF NOT EXISTS idx_ticket_claims_business_event_pass ON public.ticket_claims(business_id, event_id, pass_type);