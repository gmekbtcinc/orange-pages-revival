-- Migration: Create fulfillments table
-- Tracks delivery of admin-fulfilled benefits (podcast, magazine, etc.)

CREATE TABLE IF NOT EXISTS public.fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,  -- for per_event benefits
  period_year INT,  -- for per_period benefits (e.g., 2025)

  -- Fulfillment details
  quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.profiles(id),

  -- Documentation
  title TEXT,  -- "Episode 47 - The Future of Mining"
  notes TEXT,  -- Additional details
  proof_url TEXT,  -- Link to podcast episode, magazine scan, etc.
  scheduled_date DATE,  -- For scheduled fulfillments

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all fulfillments
CREATE POLICY "Admins can manage fulfillments"
  ON public.fulfillments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Team members can view their company's fulfillments
CREATE POLICY "Team members can view their fulfillments"
  ON public.fulfillments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE profile_id = auth.uid()
        AND business_id = fulfillments.business_id
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_fulfillments_updated_at
  BEFORE UPDATE ON public.fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillments_business
  ON public.fulfillments(business_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_benefit
  ON public.fulfillments(benefit_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_event
  ON public.fulfillments(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fulfillments_period
  ON public.fulfillments(period_year) WHERE period_year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fulfillments_status
  ON public.fulfillments(status);

-- Comments
COMMENT ON TABLE public.fulfillments IS 'Tracks delivery of benefits to member companies';
COMMENT ON COLUMN public.fulfillments.status IS 'Fulfillment status: scheduled, in_progress, completed, cancelled';
COMMENT ON COLUMN public.fulfillments.proof_url IS 'Link to evidence of fulfillment (podcast episode, magazine scan, etc.)';
COMMENT ON COLUMN public.fulfillments.title IS 'Title or name of the fulfilled item (e.g., podcast episode title)';
