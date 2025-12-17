-- Add admin management policy for events table
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));