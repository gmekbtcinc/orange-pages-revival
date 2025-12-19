-- Fix security issues: Remove unused SECURITY DEFINER function and require authentication for business claims

-- 1. Drop the unused increment_package_usage function (SECURITY DEFINER without access controls)
DROP FUNCTION IF EXISTS public.increment_package_usage(UUID);

-- 2. Drop the overly permissive INSERT policy that allows anonymous users
DROP POLICY IF EXISTS "Anyone can create a claim" ON public.business_claims;

-- 3. Create a new policy that requires authentication and links claims to the authenticated user
CREATE POLICY "Authenticated users can create claims"
ON public.business_claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = claimant_user_id);

-- 4. Update the rate limit trigger to enforce limits for all users (remove NULL bypass)
CREATE OR REPLACE FUNCTION public.check_claim_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- All claims now require authentication, so claimant_user_id should never be NULL
  -- Check if user has exceeded rate limit (5 claims per 24 hours)
  IF (SELECT COUNT(*) FROM public.business_claims 
      WHERE claimant_user_id = NEW.claimant_user_id 
      AND created_at > NOW() - INTERVAL '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 business claims per 24 hours';
  END IF;
  
  RETURN NEW;
END;
$function$;