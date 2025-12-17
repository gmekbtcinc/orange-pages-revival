-- Phase 2: Clean up test data
DELETE FROM memberships;

DELETE FROM businesses WHERE name IN (
  'BitcoinTech Solutions',
  'Lightning Labs',
  'Nakamoto Holdings',
  'Satoshi Enterprises',
  'Future Bitcoin Corp'
);

-- Phase 3: Insert 37 new businesses
INSERT INTO businesses (name, city, state, country, website, status, is_bfc_member, is_verified, is_active, description)
VALUES
  ('Matador', 'Toronto', NULL, 'Canada', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('UTXO', 'Nashville', 'TN', 'USA', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Metaplanet', 'Tokyo', NULL, 'Japan', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Jetking', 'Mumbai', NULL, 'India', 'https://jetking.com', 'approved', true, true, true, 'BFC Member Company'),
  ('Samara Management', 'Berlin', NULL, 'Germany', 'https://www.samara-ag.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('LQwD', 'Vancouver', 'BC', 'Canada', 'https://lqwdtech.com', 'approved', true, true, true, 'BFC Member Company'),
  ('Next Layer Capital', 'Miami', 'FL', 'USA', 'https://nextlayer.capital', 'approved', true, true, true, 'BFC Member Company'),
  ('Uproot Company', 'Seoul', NULL, 'South Korea', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Moon Inc', 'Hong Kong', NULL, 'Hong Kong', 'http://1723.hk/', 'approved', true, true, true, 'BFC Member Company'),
  ('Capital B', 'Paris', NULL, 'France', 'https://cptlb.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Ledn', 'Toronto', NULL, 'Canada', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Fold', 'Phoenix', 'AZ', 'USA', 'https://foldapp.com', 'approved', true, true, true, 'BFC Member Company'),
  ('The London BTC Company', 'London', NULL, 'United Kingdom', 'https://ldnbtc.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Méliuz', 'Minas Gerais', NULL, 'Brazil', 'https://www.meliuz.com.br', 'approved', true, true, true, 'BFC Member Company'),
  ('Semler Scientific', 'Santa Clara', 'CA', 'USA', 'https://www.semlerscientific.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Blockspaces', 'Tampa', 'FL', 'USA', 'https://www.blockspaces.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Strive Funds', 'Dublin', 'OH', 'USA', 'https://www.strivefunds.com', 'approved', true, true, true, 'BFC Member Company'),
  ('NaaS', 'Beijing', NULL, 'China', 'https://enaas.com/en', 'approved', true, true, true, 'BFC Member Company'),
  ('Day Day Cook', 'Hong Kong', NULL, 'Hong Kong', 'https://daydaycook.com', 'approved', true, true, true, 'BFC Member Company'),
  ('Zoom2u', 'Pyrmont', 'NSW', 'Australia', 'https://www.zoom2u.com.au', 'approved', true, true, true, 'BFC Member Company'),
  ('KULR', 'Webster', 'TX', 'USA', 'https://kulr.ai', 'approved', true, true, true, 'BFC Member Company'),
  ('Byte Federal', 'Venice', 'FL', 'USA', 'https://www.bytefederal.com', 'approved', true, true, true, 'BFC Member Company'),
  ('LuxAlgo', 'Danvers', 'MA', 'USA', 'https://www.luxalgo.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Avalon Finance', 'Tortola', NULL, 'British Virgin Islands', 'https://www.avalonfinance.xyz/', 'approved', true, true, true, 'BFC Member Company'),
  ('Bitgo', 'Palo Alto', 'CA', 'USA', 'https://www.bitgo.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Solar Strategy', 'Beijing', NULL, 'China', 'https://solarstrat.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Prenetics', 'Hong Kong', NULL, 'Hong Kong', 'https://www.prenetics.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Public Square', 'West Palm Beach', 'FL', 'USA', 'https://www.publicsquare.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Kraken', 'Cheyenne', 'WY', 'USA', 'https://www.kraken.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Crypto.com', 'Hong Kong', NULL, 'Hong Kong', 'https://crypto.com', 'approved', true, true, true, 'BFC Member Company'),
  ('Nakamoto', 'Nashville', NULL, 'USA', 'https://nakamoto.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Aifinyo', 'Germany', NULL, 'Germany', 'https://www.aifinyo.de/', 'approved', true, true, true, 'BFC Member Company'),
  ('mNAV', 'Norway', NULL, 'Norway', 'https://mnav.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Treasury', 'Amsterdam', NULL, 'Netherlands', 'https://www.treasury-btc.com/', 'approved', true, true, true, 'BFC Member Company'),
  ('Salt', NULL, NULL, NULL, NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Strategy', 'Tyson', 'VA', 'USA', NULL, 'approved', true, true, true, 'BFC Member Company'),
  ('Bitwise', 'New York', 'NY', 'USA', 'https://bitwiseinvestments.com/', 'approved', true, true, true, 'BFC Member Company');

-- Phase 4: Insert memberships
INSERT INTO memberships (business_id, tier, member_since, renewal_date, is_active)
SELECT b.id, 
  CASE 
    WHEN b.name = 'Matador' THEN 'industry'::member_tier
    WHEN b.name = 'UTXO' THEN 'premier'::member_tier
    WHEN b.name = 'Metaplanet' THEN 'premier'::member_tier
    WHEN b.name = 'Jetking' THEN 'premier'::member_tier
    WHEN b.name = 'Samara Management' THEN 'executive'::member_tier
    WHEN b.name = 'LQwD' THEN 'executive'::member_tier
    WHEN b.name = 'Next Layer Capital' THEN 'premier'::member_tier
    WHEN b.name = 'Uproot Company' THEN 'industry'::member_tier
    WHEN b.name = 'Moon Inc' THEN 'executive'::member_tier
    WHEN b.name = 'Capital B' THEN 'premier'::member_tier
    WHEN b.name = 'Ledn' THEN 'sponsor'::member_tier
    WHEN b.name = 'Fold' THEN 'executive'::member_tier
    WHEN b.name = 'The London BTC Company' THEN 'executive'::member_tier
    WHEN b.name = 'Méliuz' THEN 'executive'::member_tier
    WHEN b.name = 'Semler Scientific' THEN 'premier'::member_tier
    WHEN b.name = 'Blockspaces' THEN 'premier'::member_tier
    WHEN b.name = 'Strive Funds' THEN 'executive'::member_tier
    WHEN b.name = 'NaaS' THEN 'executive'::member_tier
    WHEN b.name = 'Day Day Cook' THEN 'executive'::member_tier
    WHEN b.name = 'Zoom2u' THEN 'industry'::member_tier
    WHEN b.name = 'KULR' THEN 'executive'::member_tier
    WHEN b.name = 'Byte Federal' THEN 'executive'::member_tier
    WHEN b.name = 'LuxAlgo' THEN 'executive'::member_tier
    WHEN b.name = 'Avalon Finance' THEN 'executive'::member_tier
    WHEN b.name = 'Bitgo' THEN 'executive'::member_tier
    WHEN b.name = 'Solar Strategy' THEN 'executive'::member_tier
    WHEN b.name = 'Prenetics' THEN 'executive'::member_tier
    WHEN b.name = 'Public Square' THEN 'executive'::member_tier
    WHEN b.name = 'Kraken' THEN 'executive'::member_tier
    WHEN b.name = 'Crypto.com' THEN 'executive'::member_tier
    WHEN b.name = 'Nakamoto' THEN 'executive'::member_tier
    WHEN b.name = 'Aifinyo' THEN 'executive'::member_tier
    WHEN b.name = 'mNAV' THEN 'executive'::member_tier
    WHEN b.name = 'Treasury' THEN 'chairman'::member_tier
    WHEN b.name = 'Salt' THEN 'executive'::member_tier
    WHEN b.name = 'Strategy' THEN 'executive'::member_tier
    WHEN b.name = 'Bitwise' THEN 'sponsor'::member_tier
  END,
  CASE 
    WHEN b.name = 'Matador' THEN '2024-12-17'::date
    WHEN b.name = 'UTXO' THEN '2024-08-07'::date
    WHEN b.name = 'Metaplanet' THEN '2024-08-08'::date
    WHEN b.name = 'Jetking' THEN '2024-10-25'::date
    WHEN b.name = 'Samara Management' THEN '2024-08-12'::date
    WHEN b.name = 'LQwD' THEN '2024-11-15'::date
    WHEN b.name = 'Next Layer Capital' THEN '2025-02-24'::date
    WHEN b.name = 'Uproot Company' THEN '2025-03-13'::date
    WHEN b.name = 'Moon Inc' THEN '2025-03-19'::date
    WHEN b.name = 'Capital B' THEN '2025-03-24'::date
    WHEN b.name = 'Ledn' THEN '2025-05-05'::date
    WHEN b.name = 'Fold' THEN '2025-05-07'::date
    WHEN b.name = 'The London BTC Company' THEN '2025-05-13'::date
    WHEN b.name = 'Méliuz' THEN '2025-05-13'::date
    WHEN b.name = 'Semler Scientific' THEN '2025-05-14'::date
    WHEN b.name = 'Blockspaces' THEN '2025-05-16'::date
    WHEN b.name = 'Strive Funds' THEN '2025-05-19'::date
    WHEN b.name = 'NaaS' THEN '2025-05-20'::date
    WHEN b.name = 'Day Day Cook' THEN '2025-05-24'::date
    WHEN b.name = 'Zoom2u' THEN '2025-05-29'::date
    WHEN b.name = 'KULR' THEN '2025-06-04'::date
    WHEN b.name = 'Byte Federal' THEN '2025-06-04'::date
    WHEN b.name = 'LuxAlgo' THEN '2025-06-25'::date
    WHEN b.name = 'Avalon Finance' THEN '2025-07-01'::date
    WHEN b.name = 'Bitgo' THEN '2025-07-10'::date
    WHEN b.name = 'Solar Strategy' THEN '2025-07-24'::date
    WHEN b.name = 'Prenetics' THEN '2025-08-07'::date
    WHEN b.name = 'Public Square' THEN '2025-08-08'::date
    WHEN b.name = 'Kraken' THEN '2025-08-13'::date
    WHEN b.name = 'Crypto.com' THEN '2025-08-18'::date
    WHEN b.name = 'Nakamoto' THEN '2025-08-20'::date
    WHEN b.name = 'Aifinyo' THEN '2025-08-27'::date
    WHEN b.name = 'mNAV' THEN '2025-09-03'::date
    WHEN b.name = 'Treasury' THEN '2025-09-19'::date
    WHEN b.name = 'Salt' THEN '2025-11-24'::date
    WHEN b.name = 'Strategy' THEN '2024-09-29'::date
    WHEN b.name = 'Bitwise' THEN '2025-11-06'::date
  END,
  CASE 
    WHEN b.name = 'Matador' THEN '2026-01-01'::date
    WHEN b.name = 'UTXO' THEN '2026-01-01'::date
    WHEN b.name = 'Metaplanet' THEN '2026-01-01'::date
    WHEN b.name = 'Jetking' THEN '2026-01-01'::date
    WHEN b.name = 'Samara Management' THEN '2026-01-01'::date
    WHEN b.name = 'LQwD' THEN '2026-01-01'::date
    WHEN b.name = 'Next Layer Capital' THEN '2026-02-24'::date
    WHEN b.name = 'Uproot Company' THEN '2026-03-13'::date
    WHEN b.name = 'Moon Inc' THEN '2026-03-19'::date
    WHEN b.name = 'Capital B' THEN '2026-03-24'::date
    WHEN b.name = 'Ledn' THEN '2026-05-05'::date
    WHEN b.name = 'Fold' THEN '2026-05-07'::date
    WHEN b.name = 'The London BTC Company' THEN '2026-05-13'::date
    WHEN b.name = 'Méliuz' THEN '2026-05-13'::date
    WHEN b.name = 'Semler Scientific' THEN '2026-05-14'::date
    WHEN b.name = 'Blockspaces' THEN '2026-05-16'::date
    WHEN b.name = 'Strive Funds' THEN '2026-05-19'::date
    WHEN b.name = 'NaaS' THEN '2026-05-20'::date
    WHEN b.name = 'Day Day Cook' THEN '2026-05-24'::date
    WHEN b.name = 'Zoom2u' THEN '2026-05-29'::date
    WHEN b.name = 'KULR' THEN '2026-06-04'::date
    WHEN b.name = 'Byte Federal' THEN '2026-06-04'::date
    WHEN b.name = 'LuxAlgo' THEN '2026-06-25'::date
    WHEN b.name = 'Avalon Finance' THEN '2026-07-01'::date
    WHEN b.name = 'Bitgo' THEN '2026-07-10'::date
    WHEN b.name = 'Solar Strategy' THEN '2026-07-24'::date
    WHEN b.name = 'Prenetics' THEN '2026-08-07'::date
    WHEN b.name = 'Public Square' THEN '2026-08-08'::date
    WHEN b.name = 'Kraken' THEN '2026-08-13'::date
    WHEN b.name = 'Crypto.com' THEN '2026-08-18'::date
    WHEN b.name = 'Nakamoto' THEN '2026-08-20'::date
    WHEN b.name = 'Aifinyo' THEN '2026-08-27'::date
    WHEN b.name = 'mNAV' THEN '2026-09-03'::date
    WHEN b.name = 'Treasury' THEN '2026-09-19'::date
    WHEN b.name = 'Salt' THEN '2026-11-24'::date
    WHEN b.name = 'Strategy' THEN '2029-08-29'::date
    WHEN b.name = 'Bitwise' THEN NULL
  END,
  true
FROM businesses b
WHERE b.name IN (
  'Matador', 'UTXO', 'Metaplanet', 'Jetking', 'Samara Management', 'LQwD',
  'Next Layer Capital', 'Uproot Company', 'Moon Inc', 'Capital B', 'Ledn',
  'Fold', 'The London BTC Company', 'Méliuz', 'Semler Scientific', 'Blockspaces',
  'Strive Funds', 'NaaS', 'Day Day Cook', 'Zoom2u', 'KULR', 'Byte Federal',
  'LuxAlgo', 'Avalon Finance', 'Bitgo', 'Solar Strategy', 'Prenetics',
  'Public Square', 'Kraken', 'Crypto.com', 'Nakamoto', 'Aifinyo', 'mNAV',
  'Treasury', 'Salt', 'Strategy', 'Bitwise'
);

-- Phase 6: Update tier_limits
DELETE FROM tier_limits;
INSERT INTO tier_limits (tier, max_users, description) VALUES
  ('industry', 2, 'Industry tier - 2 team members'),
  ('premier', 5, 'Premier tier - 5 team members'),
  ('executive', 10, 'Executive tier - 10 team members'),
  ('sponsor', 15, 'Sponsor tier - 15 team members'),
  ('chairman', -1, 'Chairman''s Circle - unlimited team members'),
  ('silver', 2, 'Legacy Silver tier'),
  ('gold', 3, 'Legacy Gold tier'),
  ('platinum', 5, 'Legacy Platinum tier');