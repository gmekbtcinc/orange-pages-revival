-- Add RLS policy to allow users to delete their own unlinked company_users record
CREATE POLICY "Users can delete their own unlinked record"
ON public.company_users
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND business_id IS NULL);

-- Update the handle_new_user_signup trigger to prevent duplicate records
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if a company_users record already exists for this email (e.g., from an invitation)
  IF EXISTS (SELECT 1 FROM public.company_users WHERE email = NEW.email AND user_id IS NULL) THEN
    -- Update existing record to link user_id instead of creating a duplicate
    UPDATE public.company_users 
    SET user_id = NEW.id,
        display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', display_name)
    WHERE email = NEW.email AND user_id IS NULL;
  ELSIF NOT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = NEW.id) THEN
    -- No existing record for this email or user_id, create new one
    INSERT INTO public.company_users (
      user_id,
      email,
      display_name,
      business_id,
      role,
      is_active,
      can_claim_tickets,
      can_register_events,
      can_apply_speaking,
      can_edit_profile,
      can_manage_users,
      can_rsvp_dinners,
      can_request_resources
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NULL,
      'company_user',
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;