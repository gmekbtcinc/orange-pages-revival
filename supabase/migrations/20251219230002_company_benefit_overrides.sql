-- Migration: Create company_benefit_overrides table
-- Allows admins to customize benefit allocations per company (beyond package defaults)

CREATE TABLE IF NOT EXISTS public.company_benefit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,  -- for per_event benefits
  period_year INT,  -- for per_period benefits (e.g., 2025)

  -- Override values
  quantity_override INT,
  is_unlimited_override BOOLEAN,
  override_mode TEXT NOT NULL DEFAULT 'absolute' CHECK (override_mode IN ('absolute', 'additive')),

  -- Metadata
  reason TEXT,  -- "Negotiated in sales", "Comp for issue X"
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint per business + benefit + context
  UNIQUE(business_id, benefit_id, event_id, period_year)
);

-- Enable RLS
ALTER TABLE public.company_benefit_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage overrides
CREATE POLICY "Admins can manage benefit overrides"
  ON public.company_benefit_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Team members can view their company's overrides
CREATE POLICY "Team members can view their benefit overrides"
  ON public.company_benefit_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE profile_id = auth.uid()
        AND business_id = company_benefit_overrides.business_id
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_company_benefit_overrides_updated_at
  BEFORE UPDATE ON public.company_benefit_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benefit_overrides_business
  ON public.company_benefit_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_benefit_overrides_benefit
  ON public.company_benefit_overrides(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefit_overrides_event
  ON public.company_benefit_overrides(event_id) WHERE event_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.company_benefit_overrides IS 'Per-company benefit allocation overrides (custom sales deals)';
COMMENT ON COLUMN public.company_benefit_overrides.override_mode IS 'absolute: use this exact value; additive: add/subtract from package default';
COMMENT ON COLUMN public.company_benefit_overrides.period_year IS 'For per_period benefits, which membership year this applies to';
