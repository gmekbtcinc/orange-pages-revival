-- =============================================
-- FIX: Case-insensitive email matching in signup trigger
-- =============================================
--
-- ISSUE:
-- The handle_new_user_signup_v2 trigger uses case-sensitive email comparison:
--   WHERE email = NEW.email
--
-- But invitations are stored with lowercase email (email.toLowerCase().trim())
-- while auth.users may have mixed-case email addresses.
--
-- This causes the trigger to fail to find pending invitations when the user
-- signs up with different email casing than the invitation.
--
-- FIX:
-- Use LOWER() for case-insensitive comparison on both sides.
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
  )
  ON CONFLICT (id) DO NOTHING;  -- Handle case where profile already exists

  -- Check for pending invitations and auto-accept them (case-insensitive)
  FOR _pending_invitation IN
    SELECT * FROM public.invitations
    WHERE LOWER(email) = LOWER(NEW.email)
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  LOOP
    -- Create team membership (avoid duplicates)
    INSERT INTO public.team_memberships (profile_id, business_id, role, is_primary)
    VALUES (
      NEW.id,
      _pending_invitation.business_id,
      _pending_invitation.role,
      NOT EXISTS (SELECT 1 FROM public.team_memberships WHERE profile_id = NEW.id)
    )
    ON CONFLICT (profile_id, business_id) DO NOTHING;

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

-- Add index for case-insensitive email lookups on invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email_lower
  ON public.invitations (LOWER(email))
  WHERE status = 'pending';
