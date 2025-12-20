-- Migration: Fix benefit categories to match the category UUIDs already in benefits table
-- The benefits already have correct benefit_category_id values, we just need matching categories

-- Step 1: Clear existing categories (they have wrong UUIDs)
DELETE FROM benefit_categories;

-- Step 2: Insert correct categories with their original UUIDs (matching what's in benefits.benefit_category_id)
INSERT INTO benefit_categories (id, name, description, display_order) VALUES
  ('5d5f779b-1298-409b-b91b-d023354d14ff', 'Digital Advertising', 'Website, newsletter, and digital ad placements', 1),
  ('1c83b751-ff15-431f-87cc-66f9f8d9747d', 'Email & Newsletter', 'Email campaigns and newsletter sponsorships', 2),
  ('0f3aa7fa-5c52-4431-b69d-6d80f01d1627', 'Social Media & Influencer', 'Social media promotions and influencer partnerships', 3),
  ('72cb4783-7e50-49aa-acaa-f1af94e41d69', 'Podcast & Audio', 'Podcast sponsorships and audio advertising', 4),
  ('b4d44eee-df23-4e71-9cf3-51986b5aa6b7', 'Video & Streaming', 'Video content and streaming sponsorships', 5),
  ('7b282abf-d17a-4735-8b31-007df64cb1a0', 'Print Magazine', 'Bitcoin Magazine print advertising and placements', 6),
  ('8b6bd29c-b294-443a-b5fd-5434a67be220', 'Content & Thought Leadership', 'Bylined content, case studies, and research', 7),
  ('64b3a447-024e-48a8-a9a5-006ceb60f0fb', 'Conference - Exhibition', 'Booth space and exhibition opportunities', 8),
  ('73f5871e-bd97-4e3a-95d1-ba370cd3b3df', 'Conference - Speaking & Stage', 'Speaking slots and stage presence', 9),
  ('7b2556b9-f634-4936-aef6-7d7e8d22c351', 'Conference - Attendee Experience', 'Attendee touchpoints and branded items', 10),
  ('cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69', 'Conference - Hospitality', 'Food, beverage, and hospitality sponsorships', 11),
  ('e2807b17-e1db-43a8-b0c8-5d1676da6105', 'Conference - VIP & Networking', 'VIP access and executive networking events', 12);

-- The benefits table already has the correct benefit_category_id values,
-- so they will now link correctly to these categories.

COMMENT ON TABLE benefit_categories IS 'Benefit categories - UUIDs must match benefit_category_id values in benefits table';
