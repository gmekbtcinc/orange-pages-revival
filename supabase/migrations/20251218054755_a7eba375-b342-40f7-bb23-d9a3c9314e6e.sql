-- Add RLS policies to allow super admins and company users to manage businesses

-- Allow super admins to manage all businesses
CREATE POLICY "Super admins can manage all businesses"
ON businesses
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Allow company users linked to a business to update it
CREATE POLICY "Company users can update their linked business"
ON businesses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM company_users
    WHERE company_users.business_id = businesses.id
    AND company_users.user_id = auth.uid()
    AND company_users.is_active = true
    AND company_users.can_edit_profile = true
  )
);

-- Update business_social_links policies to allow linked company users
CREATE POLICY "Company users can manage social links for their linked business"
ON business_social_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_users
    WHERE company_users.business_id = business_social_links.business_id
    AND company_users.user_id = auth.uid()
    AND company_users.is_active = true
    AND company_users.can_edit_profile = true
  )
);

-- Update business_articles policies to allow linked company users  
CREATE POLICY "Company users can manage articles for their linked business"
ON business_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_users
    WHERE company_users.business_id = business_articles.business_id
    AND company_users.user_id = auth.uid()
    AND company_users.is_active = true
    AND company_users.can_edit_profile = true
  )
);