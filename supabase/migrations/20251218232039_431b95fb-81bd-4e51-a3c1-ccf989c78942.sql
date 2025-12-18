-- Make linking idempotent by upserting on company_users.user_id
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
AS $function$
DECLARE
  _company_user_id uuid;
BEGIN
  -- Check if caller is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can use this function';
  END IF;

  -- Upsert on user_id to avoid duplicate key errors
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
  ON CONFLICT (user_id)
  DO UPDATE SET
    business_id = EXCLUDED.business_id,
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    title = EXCLUDED.title,
    role = EXCLUDED.role,
    can_claim_tickets = EXCLUDED.can_claim_tickets,
    can_register_events = EXCLUDED.can_register_events,
    can_apply_speaking = EXCLUDED.can_apply_speaking,
    can_edit_profile = EXCLUDED.can_edit_profile,
    can_manage_users = EXCLUDED.can_manage_users,
    can_rsvp_dinners = EXCLUDED.can_rsvp_dinners,
    can_request_resources = EXCLUDED.can_request_resources,
    is_active = EXCLUDED.is_active,
    accepted_at = EXCLUDED.accepted_at,
    updated_at = EXCLUDED.updated_at
  RETURNING id INTO _company_user_id;

  RETURN _company_user_id;
END;
$function$;
