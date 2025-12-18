-- Create helper function for checking moderator+ access (moderator, admin, super_admin)
CREATE OR REPLACE FUNCTION public.has_moderator_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'moderator')
  )
$$;

-- Add RLS policies for moderators on businesses table
CREATE POLICY "Moderators can view all businesses"
ON public.businesses
FOR SELECT
USING (has_moderator_role(auth.uid()));

CREATE POLICY "Moderators can update businesses"
ON public.businesses
FOR UPDATE
USING (has_moderator_role(auth.uid()));

-- Add RLS policies for moderators on business_claims table
CREATE POLICY "Moderators can view all claims"
ON public.business_claims
FOR SELECT
USING (has_moderator_role(auth.uid()));

CREATE POLICY "Moderators can update claims"
ON public.business_claims
FOR UPDATE
USING (has_moderator_role(auth.uid()));

-- Add RLS policies for moderators on business_submissions table
CREATE POLICY "Moderators can view all submissions"
ON public.business_submissions
FOR SELECT
USING (has_moderator_role(auth.uid()));

CREATE POLICY "Moderators can update submissions"
ON public.business_submissions
FOR UPDATE
USING (has_moderator_role(auth.uid()));