
-- =============================================
-- PHASE 1: NEW SCALABLE USER ARCHITECTURE (FIXED)
-- =============================================

-- 1. PROFILES TABLE - User identity (1:1 with auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TEAM_MEMBERSHIPS TABLE - User-Company associations (many-to-many)
-- =============================================
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(profile_id, business_id)
);

CREATE INDEX idx_team_memberships_profile ON public.team_memberships(profile_id);
CREATE INDEX idx_team_memberships_business ON public.team_memberships(business_id);

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is team member of a business
CREATE OR REPLACE FUNCTION public.is_team_member(_profile_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE profile_id = _profile_id
      AND business_id = _business_id
  )
$$;

-- Helper function: Check if user is team admin/owner of a business
CREATE OR REPLACE FUNCTION public.is_team_admin(_profile_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE profile_id = _profile_id
      AND business_id = _business_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Team Memberships RLS Policies
CREATE POLICY "Users can view memberships in their companies"
  ON public.team_memberships FOR SELECT
  USING (
    is_team_member(auth.uid(), business_id)
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Team admins can manage memberships"
  ON public.team_memberships FOR ALL
  USING (
    is_team_admin(auth.uid(), business_id)
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Users can view their own memberships"
  ON public.team_memberships FOR SELECT
  USING (profile_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_team_memberships_updated_at
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. COMPANY_LEADERSHIP TABLE - Public executives (optionally linked to profiles)
-- =============================================
CREATE TABLE public.company_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  display_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  headshot_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_leadership_business ON public.company_leadership(business_id);
CREATE INDEX idx_company_leadership_profile ON public.company_leadership(profile_id) WHERE profile_id IS NOT NULL;

ALTER TABLE public.company_leadership ENABLE ROW LEVEL SECURITY;

-- Leadership RLS Policies
CREATE POLICY "Anyone can view visible leadership"
  ON public.company_leadership FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Team admins can manage leadership"
  ON public.company_leadership FOR ALL
  USING (
    is_team_admin(auth.uid(), business_id)
    OR is_super_admin(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_company_leadership_updated_at
  BEFORE UPDATE ON public.company_leadership
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. INVITATIONS TABLE - Simplified invitation state
-- =============================================
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Use partial unique index instead of constraint with WHERE clause
CREATE UNIQUE INDEX idx_invitations_pending_unique 
  ON public.invitations(business_id, email) 
  WHERE status = 'pending';

CREATE INDEX idx_invitations_token ON public.invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_email ON public.invitations(email) WHERE status = 'pending';
CREATE INDEX idx_invitations_business ON public.invitations(business_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Invitations RLS Policies
CREATE POLICY "Anyone can view invitation by token"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Team admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    is_team_admin(auth.uid(), business_id)
    OR is_super_admin(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. PROFILE CREATION TRIGGER - Creates profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pending_invitation RECORD;
BEGIN
  -- Create the profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Check for pending invitations and auto-accept them
  FOR _pending_invitation IN
    SELECT * FROM public.invitations
    WHERE email = NEW.email
      AND status = 'pending'
      AND expires_at > now()
  LOOP
    -- Create team membership
    INSERT INTO public.team_memberships (profile_id, business_id, role, is_primary)
    VALUES (
      NEW.id,
      _pending_invitation.business_id,
      _pending_invitation.role,
      NOT EXISTS (SELECT 1 FROM public.team_memberships WHERE profile_id = NEW.id)
    );
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by = NEW.id
    WHERE id = _pending_invitation.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup_v2();

-- 6. GET_USER_PERMISSIONS FUNCTION - Derive permissions from role + tier
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(_profile_id UUID, _business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_role team_role;
  _membership_tier member_tier;
  _is_member BOOLEAN;
  _permissions JSONB;
BEGIN
  -- Get team role
  SELECT role INTO _team_role
  FROM public.team_memberships
  WHERE profile_id = _profile_id AND business_id = _business_id;
  
  -- If not a team member, return no permissions
  IF _team_role IS NULL THEN
    RETURN jsonb_build_object(
      'is_member', false,
      'team_role', null,
      'tier', null,
      'can_claim_tickets', false,
      'can_register_events', false,
      'can_apply_speaking', false,
      'can_rsvp_dinners', false,
      'can_request_resources', false,
      'can_edit_profile', false,
      'can_manage_team', false,
      'can_manage_leadership', false
    );
  END IF;
  
  -- Get membership tier
  SELECT tier, is_active INTO _membership_tier, _is_member
  FROM public.memberships
  WHERE business_id = _business_id AND is_active = true;
  
  -- If no active membership, limited permissions
  IF NOT COALESCE(_is_member, false) THEN
    RETURN jsonb_build_object(
      'is_member', false,
      'team_role', _team_role,
      'tier', null,
      'can_claim_tickets', false,
      'can_register_events', false,
      'can_apply_speaking', false,
      'can_rsvp_dinners', false,
      'can_request_resources', false,
      'can_edit_profile', _team_role IN ('owner', 'admin'),
      'can_manage_team', _team_role IN ('owner', 'admin'),
      'can_manage_leadership', _team_role IN ('owner', 'admin')
    );
  END IF;
  
  -- Full member permissions based on role
  _permissions := jsonb_build_object(
    'is_member', true,
    'team_role', _team_role,
    'tier', _membership_tier,
    'can_claim_tickets', true,
    'can_register_events', true,
    'can_apply_speaking', true,
    'can_rsvp_dinners', true,
    'can_request_resources', true,
    'can_edit_profile', _team_role IN ('owner', 'admin'),
    'can_manage_team', _team_role IN ('owner', 'admin'),
    'can_manage_leadership', _team_role IN ('owner', 'admin')
  );
  
  RETURN _permissions;
END;
$$;

-- 7. HELPER: Get user's primary company
-- =============================================
CREATE OR REPLACE FUNCTION public.get_primary_company(_profile_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id 
  FROM public.team_memberships
  WHERE profile_id = _profile_id
  ORDER BY is_primary DESC, joined_at ASC
  LIMIT 1
$$;

-- 8. HELPER: Ensure only one primary membership per user
-- =============================================
CREATE OR REPLACE FUNCTION public.ensure_single_primary_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.team_memberships
    SET is_primary = false
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_primary_membership_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON public.team_memberships
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_single_primary_membership();

-- 9. AUTO-LINK LEADERSHIP BY EMAIL
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_link_leadership_by_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id UUID;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.profile_id IS NULL THEN
    SELECT id INTO _profile_id
    FROM public.profiles
    WHERE email = NEW.email;
    
    IF _profile_id IS NOT NULL THEN
      NEW.profile_id := _profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_link_leadership_trigger
  BEFORE INSERT OR UPDATE OF email ON public.company_leadership
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_leadership_by_email();
