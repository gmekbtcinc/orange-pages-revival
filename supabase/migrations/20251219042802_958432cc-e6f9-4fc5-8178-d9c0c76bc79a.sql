-- Phase 5: Add business_id and profile_id to member_resource_requests
-- Add new columns
ALTER TABLE public.member_resource_requests
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id),
ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data from company_users
UPDATE public.member_resource_requests mrr
SET 
  business_id = cu.business_id,
  profile_id = cu.user_id
FROM public.company_users cu
WHERE mrr.company_user_id = cu.id
AND mrr.business_id IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_resource_requests_business_id 
ON public.member_resource_requests(business_id);

CREATE INDEX IF NOT EXISTS idx_member_resource_requests_profile_id 
ON public.member_resource_requests(profile_id);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can create resource requests" ON public.member_resource_requests;
DROP POLICY IF EXISTS "Users can view their own resource requests" ON public.member_resource_requests;

-- Create new RLS policies using profile_id and business_id
CREATE POLICY "Users can create resource requests"
ON public.member_resource_requests
FOR INSERT
WITH CHECK (
  profile_id = auth.uid() 
  AND business_id IN (
    SELECT business_id FROM public.team_memberships WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own resource requests"
ON public.member_resource_requests
FOR SELECT
USING (
  profile_id = auth.uid() 
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Team members can view company resource requests"
ON public.member_resource_requests
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.team_memberships WHERE profile_id = auth.uid()
  )
);

-- Add comment noting company_user_id is deprecated
COMMENT ON COLUMN public.member_resource_requests.company_user_id IS 'DEPRECATED: Use profile_id and business_id instead';