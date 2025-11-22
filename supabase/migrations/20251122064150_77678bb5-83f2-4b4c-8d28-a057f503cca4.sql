-- Create enum for business verification status
CREATE TYPE public.business_status AS ENUM ('pending', 'approved', 'rejected');

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  founded TEXT,
  employees TEXT,
  featured BOOLEAN DEFAULT false,
  status public.business_status DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create business_tags junction table (many-to-many)
CREATE TABLE public.business_tags (
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (business_id, tag_id)
);

-- Create business_services table
CREATE TABLE public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_businesses_category ON public.businesses(category_id);
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_featured ON public.businesses(featured);
CREATE INDEX idx_businesses_submitted_by ON public.businesses(submitted_by);
CREATE INDEX idx_business_tags_business ON public.business_tags(business_id);
CREATE INDEX idx_business_tags_tag ON public.business_tags(tag_id);
CREATE INDEX idx_business_services_business ON public.business_services(business_id);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (read-only for everyone)
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- RLS Policies for businesses
CREATE POLICY "Approved businesses are viewable by everyone"
  ON public.businesses FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can insert their own business submissions"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own business submissions"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by);

CREATE POLICY "Users can delete their own business submissions"
  ON public.businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = submitted_by);

-- RLS Policies for tags (read-only for everyone)
CREATE POLICY "Tags are viewable by everyone"
  ON public.tags FOR SELECT
  USING (true);

-- RLS Policies for business_tags
CREATE POLICY "Business tags are viewable by everyone"
  ON public.business_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can manage tags for their own businesses"
  ON public.business_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_tags.business_id
      AND businesses.submitted_by = auth.uid()
    )
  );

-- RLS Policies for business_services
CREATE POLICY "Business services are viewable by everyone"
  ON public.business_services FOR SELECT
  USING (true);

CREATE POLICY "Users can manage services for their own businesses"
  ON public.business_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_services.business_id
      AND businesses.submitted_by = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for businesses updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 15 categories from the CSV
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Mining', 'mining', 'Bitcoin mining operations, hardware manufacturers, and mining pools', 'Pickaxe'),
  ('Exchanges & Trading Venues', 'exchanges-trading', 'Cryptocurrency exchanges and trading platforms', 'TrendingUp'),
  ('Custody & Security', 'custody-security', 'Secure storage solutions and custody services', 'Shield'),
  ('Payments & Commerce', 'payments-commerce', 'Payment processors and merchant services', 'CreditCard'),
  ('Wallets', 'wallets', 'Bitcoin wallet software and hardware solutions', 'Wallet'),
  ('Financial Services', 'financial-services', 'Banking, lending, and financial products', 'Building2'),
  ('Infrastructure & Development', 'infrastructure-development', 'Development tools and infrastructure services', 'Code'),
  ('Scaling & Layer-2 Protocols', 'scaling-layer2', 'Lightning Network and scaling solutions', 'Layers'),
  ('Analytics & Data', 'analytics-data', 'Blockchain analytics and data services', 'BarChart3'),
  ('Media & Content', 'media-content', 'News, podcasts, and educational content', 'Newspaper'),
  ('Legal & Compliance', 'legal-compliance', 'Legal services and compliance solutions', 'Scale'),
  ('Education & Research', 'education-research', 'Educational resources and research institutions', 'GraduationCap'),
  ('Events & Community', 'events-community', 'Conferences, meetups, and community organizations', 'Users'),
  ('Consulting & Advisory', 'consulting-advisory', 'Business consulting and advisory services', 'Briefcase'),
  ('Other', 'other', 'Other Bitcoin-related businesses and services', 'MoreHorizontal');