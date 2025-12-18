-- Drop and recreate the admin_link_user_to_business function with explicit UPDATE/INSERT
CREATE OR REPLACE FUNCTION public.admin_link_user_to_business(
  _user_id uuid, 
  _business_id uuid, 
  _email text, 
  _display_name text, 
  _title text DEFAULT NULL::text, 
  _role user_role DEFAULT 'company_admin'::user_role, 
  _is_member boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_user_id uuid;
  _existing_id uuid;
BEGIN
  -- Check if caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can use this function';
  END IF;

  -- Check if a company_users record already exists for this user_id
  SELECT id INTO _existing_id
  FROM public.company_users
  WHERE user_id = _user_id;

  IF _existing_id IS NOT NULL THEN
    -- UPDATE existing record
    UPDATE public.company_users
    SET
      business_id = _business_id,
      email = _email,
      display_name = _display_name,
      title = _title,
      role = _role,
      can_claim_tickets = _is_member,
      can_register_events = _is_member,
      can_apply_speaking = _is_member,
      can_edit_profile = true,
      can_manage_users = _is_member,
      can_rsvp_dinners = _is_member,
      can_request_resources = _is_member,
      is_active = true,
      accepted_at = now(),
      updated_at = now()
    WHERE id = _existing_id
    RETURNING id INTO _company_user_id;
  ELSE
    -- INSERT new record
    INSERT INTO public.company_users (
      user_id,
      business_id,
      email,
      display_name,
      title,
      role,
      can_claim_tickets,
      can_register_events,
      can_apply_speaking,
      can_edit_profile,
      can_manage_users,
      can_rsvp_dinners,
      can_request_resources,
      is_active,
      accepted_at,
      updated_at
    ) VALUES (
      _user_id,
      _business_id,
      _email,
      _display_name,
      _title,
      _role,
      _is_member,
      _is_member,
      _is_member,
      true,
      _is_member,
      _is_member,
      _is_member,
      true,
      now(),
      now()
    )
    RETURNING id INTO _company_user_id;
  END IF;

  RETURN _company_user_id;
END;
$$;

-- Fix the current user's company_users record to link to Ledger business
UPDATE public.company_users 
SET 
  business_id = '00000000-0000-0000-0000-000000000002',
  role = 'company_admin',
  can_edit_profile = true,
  is_active = true,
  accepted_at = now(),
  updated_at = now()
WHERE user_id = 'ad6d13c4-cfb1-4cfc-8b53-38f398af029a' 
  AND (business_id IS NULL OR business_id != '00000000-0000-0000-0000-000000000002');