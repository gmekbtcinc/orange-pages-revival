-- Phase 3: Make member_id columns nullable for gradual deprecation

-- Make member_id nullable on ticket_claims
ALTER TABLE public.ticket_claims ALTER COLUMN member_id DROP NOT NULL;

-- Make member_id nullable on symposium_registrations
ALTER TABLE public.symposium_registrations ALTER COLUMN member_id DROP NOT NULL;

-- Make member_id nullable on speaker_applications
ALTER TABLE public.speaker_applications ALTER COLUMN member_id DROP NOT NULL;

-- Make member_id nullable on vip_dinner_rsvps
ALTER TABLE public.vip_dinner_rsvps ALTER COLUMN member_id DROP NOT NULL;

-- Make member_id nullable on member_resource_requests
ALTER TABLE public.member_resource_requests ALTER COLUMN member_id DROP NOT NULL;