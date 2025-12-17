-- Phase 5: Drop the deprecated members table
-- All activity now uses company_users exclusively

-- First drop the foreign key constraint from memberships if it references members
-- Note: There's no FK from memberships to members, but let's be safe

-- Drop RLS policies on members table
DROP POLICY IF EXISTS "Users can view their own member record" ON public.members;
DROP POLICY IF EXISTS "Users can update their own member record" ON public.members;

-- Drop the members table
DROP TABLE IF EXISTS public.members;