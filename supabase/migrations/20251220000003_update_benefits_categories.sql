-- Migration: Update benefits.category_id to link to correct categories
-- Lovable schema uses category_id (not benefit_category_id)

-- Conference - Hospitality (cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69)
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = '16b7197c-febd-4ffa-94d6-ae33988497bb'; -- Breakfast Sponsorship - Daily
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = 'e8eedb5b-31fc-422d-894c-cb2a503e7206'; -- Lunch Sponsorship - Daily
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = 'c7f80269-3c73-4454-9d33-87ac5000df70'; -- Coffee Break Sponsorship
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = 'eb6592bd-c5ed-4ca1-93ec-401c96b54a1c'; -- Happy Hour Sponsorship
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = '1c3d5c2b-8913-4ca5-9781-18825558547d'; -- VIP Lounge Sponsorship
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = '0d85765d-4ce5-4824-a6fc-3495fd7716ab'; -- Cocktail Reception Sponsor
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = '7478febe-62c4-4277-a028-0007cd9caff4'; -- Dessert & Treats Station
UPDATE benefits SET category_id = 'cb06ee11-d2b0-4f65-bf2f-28a3b0fc8a69' WHERE id = '88e6b12b-0cc1-4059-ae3d-6bba8baf973d'; -- After Party - Title Sponsor

-- Conference - Speaking & Stage (73f5871e-bd97-4e3a-95d1-ba370cd3b3df)
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'e74d452b-d2a1-4fd6-bd6d-9047506d1283'; -- Stage Branding - Day Sponsor
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'ad08119d-faac-4f1e-a30b-455bb49f5e7d'; -- Ask Me Anything (AMA) Session
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'df64fa73-f642-42f6-bf7f-bd12cec8a398'; -- Breakout Session - 45 Minutes
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '63e774e6-7b25-4cb9-970e-5c6ea7ed957a'; -- Fireside Chat Slot
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'c4b71321-b3e2-4039-aef5-4edcf026d99a'; -- Keynote Speaking Slot - Main Stage
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'c95cac47-f673-4eac-b25a-a5bf13d61852'; -- Panel Moderator Slot
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'cd15c642-fed1-43dc-a8fa-040911cf10ef'; -- Panel Participant Seat
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '8e6947e9-b796-431a-a465-34f5b60e0440'; -- Workshop Session - 90 Minutes
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '162daecf-46bc-4bb0-97f5-93a7be05374e'; -- Closing Remarks Sponsorship
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '4d810dee-75a0-41dd-a178-069c9b40ea35'; -- Opening Remarks Sponsorship
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = 'f12fe02e-f96c-43d7-b8c7-066db32f686c'; -- Podcast Recording Live on Stage
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '4b8b9c0c-967c-47a6-bef0-23c4ed43a531'; -- Product Demo on Stage
UPDATE benefits SET category_id = '73f5871e-bd97-4e3a-95d1-ba370cd3b3df' WHERE id = '81eba209-2e7a-4714-96f1-659bd41a84ac'; -- Lightning Talk - 10 Minutes

-- Video & Streaming (b4d44eee-df23-4e71-9cf3-51986b5aa6b7)
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '4c149990-7509-492a-a4d7-7ec4f8917765'; -- Documentary Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '03a092b9-0bd7-43ed-88ce-67d75d299494'; -- Video Series Co-Production
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '2f108711-b3dd-4ccb-ab2b-38a718358949'; -- YouTube Pre-Roll Sponsorship - Monthly
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '06a67888-2844-4993-940d-2568b33314bd'; -- Video Thumbnail Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '8ca5c1fe-5af7-44a2-b28f-279d4ad578b1'; -- Conference Live Stream Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '9986b8d0-3273-4008-8005-5c8ae2ef7405'; -- Live Stream Series Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '448681f5-5418-4723-b3a8-8a2d098c74f4'; -- Live Stream Title Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '28ff5881-d456-4b64-befd-70d27030c25f'; -- Short-Form Video Series
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '299c029d-3472-485b-acf4-64173654647d'; -- YouTube Dedicated Video
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = 'c75d0fc2-ea38-4683-b27e-11beb0912bb2'; -- YouTube End Card Sponsorship
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = '75656750-68a2-480f-ac18-9e3a1ee1acaa'; -- YouTube Mid-Roll Integration
UPDATE benefits SET category_id = 'b4d44eee-df23-4e71-9cf3-51986b5aa6b7' WHERE id = 'c9f90b07-7bf4-466d-973f-999f08007d2f'; -- YouTube Series Sponsorship

-- Social Media & Influencer (0f3aa7fa-5c52-4431-b69d-6d80f01d1627)
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = 'f67934e1-f05b-4a51-914c-98d8851ec2e6'; -- Social Media Campaign - Multi-Platform
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '836439d8-0725-4eb5-adff-8495b20de746'; -- Social Media Takeover - 1 Day
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '5f68410f-672c-4851-b679-4b4c57b96fd6'; -- Twitter/X Sponsored Thread
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '8ffa0ab3-30b3-424c-bb62-3dc042d8a0cb'; -- Facebook Group Promotion
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = 'a1dedfd8-32df-47cf-8f6b-b4cfa7aad6f2'; -- Twitter/X Pinned Tweet - 1 Week
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '27405e03-01f6-4765-9e09-4fef9bda1d06'; -- Influencer Partnership - Tier 1
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = 'f325c5e7-7f58-4da8-b209-3c316a5ad43d'; -- Influencer Partnership - Tier 2
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '5139baf8-c21a-4386-a3ed-3f34147ffee3'; -- Influencer Partnership - Tier 3
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '46bbd215-cc68-4c84-821d-5159031d53cd'; -- Instagram Story Series
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '2ddb14c5-0a83-4c2e-a7d9-6444b8107d27'; -- LinkedIn Article Sponsorship
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '60adbb23-f939-448a-b9b5-833f31719e6a'; -- LinkedIn Sponsored Post
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '76aec902-bf36-4baa-9931-fc7886e6aa92'; -- Reddit AMA Sponsorship
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = 'd7380861-94e8-45b6-ac37-9538b936be28'; -- TikTok Video Sponsorship
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = 'ebe61dfe-222f-4d54-84b6-a22e8f9fe98d'; -- Twitter Spaces Sponsorship
UPDATE benefits SET category_id = '0f3aa7fa-5c52-4431-b69d-6d80f01d1627' WHERE id = '87e59add-b0a2-456f-a16e-c80683c6617f'; -- Instagram Post Sponsorship

-- Podcast & Audio (72cb4783-7e50-49aa-acaa-f1af94e41d69)
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = '53ee3cf5-703a-45e4-8990-a576d57489ff'; -- Podcast Guest Feature Interview
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = 'b4de2547-17a6-4794-acd2-24d3944cfaf0'; -- Live Podcast Recording Sponsorship
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = '72553298-ed4d-41a4-a6ee-71eca3d5c835'; -- Podcast Audiogram Sponsorship
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = '60846f3b-1bb8-4f29-a226-76253f212212'; -- Podcast Pre-Roll Ad - Monthly
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = '22bf94e1-4093-446a-a3ae-ce56e3d2c536'; -- Podcast Mid-Roll Ad - Monthly
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = '2078e738-7f54-426e-bb49-ee9943e49b1a'; -- Podcast Network Sponsorship
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = 'c8777c16-7d89-43e2-9f7f-b4304064b6c4'; -- Podcast Segment Sponsorship
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = 'a135475b-0249-412c-ab3b-e7543b963dfa'; -- Podcast Series Sponsorship - Full Season
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = 'db9470f8-d506-4a84-8827-c517aa84b327'; -- Single Podcast Episode - Title Sponsor
UPDATE benefits SET category_id = '72cb4783-7e50-49aa-acaa-f1af94e41d69' WHERE id = 'd14b0480-0942-43e9-bb47-909132b34dee'; -- Podcast Dynamic Ad Insertion

-- Email & Newsletter (1c83b751-ff15-431f-87cc-66f9f8d9747d)
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '211f5612-c75c-4b5c-99fe-d05ed361c594'; -- Newsletter Native Ad Unit
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '7183ae49-134a-48d1-b99b-7670e927303d'; -- Breaking News Alert Sponsorship
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '09f54bbc-ee8d-4812-86bd-aef933c8eb74'; -- Newsletter Feature Article
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '7f9609d9-4cb1-4d58-a903-a7eda598907b'; -- Newsletter Header Logo
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '21955207-48db-4962-9249-680e1556ae41'; -- Segmented Email - Retail
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = 'df7a35ee-10d1-4f1f-8202-fa14788adb3a'; -- Dedicated Email Send
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '749bfa35-35d2-41dc-934c-66e23bb5fb16'; -- Email Series Sponsorship
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = 'ad87e662-990e-41b5-805d-8bd5f1be0183'; -- Newsletter Footer Sponsorship
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '2a905c5e-a81d-4b4f-a659-9b48ac345c0d'; -- Newsletter Sponsorship - Daily (1 Week)
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '9c8bc38c-91b7-406d-8a21-0e5f196701b4'; -- Newsletter Sponsorship - Monthly
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '79c103a7-fb0f-451c-899a-e2d8fc179791'; -- Segmented Email - Corporate
UPDATE benefits SET category_id = '1c83b751-ff15-431f-87cc-66f9f8d9747d' WHERE id = '5cbfe400-6692-4272-8a3d-20d74ef32e53'; -- Weekly Digest Top Placement

-- Conference - Exhibition (64b3a447-024e-48a8-a9a5-006ceb60f0fb)
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '3b927d42-bffb-4d26-87b0-fbf818a33078'; -- Charging Station Sponsorship
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '47c4d4c5-4079-452d-acbc-a47d11c5e6a0'; -- Demo Theater Stage Time
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '767369fe-de3b-44c1-b0df-8919e05ba532'; -- VIP Booth Package
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '13e68c5b-2f43-4a8f-8f36-9b5973be7e1f'; -- Booth Space - Premium (10x10)
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = 'e7eb3a61-012b-4080-97e9-bab3a8ca7b40'; -- Booth Space - Standard (8x8)
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '219cbb69-8be8-431d-8a4e-9a5409cd957c'; -- Booth Space - Startup (6x6)
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '10c1ef4a-ba4f-4a6a-acc6-1f90e1d5e95b'; -- Demo Day Presenting Slot
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = 'ed857e4f-b7b8-4a63-8c2b-d5bd4c523877'; -- Exhibition Hall Entrance Branding
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = 'b7e3388f-3148-4074-9a48-cba303a928f3'; -- Innovation Showcase Booth
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = '740701e8-bd70-4fee-a2d5-e60e06d8fabf'; -- Networking Lounge Sponsorship
UPDATE benefits SET category_id = '64b3a447-024e-48a8-a9a5-006ceb60f0fb' WHERE id = 'aa8c367a-d854-40cd-87d3-125020616835'; -- Pop-Up Meeting Space

-- Conference - Attendee Experience (7b2556b9-f634-4936-aef6-7d7e8d22c351)
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '472b9ac8-d186-4f9e-9e5d-848c616d3ba5'; -- Conference Bag Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '5e1ab6f1-93ee-4a69-8340-80d1d3f34d37'; -- Swag Bag Insert
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '23586e54-cc4f-4a8e-b683-c31452b32775'; -- Badge Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = 'de1e57a7-6304-4993-9d68-61256a8842c7'; -- Charging Station Branding
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = 'cc9e07e8-1942-4d7d-91a1-dbf231f98622'; -- Lanyard Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = 'c305a5f7-d17b-49f7-99ef-27c1d58bd768'; -- Mobile App Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = 'a0032912-2b47-487a-ab32-21acf0337940'; -- Photo Booth Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '6290163a-27e9-45e2-9311-4c514f832119'; -- Water Bottle Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '0d1dcff9-3081-4586-aaea-c31058085f82'; -- Wayfinding Signage Sponsorship
UPDATE benefits SET category_id = '7b2556b9-f634-4936-aef6-7d7e8d22c351' WHERE id = '725d5477-4237-45eb-8770-d17134eff77f'; -- WiFi Sponsorship

-- Content & Thought Leadership (8b6bd29c-b294-443a-b5fd-5434a67be220)
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '4ebeb684-8926-4d8c-8ab7-56e6248cf128'; -- Annual State of Industry Report
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '46b3e589-3899-47e9-a053-2aa209c3fcf8'; -- Bylined Article - Executive
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = 'b39596e7-8e88-420c-a237-928e5a83ea46'; -- CEO Interview Feature
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = 'f58d84fc-5dff-4301-9c84-935ede0da347'; -- Educational Guide Co-Creation
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = 'd8d16adc-55bb-49a6-83f1-396474b192bd'; -- Industry Benchmark Study
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '622b7251-4f1f-48a4-9b68-b39a67476ebc'; -- Infographic Sponsorship
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '3a7f765b-87be-4aef-a1a9-474f5bc8af25'; -- Technical Deep Dive Article
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '27dd5045-1137-4aba-944e-608f102c5795'; -- Q&A Feature Interview
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '1f0b8cd3-1fdb-4c6d-8774-feb811a24f5b'; -- Case Study Feature
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '8898be01-d2a5-4aac-b0f1-95a5be65ea05'; -- Expert Quote in Articles
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = 'bb248e79-32d8-4580-be96-dfe6804cada2'; -- Industry Trend Report Feature
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = 'dfc4560b-7d3f-496a-9650-2a9c73b03192'; -- Op-Ed Series (3 Articles)
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '66974d00-0729-40b0-9d54-a2dd885cc3cb'; -- Research Report Sponsorship
UPDATE benefits SET category_id = '8b6bd29c-b294-443a-b5fd-5434a67be220' WHERE id = '34aadbe7-45fc-415b-9185-1bc2b195e729'; -- Whitepaper Co-Publication

-- Print Magazine (7b282abf-d17a-4735-8b31-007df64cb1a0)
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '3a7f84e6-12e2-4ede-9860-74c5c096315d'; -- Centerfold Spread
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '2f53d604-2ad1-454a-aeab-49ebc432556c'; -- Annual Subscription Insert
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '07b587be-a674-471d-a794-7d0964984759'; -- Back Cover - Full Page
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '42a453bd-dd16-49bc-82b3-57c13a7dd1a5'; -- Full Page Ad - Inside Back Cover
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '0da68f62-7426-4984-b7cf-a20d1101314b'; -- Full Page Ad - Inside Front Cover
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = 'ce48b8b2-b892-4af6-b41d-1d5f1ce080c8'; -- Full Page Ad - Interior
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '7ddcce92-701b-46b8-a05c-4716115e07ed'; -- Magazine Insert/Gatefold
UPDATE benefits SET category_id = '7b282abf-d17a-4735-8b31-007df64cb1a0' WHERE id = '7cf987ac-d5f3-4c3c-a71a-b4be9625002b'; -- Half Page Ad

-- Digital Advertising (5d5f779b-1298-409b-b91b-d023354d14ff)
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '56a3ef03-69c3-4fd4-8631-f716059f26f8'; -- Article Inline Banner
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '76953132-f1f7-4d23-ad13-337fb2a7dd2f'; -- Category Takeover - Markets
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = 'ee5f13b2-6628-453b-8ce0-a2ef9d3d9cce'; -- Category Takeover - Tech
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '72a0036a-64a7-4919-8b3a-3c05da615d99'; -- Homepage Banner - Above Fold
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = 'a1408b91-0049-4c5a-8e11-9405b33331cb'; -- Homepage Takeover - 24 Hour
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '258cef35-bdae-4691-89a6-e1f6af5b080c'; -- Mobile App Banner
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '71f3b483-4151-4f1e-a6ce-c86fa58e79bf'; -- Native Content Widget
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '1f9754f5-0968-4990-a5f2-94425eb8081c'; -- Retargeting Campaign
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '67be9e6d-2c09-4600-8969-6a244d24ebb9'; -- Sidebar Banner - Persistent
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '6cf3bc5d-5351-47f0-af74-3feca587fb65'; -- Site-Wide Footer Banner
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '57c8021c-0fad-40a4-9155-ec8a263a7395'; -- Programmatic Display Campaign
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '574f6fe3-b6fb-451e-b370-7262f7e2cb10'; -- Exit Intent Popup
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = 'abb806cb-9781-4ec7-b39d-f821fdc74564'; -- Interstitial Ad - Mobile
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '52c38c38-680f-43b5-8d3b-ca1813658f81'; -- Newsletter Banner - Weekly
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = 'b94152fb-e4a7-4915-b24c-bef360fb59c3'; -- Search Results Sponsorship
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '45b69f37-9ee5-49ef-9e77-f19605f4bee1'; -- Video Pre-Roll Ad
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = 'ae40831e-00d2-4f9d-88b5-f25ae1f64bdb'; -- Sticky Header Banner
UPDATE benefits SET category_id = '5d5f779b-1298-409b-b91b-d023354d14ff' WHERE id = '21548c68-03f1-4528-9d12-a31d022c6982'; -- Newsletter Banner - Daily

-- Conference - VIP & Networking (e2807b17-e1db-43a8-b0c8-5d1676da6105)
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = 'd4c6e206-3097-43bb-8699-e6e2fc60d0b6'; -- C-Suite Networking Dinner
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = 'e22cafc7-2fcc-4a7f-8f88-da715c9be436'; -- Executive Unconference Access
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = '3edfd471-c23e-481e-81ee-6548638c78b7'; -- Investor-Founder Mixer
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = '647ad5cf-70a2-477b-a070-7142b4732055'; -- Networking Breakfast - Hosted
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = '659ada22-066a-40a0-bb4c-3cab7bb79c15'; -- Roundtable Discussion - Private
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = '1a42b211-f24e-4541-bf9e-48493a807bca'; -- VIP All-Access Pass Package (10 passes)
UPDATE benefits SET category_id = 'e2807b17-e1db-43a8-b0c8-5d1676da6105' WHERE id = '8e04e7a8-531b-477f-adfc-75d3826d04e5'; -- VIP Meet & Greet with Speakers
