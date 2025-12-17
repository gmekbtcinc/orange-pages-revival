-- Phase 2A: Update RLS policies to dual-mode (member_id OR company_user_id)

-- ============================================
-- 1. TICKET_CLAIMS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can create ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can update their own ticket claims" ON public.ticket_claims;

CREATE POLICY "Users can view their own ticket claims" ON public.ticket_claims
FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create ticket claims" ON public.ticket_claims
FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own ticket claims" ON public.ticket_claims
FOR UPDATE USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- ============================================
-- 2. SYMPOSIUM_REGISTRATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own symposium registrations" ON public.symposium_registrations;
DROP POLICY IF EXISTS "Users can create symposium registrations" ON public.symposium_registrations;
DROP POLICY IF EXISTS "Users can update their own symposium registrations" ON public.symposium_registrations;

CREATE POLICY "Users can view their own symposium registrations" ON public.symposium_registrations
FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create symposium registrations" ON public.symposium_registrations
FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own symposium registrations" ON public.symposium_registrations
FOR UPDATE USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- ============================================
-- 3. SPEAKER_APPLICATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own speaker applications" ON public.speaker_applications;
DROP POLICY IF EXISTS "Users can create speaker applications" ON public.speaker_applications;
DROP POLICY IF EXISTS "Users can update their own speaker applications" ON public.speaker_applications;

CREATE POLICY "Users can view their own speaker applications" ON public.speaker_applications
FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create speaker applications" ON public.speaker_applications
FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own speaker applications" ON public.speaker_applications
FOR UPDATE USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- ============================================
-- 4. VIP_DINNER_RSVPS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own VIP dinner RSVPs" ON public.vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can create VIP dinner RSVPs" ON public.vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can update their own VIP dinner RSVPs" ON public.vip_dinner_rsvps;

CREATE POLICY "Users can view their own VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own VIP dinner RSVPs" ON public.vip_dinner_rsvps
FOR UPDATE USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

-- ============================================
-- 5. MEMBER_RESOURCE_REQUESTS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own resource requests" ON public.member_resource_requests;
DROP POLICY IF EXISTS "Users can create resource requests" ON public.member_resource_requests;

CREATE POLICY "Users can view their own resource requests" ON public.member_resource_requests
FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create resource requests" ON public.member_resource_requests
FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  OR company_user_id IN (SELECT id FROM public.company_users WHERE user_id = auth.uid())
);