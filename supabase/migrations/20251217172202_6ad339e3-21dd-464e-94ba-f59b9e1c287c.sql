-- Add RLS policies for super admins to manage event_allocations
CREATE POLICY "Super admins can insert event allocations"
ON public.event_allocations
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update event allocations"
ON public.event_allocations
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete event allocations"
ON public.event_allocations
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));