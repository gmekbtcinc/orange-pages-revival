-- Brand Tags table (BTC Inc brands)
CREATE TABLE public.brand_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benefit Categories table
CREATE TABLE public.benefit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Benefits table
CREATE TABLE public.benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.benefit_categories(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  region_multiplier DECIMAL(4,2) DEFAULT 1.0,
  image_url TEXT,
  icon TEXT,
  is_quantifiable BOOLEAN DEFAULT false,
  unit_label TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benefit Brand Tags junction table
CREATE TABLE public.benefit_brand_tags (
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE,
  brand_tag_id UUID REFERENCES public.brand_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (benefit_id, brand_tag_id)
);

-- Brand Tag Category Mappings
CREATE TABLE public.brand_tag_category_mappings (
  brand_tag_id UUID REFERENCES public.brand_tags(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.benefit_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (brand_tag_id, category_id)
);

-- Membership Tiers table
CREATE TABLE public.membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tagline TEXT,
  icon_url TEXT,
  color_hex TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membership Tracks table
CREATE TABLE public.membership_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  target_audience TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track Brand Tags junction table
CREATE TABLE public.track_brand_tags (
  track_id UUID REFERENCES public.membership_tracks(id) ON DELETE CASCADE,
  brand_tag_id UUID REFERENCES public.brand_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, brand_tag_id)
);

-- Tier Track Packages table
CREATE TABLE public.tier_track_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES public.membership_tiers(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.membership_tracks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_price DECIMAL(10,2),
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tier_id, track_id)
);

-- Package Benefits junction table
CREATE TABLE public.package_benefits (
  package_id UUID REFERENCES public.tier_track_packages(id) ON DELETE CASCADE,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_unlimited BOOLEAN DEFAULT false,
  notes TEXT,
  PRIMARY KEY (package_id, benefit_id)
);

-- Pricing Thresholds table
CREATE TABLE public.pricing_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('benefit_count', 'total_value', 'tier_based')),
  threshold_value DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  discount_label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_tag_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_track_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for all tables
CREATE POLICY "Anyone can view brand tags" ON public.brand_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view benefit categories" ON public.benefit_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view benefits" ON public.benefits FOR SELECT USING (true);
CREATE POLICY "Anyone can view benefit brand tags" ON public.benefit_brand_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view brand tag category mappings" ON public.brand_tag_category_mappings FOR SELECT USING (true);
CREATE POLICY "Anyone can view membership tiers" ON public.membership_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view membership tracks" ON public.membership_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view track brand tags" ON public.track_brand_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view tier track packages" ON public.tier_track_packages FOR SELECT USING (true);
CREATE POLICY "Anyone can view package benefits" ON public.package_benefits FOR SELECT USING (true);
CREATE POLICY "Anyone can view pricing thresholds" ON public.pricing_thresholds FOR SELECT USING (true);

-- RLS Policies: Admin full access
CREATE POLICY "Admins can manage brand tags" ON public.brand_tags FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage benefit categories" ON public.benefit_categories FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage benefits" ON public.benefits FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage benefit brand tags" ON public.benefit_brand_tags FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage brand tag category mappings" ON public.brand_tag_category_mappings FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage membership tiers" ON public.membership_tiers FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage membership tracks" ON public.membership_tracks FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage track brand tags" ON public.track_brand_tags FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage tier track packages" ON public.tier_track_packages FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage package benefits" ON public.package_benefits FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Admins can manage pricing thresholds" ON public.pricing_thresholds FOR ALL USING (is_super_admin(auth.uid()));

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('benefit-images', 'benefit-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true);

-- Storage policies for benefit-images bucket
CREATE POLICY "Benefit images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'benefit-images');
CREATE POLICY "Admins can upload benefit images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'benefit-images' AND is_super_admin(auth.uid()));
CREATE POLICY "Admins can update benefit images" ON storage.objects FOR UPDATE USING (bucket_id = 'benefit-images' AND is_super_admin(auth.uid()));
CREATE POLICY "Admins can delete benefit images" ON storage.objects FOR DELETE USING (bucket_id = 'benefit-images' AND is_super_admin(auth.uid()));

-- Storage policies for brand-logos bucket
CREATE POLICY "Brand logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'brand-logos');
CREATE POLICY "Admins can upload brand logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND is_super_admin(auth.uid()));
CREATE POLICY "Admins can update brand logos" ON storage.objects FOR UPDATE USING (bucket_id = 'brand-logos' AND is_super_admin(auth.uid()));
CREATE POLICY "Admins can delete brand logos" ON storage.objects FOR DELETE USING (bucket_id = 'brand-logos' AND is_super_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_brand_tags_updated_at BEFORE UPDATE ON public.brand_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tier_track_packages_updated_at BEFORE UPDATE ON public.tier_track_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();