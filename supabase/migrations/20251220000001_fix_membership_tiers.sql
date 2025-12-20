-- Migration: Fix membership_tiers to match actual member_tier enum values
-- This aligns the configurable tier table with the real tiers used in memberships

-- Step 1: Clear existing package_benefits (they reference packages with wrong tiers)
DELETE FROM package_benefits;

-- Step 2: Clear existing tier_track_packages (they reference wrong tier IDs)
DELETE FROM tier_track_packages;

-- Step 3: Clear existing membership_tiers
DELETE FROM membership_tiers;

-- Step 4: Insert the REAL tier names that match the member_tier enum
-- These are the tiers actually used in the memberships table
INSERT INTO membership_tiers (name, base_annual_price, display_order, description, tagline, is_active) VALUES
  ('industry', 15000, 1, 'Industry-level membership for Bitcoin businesses', 'Essential Bitcoin business membership', true),
  ('premier', 25000, 2, 'Premier membership with enhanced benefits', 'Enhanced benefits package', true),
  ('executive', 50000, 3, 'Executive membership for established companies', 'Premium executive benefits', true),
  ('sponsor', 75000, 4, 'Sponsor-level membership with maximum visibility', 'Maximum visibility and benefits', true),
  ('chairman', 150000, 5, 'Chairman''s Circle - Elite membership tier', 'Elite access and benefits', true);

-- Step 5: Ensure we have a Default track (simplifies package creation)
INSERT INTO membership_tracks (name, description, display_order, is_active)
VALUES ('Default', 'Default membership track', 1, true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Step 6: Create packages for each tier with the Default track
INSERT INTO tier_track_packages (tier_id, track_id, display_name, description, status)
SELECT
  t.id as tier_id,
  tr.id as track_id,
  INITCAP(t.name) || ' Package' as display_name,
  'Standard benefits package for ' || INITCAP(t.name) || ' tier members' as description,
  'active'::package_status as status
FROM membership_tiers t
CROSS JOIN membership_tracks tr
WHERE tr.name = 'Default'
  AND t.is_active = true;

-- Add comments for clarity
COMMENT ON TABLE membership_tiers IS 'Membership tier definitions - names must match member_tier enum values';
