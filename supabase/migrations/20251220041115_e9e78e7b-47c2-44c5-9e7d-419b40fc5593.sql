-- Migration 2: Create company_benefit_overrides table
CREATE TABLE IF NOT EXISTS public.company_benefit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  period_year INT,
  quantity_override INT,
  is_unlimited_override BOOLEAN,
  override_mode TEXT NOT NULL DEFAULT 'absolute' CHECK (override_mode IN ('absolute', 'additive')),
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, benefit_id, event_id, period_year)
);

ALTER TABLE public.company_benefit_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage benefit overrides"
  ON public.company_benefit_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Team members can view their benefit overrides"
  ON public.company_benefit_overrides FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_memberships WHERE profile_id = auth.uid() AND business_id = company_benefit_overrides.business_id));

CREATE TRIGGER update_company_benefit_overrides_updated_at
  BEFORE UPDATE ON public.company_benefit_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_benefit_overrides_business ON public.company_benefit_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_benefit_overrides_benefit ON public.company_benefit_overrides(benefit_id);