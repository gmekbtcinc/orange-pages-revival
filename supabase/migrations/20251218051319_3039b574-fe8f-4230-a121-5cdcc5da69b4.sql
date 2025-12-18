-- Phase 1: Create business_submissions table for new business proposals
CREATE TABLE public.business_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_user_id uuid NOT NULL,
  submitter_email text NOT NULL,
  submitter_name text NOT NULL,
  
  -- Business data (mirrors businesses table)
  name text NOT NULL,
  description text NOT NULL,
  website text,
  city text,
  state text,
  country text,
  category_id uuid REFERENCES categories(id),
  
  -- Submission metadata
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  wants_to_claim boolean DEFAULT false,
  claim_title text,
  claim_relationship text,
  
  -- Admin review
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_business_id uuid REFERENCES businesses(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_submissions
CREATE POLICY "Users can view their own submissions"
  ON business_submissions FOR SELECT
  USING (submitter_user_id = auth.uid());

CREATE POLICY "Authenticated users can create submissions"
  ON business_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND submitter_user_id = auth.uid());

CREATE POLICY "Admins can manage all submissions"
  ON business_submissions FOR ALL
  USING (is_super_admin(auth.uid()));

-- Phase 2: Add has_linked_users column to businesses
ALTER TABLE businesses 
ADD COLUMN has_linked_users boolean DEFAULT false;

-- Function to update has_linked_users when company_users changes
CREATE OR REPLACE FUNCTION update_business_linked_users()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE businesses 
    SET has_linked_users = EXISTS (
      SELECT 1 FROM company_users 
      WHERE business_id = NEW.business_id AND is_active = true
    )
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE businesses 
    SET has_linked_users = EXISTS (
      SELECT 1 FROM company_users 
      WHERE business_id = OLD.business_id AND is_active = true
    )
    WHERE id = OLD.business_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_business_linked_users
AFTER INSERT OR UPDATE OR DELETE ON company_users
FOR EACH ROW EXECUTE FUNCTION update_business_linked_users();

-- Initialize has_linked_users for existing businesses
UPDATE businesses b
SET has_linked_users = EXISTS (
  SELECT 1 FROM company_users cu 
  WHERE cu.business_id = b.id AND cu.is_active = true
);

-- Phase 3: Create trigger to auto-upgrade permissions when membership is added
CREATE OR REPLACE FUNCTION upgrade_company_users_on_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE company_users
    SET 
      can_claim_tickets = true,
      can_register_events = true,
      can_apply_speaking = true,
      can_manage_users = (role = 'company_admin'),
      can_rsvp_dinners = true,
      can_request_resources = true,
      updated_at = now()
    WHERE business_id = NEW.business_id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_upgrade_on_membership
AFTER INSERT OR UPDATE ON memberships
FOR EACH ROW EXECUTE FUNCTION upgrade_company_users_on_membership();