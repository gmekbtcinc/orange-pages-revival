-- Phase 7: Remove deprecated company_user_id columns
-- These columns have been replaced by profile_id and business_id

-- Remove company_user_id from ticket_claims
ALTER TABLE public.ticket_claims DROP COLUMN IF EXISTS company_user_id;

-- Remove company_user_id from symposium_registrations
ALTER TABLE public.symposium_registrations DROP COLUMN IF EXISTS company_user_id;

-- Remove company_user_id from speaker_applications
ALTER TABLE public.speaker_applications DROP COLUMN IF EXISTS company_user_id;

-- Remove company_user_id from vip_dinner_rsvps
ALTER TABLE public.vip_dinner_rsvps DROP COLUMN IF EXISTS company_user_id;

-- Remove company_user_id from member_resource_requests
ALTER TABLE public.member_resource_requests DROP COLUMN IF EXISTS company_user_id;

-- Remove assigned_by columns that referenced company_users (now deprecated)
-- These are no longer needed as we track via profile_id
ALTER TABLE public.ticket_claims DROP COLUMN IF EXISTS assigned_by;
ALTER TABLE public.symposium_registrations DROP COLUMN IF EXISTS assigned_by;
ALTER TABLE public.vip_dinner_rsvps DROP COLUMN IF EXISTS assigned_by;