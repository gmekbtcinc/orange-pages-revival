-- =============================================
-- User Hierarchy & Permissions System Migration
-- =============================================

-- 1. Create New Enums
CREATE TYPE public.user_role AS ENUM ('super_admin', 'company_admin', 'company_user');
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- 2. Create `admins` Table (BFC staff)
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  can_manage_memberships boolean DEFAULT true,
  can_manage_events boolean DEFAULT true,
  can_manage_content boolean DEFAULT true,
  can_manage_admins boolean DEFAULT false,
  can_impersonate boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Create `memberships` Table (company-level, ONE per business)
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  tier public.member_tier NOT NULL DEFAULT 'silver',
  member_since date NOT NULL DEFAULT CURRENT_DATE,
  renewal_date date,
  next_payment_due date,
  payment_amount_cents integer,
  billing_email text,
  billing_contact_name text,
  hubspot_deal_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  is_active boolean DEFAULT true,
  cancelled_at timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Create `company_users` Table (MANY per business)
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  title text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'company_user',
  can_claim_tickets boolean DEFAULT false,
  can_register_events boolean DEFAULT false,
  can_apply_speaking boolean DEFAULT false,
  can_edit_profile boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_rsvp_dinners boolean DEFAULT false,
  can_request_resources boolean DEFAULT false,
  invited_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  invited_at timestamptz,
  accepted_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (business_id, email)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- 5. Create `user_invitations` Table
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role public.user_role DEFAULT 'company_user',
  invited_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  is_self_request boolean DEFAULT false,
  can_claim_tickets boolean DEFAULT false,
  can_register_events boolean DEFAULT false,
  can_apply_speaking boolean DEFAULT false,
  can_edit_profile boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_rsvp_dinners boolean DEFAULT false,
  can_request_resources boolean DEFAULT false,
  status public.invite_status DEFAULT 'pending',
  invite_token uuid DEFAULT gen_random_uuid(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Create `business_claims` Table
CREATE TABLE public.business_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimant_email text NOT NULL,
  claimant_name text NOT NULL,
  claimant_title text,
  claimant_phone text,
  verification_method text,
  verification_notes text,
  supporting_document_url text,
  status public.claim_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- 7. Create `tier_limits` Table
CREATE TABLE public.tier_limits (
  tier public.member_tier PRIMARY KEY,
  max_users integer NOT NULL,
  description text
);

INSERT INTO public.tier_limits (tier, max_users, description) VALUES
  ('silver', 3, 'Up to 3 team members'),
  ('gold', 5, 'Up to 5 team members'),
  ('platinum', 10, 'Up to 10 team members'),
  ('chairman', -1, 'Unlimited team members'),
  ('executive', -1, 'Unlimited team members');

ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;

-- 8. Add columns to existing tables
ALTER TABLE public.ticket_claims 
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_external_attendee boolean DEFAULT false;

ALTER TABLE public.symposium_registrations 
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_external_attendee boolean DEFAULT false;

ALTER TABLE public.vip_dinner_rsvps 
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES public.company_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_external_attendee boolean DEFAULT false;

-- =============================================
-- Helper Functions (SECURITY DEFINER to avoid RLS recursion)
-- =============================================

-- Check if user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Check if user is company admin for a business
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = _user_id 
      AND business_id = _business_id 
      AND role = 'company_admin'
      AND is_active = true
  )
$$;

-- Get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.company_users
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Check if business has active membership
CREATE OR REPLACE FUNCTION public.is_member_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE business_id = _business_id AND is_active = true
  )
$$;

-- Get remaining user slots for a business
CREATE OR REPLACE FUNCTION public.get_remaining_user_slots(_business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN tl.max_users = -1 THEN -1
      ELSE GREATEST(0, tl.max_users - (
        SELECT COUNT(*) FROM public.company_users 
        WHERE business_id = _business_id AND is_active = true
      )::integer)
    END
  FROM public.memberships m
  JOIN public.tier_limits tl ON tl.tier = m.tier
  WHERE m.business_id = _business_id AND m.is_active = true
$$;

-- Check if user belongs to a business
CREATE OR REPLACE FUNCTION public.is_business_user(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = _user_id 
      AND business_id = _business_id 
      AND is_active = true
  )
$$;

-- =============================================
-- RLS Policies
-- =============================================

-- Admins table policies
CREATE POLICY "Admins can view all admins"
ON public.admins FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins with permission can manage admins"
ON public.admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
      AND a.is_active = true 
      AND a.can_manage_admins = true
  )
);

-- Memberships table policies
CREATE POLICY "Admins can view all memberships"
ON public.memberships FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company users can view their membership"
ON public.memberships FOR SELECT
USING (public.is_business_user(auth.uid(), business_id));

CREATE POLICY "Admins can manage memberships"
ON public.memberships FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Company users table policies
CREATE POLICY "Admins can view all company users"
ON public.company_users FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view company users in same business"
ON public.company_users FOR SELECT
USING (public.is_business_user(auth.uid(), business_id));

CREATE POLICY "Users can update their own record"
ON public.company_users FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage their business users"
ON public.company_users FOR ALL
USING (public.is_company_admin(auth.uid(), business_id));

CREATE POLICY "Super admins can manage all company users"
ON public.company_users FOR ALL
USING (public.is_super_admin(auth.uid()));

-- User invitations table policies
CREATE POLICY "Admins can view all invitations"
ON public.user_invitations FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage invitations for their business"
ON public.user_invitations FOR ALL
USING (public.is_company_admin(auth.uid(), business_id));

CREATE POLICY "Super admins can manage all invitations"
ON public.user_invitations FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Business claims table policies
CREATE POLICY "Anyone can create a claim"
ON public.business_claims FOR INSERT
WITH CHECK (true);

CREATE POLICY "Claimants can view their own claims"
ON public.business_claims FOR SELECT
USING (claimant_user_id = auth.uid());

CREATE POLICY "Admins can view and manage all claims"
ON public.business_claims FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Tier limits table policies (public read)
CREATE POLICY "Anyone can view tier limits"
ON public.tier_limits FOR SELECT
USING (true);

-- =============================================
-- Data Migration from members table
-- =============================================

-- Create memberships from existing member records
INSERT INTO public.memberships (business_id, tier, member_since, renewal_date, next_payment_due, payment_amount_cents, notes)
SELECT DISTINCT ON (m.business_id)
  m.business_id,
  m.tier,
  m.member_since,
  m.renewal_date,
  m.next_payment_due,
  m.payment_amount_cents,
  m.notes
FROM public.members m
WHERE m.business_id IS NOT NULL
ON CONFLICT (business_id) DO NOTHING;

-- Create company_users from existing member records
INSERT INTO public.company_users (user_id, business_id, email, display_name, title, phone, role, 
  can_claim_tickets, can_register_events, can_apply_speaking, can_edit_profile, 
  can_manage_users, can_rsvp_dinners, can_request_resources, accepted_at)
SELECT 
  m.user_id,
  m.business_id,
  m.email,
  m.display_name,
  m.title,
  m.phone,
  'company_admin'::public.user_role,
  true, true, true, true, true, true, true,
  m.created_at
FROM public.members m
WHERE m.business_id IS NOT NULL AND m.user_id IS NOT NULL
ON CONFLICT (business_id, email) DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
BEFORE UPDATE ON public.company_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_claims_updated_at
BEFORE UPDATE ON public.business_claims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();