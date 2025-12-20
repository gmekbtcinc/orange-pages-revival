-- Migration 4: Create company_allocation_overrides table
CREATE TABLE IF NOT EXISTS public.company_allocation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  override_mode TEXT NOT NULL DEFAULT 'absolute' CHECK (override_mode IN ('absolute', 'additive')),
  ga_tickets_override INTEGER,
  pro_tickets_override INTEGER,
  whale_tickets_override INTEGER,
  custom_tickets_override INTEGER,
  custom_pass_name TEXT,
  symposium_seats_override INTEGER,
  vip_dinner_seats_override INTEGER,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, event_id)
);

ALTER TABLE public.company_allocation_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage overrides"
  ON public.company_allocation_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Team members can view their overrides"
  ON public.company_allocation_overrides FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_memberships WHERE profile_id = auth.uid() AND business_id = company_allocation_overrides.business_id));

CREATE TRIGGER update_company_allocation_overrides_updated_at
  BEFORE UPDATE ON public.company_allocation_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_company_overrides_business_event ON public.company_allocation_overrides(business_id, event_id);