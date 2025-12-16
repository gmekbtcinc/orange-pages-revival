-- ============================================================================
-- BFC MEMBER DASHBOARD SCHEMA EXTENSION
-- ============================================================================

-- ENUMS
CREATE TYPE public.member_tier AS ENUM ('silver', 'gold', 'platinum', 'chairman', 'executive');
CREATE TYPE public.event_type AS ENUM ('flagship', 'regional', 'secondary');
CREATE TYPE public.speaker_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted');
CREATE TYPE public.rsvp_status AS ENUM ('pending', 'confirmed', 'declined', 'waitlisted', 'cancelled');

-- MEMBERS TABLE
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  title TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  tier public.member_tier NOT NULL DEFAULT 'silver',
  member_since DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_date DATE,
  next_payment_due DATE,
  payment_amount_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_primary_contact BOOLEAN DEFAULT true,
  hubspot_contact_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EVENTS TABLE
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  event_type public.event_type NOT NULL DEFAULT 'regional',
  description TEXT,
  location_name TEXT,
  location_city TEXT,
  location_country TEXT,
  external_url TEXT,
  start_date DATE,
  end_date DATE,
  has_symposium BOOLEAN DEFAULT false,
  symposium_date DATE,
  symposium_venue TEXT,
  has_vip_dinner BOOLEAN DEFAULT false,
  vip_dinner_date DATE,
  vip_dinner_venue TEXT,
  vip_dinner_time TEXT,
  speaking_applications_open BOOLEAN DEFAULT false,
  speaking_deadline DATE,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EVENT ALLOCATIONS
CREATE TABLE public.event_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  tier public.member_tier NOT NULL,
  conference_tickets INTEGER DEFAULT 0,
  symposium_seats INTEGER DEFAULT 0,
  vip_dinner_seats INTEGER DEFAULT 0,
  UNIQUE(event_id, tier),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TICKET CLAIMS
CREATE TABLE public.ticket_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_title TEXT,
  attendee_company TEXT,
  status public.rsvp_status DEFAULT 'pending',
  ticket_code TEXT UNIQUE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT
);

-- SYMPOSIUM REGISTRATIONS
CREATE TABLE public.symposium_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_title TEXT,
  attendee_company TEXT,
  dietary_requirements TEXT,
  accessibility_needs TEXT,
  status public.rsvp_status DEFAULT 'pending',
  registration_code TEXT UNIQUE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(member_id, event_id, attendee_email)
);

-- SPEAKER APPLICATIONS
CREATE TABLE public.speaker_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  speaker_name TEXT NOT NULL,
  speaker_title TEXT,
  speaker_company TEXT,
  speaker_email TEXT NOT NULL,
  speaker_bio TEXT,
  speaker_headshot_url TEXT,
  format TEXT NOT NULL CHECK (format IN ('panel', 'keynote', 'fireside', 'workshop')),
  proposed_topic TEXT NOT NULL,
  session_description TEXT,
  target_audience TEXT,
  previous_speaking TEXT,
  av_requirements TEXT,
  status public.speaker_status DEFAULT 'draft',
  admin_notes TEXT,
  airtable_record_id TEXT,
  synced_to_airtable_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VIP DINNER RSVPS
CREATE TABLE public.vip_dinner_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_title TEXT,
  guest_company TEXT,
  dietary_requirements TEXT,
  seating_preferences TEXT,
  status public.rsvp_status DEFAULT 'pending',
  confirmation_code TEXT UNIQUE,
  rsvp_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(member_id, event_id, guest_email)
);

-- MEMBER RESOURCE REQUESTS
CREATE TABLE public.member_resource_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('podcast_booking', 'magazine_order', 'twitter_space', 'newsletter_feature', 'partnership_inquiry')),
  request_details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  admin_notes TEXT,
  completed_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_members_user ON public.members(user_id);
CREATE INDEX idx_members_business ON public.members(business_id);
CREATE INDEX idx_members_tier ON public.members(tier);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_ticket_claims_member ON public.ticket_claims(member_id);
CREATE INDEX idx_ticket_claims_event ON public.ticket_claims(event_id);
CREATE INDEX idx_symposium_reg_member ON public.symposium_registrations(member_id);
CREATE INDEX idx_symposium_reg_event ON public.symposium_registrations(event_id);
CREATE INDEX idx_speaker_apps_member ON public.speaker_applications(member_id);
CREATE INDEX idx_speaker_apps_event ON public.speaker_applications(event_id);
CREATE INDEX idx_vip_dinner_member ON public.vip_dinner_rsvps(member_id);
CREATE INDEX idx_vip_dinner_event ON public.vip_dinner_rsvps(event_id);
CREATE INDEX idx_resource_requests_member ON public.member_resource_requests(member_id);

-- ROW LEVEL SECURITY
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symposium_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_dinner_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_resource_requests ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view their own member record" ON public.members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own member record" ON public.members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Active events are viewable by everyone" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Allocations viewable by authenticated users" ON public.event_allocations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own ticket claims" ON public.ticket_claims FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create ticket claims" ON public.ticket_claims FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own ticket claims" ON public.ticket_claims FOR UPDATE TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own symposium registrations" ON public.symposium_registrations FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create symposium registrations" ON public.symposium_registrations FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own symposium registrations" ON public.symposium_registrations FOR UPDATE TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own speaker applications" ON public.speaker_applications FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create speaker applications" ON public.speaker_applications FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own speaker applications" ON public.speaker_applications FOR UPDATE TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own VIP dinner RSVPs" ON public.vip_dinner_rsvps FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create VIP dinner RSVPs" ON public.vip_dinner_rsvps FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own VIP dinner RSVPs" ON public.vip_dinner_rsvps FOR UPDATE TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own resource requests" ON public.member_resource_requests FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create resource requests" ON public.member_resource_requests FOR INSERT TO authenticated WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

-- TRIGGERS (reuse existing function)
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_speaker_applications_updated_at BEFORE UPDATE ON public.speaker_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resource_requests_updated_at BEFORE UPDATE ON public.member_resource_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED EVENTS
INSERT INTO public.events (name, slug, subtitle, event_type, location_city, location_country, external_url, has_symposium, has_vip_dinner, speaking_applications_open, is_active, is_featured) VALUES
  ('Bitcoin 2026', 'bitcoin-2026', 'Flagship Conference', 'flagship', 'Las Vegas', 'USA', 'https://b.tc/conference/2026', true, true, true, true, true),
  ('Bitcoin Asia', 'bitcoin-asia', 'Hong Kong', 'regional', 'Hong Kong', 'China', 'https://asia.b.tc/', true, true, true, true, false),
  ('Bitcoin Amsterdam', 'bitcoin-amsterdam', 'Europe', 'regional', 'Amsterdam', 'Netherlands', 'https://www.bitcoin.amsterdam/', true, true, true, true, false),
  ('Bitcoin MENA', 'bitcoin-mena', 'Middle East', 'regional', 'Abu Dhabi', 'UAE', 'https://mena.b.tc/', true, true, true, true, false),
  ('BFC in DC', 'bfc-dc', 'Washington DC', 'secondary', 'Washington DC', 'USA', NULL, false, false, false, true, false),
  ('StrategyWorld', 'strategyworld', 'Virtual', 'secondary', NULL, NULL, NULL, false, false, false, true, false);

-- SEED ALLOCATIONS FOR EACH TIER
INSERT INTO public.event_allocations (event_id, tier, conference_tickets, symposium_seats, vip_dinner_seats)
SELECT e.id, 'executive'::public.member_tier, CASE WHEN e.event_type = 'flagship' THEN 8 ELSE 4 END, CASE WHEN e.has_symposium THEN 4 ELSE 0 END, CASE WHEN e.has_vip_dinner THEN 4 ELSE 0 END FROM public.events e;

INSERT INTO public.event_allocations (event_id, tier, conference_tickets, symposium_seats, vip_dinner_seats)
SELECT e.id, 'chairman'::public.member_tier, CASE WHEN e.event_type = 'flagship' THEN 10 ELSE 5 END, CASE WHEN e.has_symposium THEN 5 ELSE 0 END, CASE WHEN e.has_vip_dinner THEN 5 ELSE 0 END FROM public.events e;

INSERT INTO public.event_allocations (event_id, tier, conference_tickets, symposium_seats, vip_dinner_seats)
SELECT e.id, 'platinum'::public.member_tier, CASE WHEN e.event_type = 'flagship' THEN 6 ELSE 3 END, CASE WHEN e.has_symposium THEN 3 ELSE 0 END, CASE WHEN e.has_vip_dinner THEN 2 ELSE 0 END FROM public.events e;

INSERT INTO public.event_allocations (event_id, tier, conference_tickets, symposium_seats, vip_dinner_seats)
SELECT e.id, 'gold'::public.member_tier, CASE WHEN e.event_type = 'flagship' THEN 4 ELSE 2 END, CASE WHEN e.has_symposium THEN 2 ELSE 0 END, CASE WHEN e.has_vip_dinner THEN 1 ELSE 0 END FROM public.events e;

INSERT INTO public.event_allocations (event_id, tier, conference_tickets, symposium_seats, vip_dinner_seats)
SELECT e.id, 'silver'::public.member_tier, CASE WHEN e.event_type = 'flagship' THEN 2 ELSE 1 END, CASE WHEN e.has_symposium THEN 1 ELSE 0 END, 0 FROM public.events e;