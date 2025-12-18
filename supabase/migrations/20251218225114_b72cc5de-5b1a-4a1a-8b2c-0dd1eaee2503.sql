-- Create a function that super admins can use to link users to businesses
-- This bypasses RLS to allow admins to update company_users records they can't normally see
CREATE OR REPLACE FUNCTION public.admin_link_user_to_business(
  _user_id uuid,
  _business_id uuid,
  _email text,
  _display_name text,
  _title text DEFAULT NULL,
  _role user_role DEFAULT 'company_admin',
  _is_member boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_user_id uuid;
BEGIN
  -- Check if caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can use this function';
  END IF;

  -- Check if user already has a company_users record
  SELECT id INTO _company_user_id
  FROM company_users
  WHERE user_id = _user_id
  LIMIT 1;

  IF _company_user_id IS NOT NULL THEN
    -- Update existing record
    UPDATE company_users
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
    WHERE id = _company_user_id;
  ELSE
    -- Create new record
    INSERT INTO company_users (
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
      accepted_at
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
      now()
    )
    RETURNING id INTO _company_user_id;
  END IF;

  RETURN _company_user_id;
END;
$$;