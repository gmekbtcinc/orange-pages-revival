-- Phase 1: Add new enum values to member_tier
ALTER TYPE member_tier ADD VALUE IF NOT EXISTS 'industry';
ALTER TYPE member_tier ADD VALUE IF NOT EXISTS 'premier';
ALTER TYPE member_tier ADD VALUE IF NOT EXISTS 'sponsor';