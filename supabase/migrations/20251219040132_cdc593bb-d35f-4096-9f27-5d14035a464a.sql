
-- Phase 1: Add profile_id to event tables and update RLS

-- 1.1 Add profile_id columns
ALTER TABLE symposium_registrations 
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE speaker_applications
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE vip_dinner_rsvps
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 1.2 Migrate existing data (map company_user_id → profile_id via company_users.user_id)
UPDATE symposium_registrations sr
SET profile_id = cu.user_id
FROM company_users cu
WHERE sr.company_user_id = cu.id AND cu.user_id IS NOT NULL AND sr.profile_id IS NULL;

UPDATE speaker_applications sa
SET profile_id = cu.user_id
FROM company_users cu
WHERE sa.company_user_id = cu.id AND cu.user_id IS NOT NULL AND sa.profile_id IS NULL;

UPDATE vip_dinner_rsvps vdr
SET profile_id = cu.user_id
FROM company_users cu
WHERE vdr.company_user_id = cu.id AND cu.user_id IS NOT NULL AND vdr.profile_id IS NULL;

-- 1.3 Update RLS Policies for symposium_registrations
DROP POLICY IF EXISTS "Users can create symposium registrations" ON symposium_registrations;
DROP POLICY IF EXISTS "Users can view their own symposium registrations" ON symposium_registrations;
DROP POLICY IF EXISTS "Users can update their own symposium registrations" ON symposium_registrations;

CREATE POLICY "Users can create symposium registrations"
  ON symposium_registrations FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view their own symposium registrations"
  ON symposium_registrations FOR SELECT
  USING (profile_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update their own symposium registrations"
  ON symposium_registrations FOR UPDATE
  USING (profile_id = auth.uid());

-- 1.4 Update RLS Policies for speaker_applications
DROP POLICY IF EXISTS "Users can create speaker applications" ON speaker_applications;
DROP POLICY IF EXISTS "Users can view their own speaker applications" ON speaker_applications;
DROP POLICY IF EXISTS "Users can update their own speaker applications" ON speaker_applications;

CREATE POLICY "Users can create speaker applications"
  ON speaker_applications FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view their own speaker applications"
  ON speaker_applications FOR SELECT
  USING (profile_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update their own speaker applications"
  ON speaker_applications FOR UPDATE
  USING (profile_id = auth.uid());

-- 1.5 Update RLS Policies for vip_dinner_rsvps
DROP POLICY IF EXISTS "Users can create VIP dinner RSVPs" ON vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can view their own VIP dinner RSVPs" ON vip_dinner_rsvps;
DROP POLICY IF EXISTS "Users can update their own VIP dinner RSVPs" ON vip_dinner_rsvps;

CREATE POLICY "Users can create VIP dinner RSVPs"
  ON vip_dinner_rsvps FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view their own VIP dinner RSVPs"
  ON vip_dinner_rsvps FOR SELECT
  USING (profile_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update their own VIP dinner RSVPs"
  ON vip_dinner_rsvps FOR UPDATE
  USING (profile_id = auth.uid());

-- Add comments to mark deprecated columns
COMMENT ON COLUMN symposium_registrations.company_user_id IS 'DEPRECATED: Use profile_id instead. Will be removed in future cleanup.';
COMMENT ON COLUMN speaker_applications.company_user_id IS 'DEPRECATED: Use profile_id instead. Will be removed in future cleanup.';
COMMENT ON COLUMN vip_dinner_rsvps.company_user_id IS 'DEPRECATED: Use profile_id instead. Will be removed in future cleanup.';
