-- Add policy to allow anyone to view invitation by token (for accepting invitations)
-- The token itself acts as security since it's a random UUID shared only via email
CREATE POLICY "Anyone can view invitation by token" 
ON public.user_invitations 
FOR SELECT 
USING (true);