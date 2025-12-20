-- Migration 3: Create fulfillments table
CREATE TABLE IF NOT EXISTS public.fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  period_year INT,
  quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.profiles(id),
  title TEXT,
  notes TEXT,
  proof_url TEXT,
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fulfillments"
  ON public.fulfillments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Team members can view their fulfillments"
  ON public.fulfillments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_memberships WHERE profile_id = auth.uid() AND business_id = fulfillments.business_id));

CREATE TRIGGER update_fulfillments_updated_at
  BEFORE UPDATE ON public.fulfillments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_fulfillments_business ON public.fulfillments(business_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_benefit ON public.fulfillments(benefit_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON public.fulfillments(status);