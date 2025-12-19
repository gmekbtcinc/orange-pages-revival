-- Add display_name column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS display_name text;

-- Migrate any pending invitations from user_invitations to invitations
INSERT INTO public.invitations (
  business_id,
  email,
  display_name,
  role,
  status,
  token,
  invited_by,
  expires_at,
  created_at,
  updated_at
)
SELECT 
  ui.business_id,
  ui.email,
  ui.display_name,
  CASE 
    WHEN ui.role = 'company_admin' THEN 'admin'::team_role
    ELSE 'member'::team_role
  END,
  ui.status::text::invitation_status,
  ui.invite_token,
  NULL, -- invited_by needs UUID, user_invitations has different FK
  ui.expires_at,
  ui.created_at,
  COALESCE(ui.accepted_at, now())
FROM public.user_invitations ui
WHERE ui.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.invitations i 
    WHERE i.email = ui.email 
    AND i.business_id = ui.business_id 
    AND i.status = 'pending'
  );

-- Drop the user_invitations table
DROP TABLE IF EXISTS public.user_invitations CASCADE;