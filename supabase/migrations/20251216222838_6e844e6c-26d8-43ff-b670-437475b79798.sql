-- Allow users to check their own admin status
CREATE POLICY "Users can check their own admin status"
ON public.admins
FOR SELECT
USING (auth.uid() = user_id);