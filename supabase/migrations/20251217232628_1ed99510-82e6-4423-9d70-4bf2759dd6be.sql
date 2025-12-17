-- Phase 1: Add company_user_id columns to activity tables
-- These are nullable initially to allow gradual migration without breaking existing functionality

-- 1. ticket_claims - already has company_user_id column per schema, skip

-- 2. symposium_registrations - already has company_user_id column per schema, skip

-- 3. speaker_applications - add company_user_id
ALTER TABLE public.speaker_applications 
ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES public.company_users(id);

-- 4. vip_dinner_rsvps - already has company_user_id column per schema, skip

-- 5. member_resource_requests - add company_user_id
ALTER TABLE public.member_resource_requests 
ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES public.company_users(id);

-- Add indexes for better query performance on the new columns
CREATE INDEX IF NOT EXISTS idx_speaker_applications_company_user_id 
ON public.speaker_applications(company_user_id);

CREATE INDEX IF NOT EXISTS idx_member_resource_requests_company_user_id 
ON public.member_resource_requests(company_user_id);