-- Drop the foreign key constraint to the deprecated admins table
ALTER TABLE public.business_claims 
DROP CONSTRAINT IF EXISTS business_claims_reviewed_by_fkey;

-- Add a comment documenting what reviewed_by stores
COMMENT ON COLUMN public.business_claims.reviewed_by IS 'UUID of the admin user who reviewed this claim (references auth.users.id)';