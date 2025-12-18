-- Allow users to view their own company_users record (fixes new signup dashboard access)
CREATE POLICY "Users can view their own company user record"
  ON public.company_users
  FOR SELECT
  USING (user_id = auth.uid());