-- Phase 4: Drop deprecated member_id columns from activity tables

-- First, drop existing RLS policies that reference member_id
DROP POLICY IF EXISTS "Users can view their own ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can create ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can update their own ticket claims" ON public.ticket_claims;

DROP POLICY IF EXISTS "Users can view their own symposium registrations" ON public.symposium_registrations;
DROP POLICY IF EXISTS "Users can create symposium registrations" ON public.symposium_registrations;
DROP POLICY IF EXISTS "Users can update their own symposium registrations" ON public.symposium_registrations;

DROP POLICY IF EXISTS "Users can view their own speaker applications" ON public.speaker_applications;
DROP POLICY IF EXISTS "Users can create speaker applications" ON public.speaker_applications;
DROP POLICY IF EXISTS "Users can update their own speaker applications" ON public.speaker_applications;

DROP POLICY IF EXISTS "Users can view their own VIP dinner RSVPs" ON public.vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can create VIP dinner RSVPs" ON public.vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can update their own VIP dinner RSVPs" ON public.vip_dinner_rsvps;

DROP POLICY IF EXISTS "Users can view their own resource requests" ON public.member_resource_requests;
DROP POLICY IF EXISTS "Users can create resource requests" ON public.member_resource_requests;

-- Drop foreign key constraints on member_id columns
ALTER TABLE public.ticket_claims DROP CONSTRAINT IF EXISTS ticket_claims_member_id_fkey;
ALTER TABLE public.symposium_registrations DROP CONSTRAINT IF EXISTS symposium_registrations_member_id_fkey;
ALTER TABLE public.speaker_applications DROP CONSTRAINT IF EXISTS speaker_applications_member_id_fkey;
ALTER TABLE public.vip_dinner_rsvps DROP CONSTRAINT IF EXISTS vip_dinner_rsvps_member_id_fkey;
ALTER TABLE public.member_resource_requests DROP CONSTRAINT IF EXISTS member_resource_requests_member_id_fkey;

-- Drop the member_id columns
ALTER TABLE public.ticket_claims DROP COLUMN member_id;
ALTER TABLE public.symposium_registrations DROP COLUMN member_id;
ALTER TABLE public.speaker_applications DROP COLUMN member_id;
ALTER TABLE public.vip_dinner_rsvps DROP COLUMN member_id;
ALTER TABLE public.member_resource_requests DROP COLUMN member_id;

-- Create new RLS policies using only company_user_id
-- ticket_claims policies
CREATE POLICY "Users can view their own ticket claims" ON public.ticket_claims
FOR SELECT USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create ticket claims" ON public.ticket_claims
FOR INSERT WITH CHECK (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own ticket claims" ON public.ticket_claims
FOR UPDATE USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- symposium_registrations policies
CREATE POLICY "Users can view their own symposium registrations" ON public.symposium_registrations
FOR SELECT USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create symposium registrations" ON public.symposium_registrations
FOR INSERT WITH CHECK (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own symposium registrations" ON public.symposium_registrations
FOR UPDATE USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- speaker_applications policies
CREATE POLICY "Users can view their own speaker applications" ON public.speaker_applications
FOR SELECT USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create speaker applications" ON public.speaker_applications
FOR INSERT WITH CHECK (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own speaker applications" ON public.speaker_applications
FOR UPDATE USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- vip_dinner_rsvps policies
CREATE POLICY "Users can view their own VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR SELECT USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR INSERT WITH CHECK (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR UPDATE USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- member_resource_requests policies
CREATE POLICY "Users can view their own resource requests" ON public.member_resource_requests
FOR SELECT USING (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create resource requests" ON public.member_resource_requests
FOR INSERT WITH CHECK (
  company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);