-- Create function to enforce claim rate limiting (max 5 claims per user per 24 hours)
CREATE OR REPLACE FUNCTION public.check_claim_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip rate limit for users without a user_id (anonymous claims via INSERT policy with check = true)
  IF NEW.claimant_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has exceeded rate limit (5 claims per 24 hours)
  IF (SELECT COUNT(*) FROM public.business_claims 
      WHERE claimant_user_id = NEW.claimant_user_id 
      AND created_at > NOW() - INTERVAL '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 business claims per 24 hours';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce rate limit on insert
DROP TRIGGER IF EXISTS enforce_claim_rate_limit ON public.business_claims;
CREATE TRIGGER enforce_claim_rate_limit
BEFORE INSERT ON public.business_claims
FOR EACH ROW EXECUTE FUNCTION public.check_claim_rate_limit();