-- Migration: Create company_allocation_overrides table
-- Allows admins to adjust allocations for specific companies (comps, special deals)

CREATE TABLE IF NOT EXISTS public.company_allocation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,

  -- Override mode: 'absolute' sets exact value, 'additive' adds/subtracts from tier default
  override_mode TEXT NOT NULL DEFAULT 'absolute' CHECK (override_mode IN ('absolute', 'additive')),

  -- Override amounts (NULL means use tier default for that field)
  ga_tickets_override INTEGER,
  pro_tickets_override INTEGER,
  whale_tickets_override INTEGER,
  custom_tickets_override INTEGER,
  custom_pass_name TEXT,
  symposium_seats_override INTEGER,
  vip_dinner_seats_override INTEGER,

  -- Metadata
  reason TEXT, -- e.g., "Comp tickets for sponsorship", "Special deal"
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One override per business per event
  UNIQUE(business_id, event_id)
);

-- Enable RLS
ALTER TABLE public.company_allocation_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage overrides
CREATE POLICY "Admins can manage overrides"
  ON public.company_allocation_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Business team members can view their own company's overrides
CREATE POLICY "Team members can view their overrides"
  ON public.company_allocation_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE profile_id = auth.uid()
        AND business_id = company_allocation_overrides.business_id
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_company_allocation_overrides_updated_at
  BEFORE UPDATE ON public.company_allocation_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_company_overrides_business_event
  ON public.company_allocation_overrides(business_id, event_id);

-- Comments
COMMENT ON TABLE public.company_allocation_overrides IS 'Per-company allocation adjustments for events (comps, special deals)';
COMMENT ON COLUMN public.company_allocation_overrides.override_mode IS 'absolute: use these exact values; additive: add/subtract from tier default';
COMMENT ON COLUMN public.company_allocation_overrides.reason IS 'Admin note explaining why this override exists';
