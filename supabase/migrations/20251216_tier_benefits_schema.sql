-- Migration: Add tier/benefits schema from btc-deal-architect
-- This adds tables for managing membership tiers, benefits, packages, and pricing

-- Create enums
DO $$ BEGIN
    CREATE TYPE package_status AS ENUM ('active', 'draft', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Brand tags table (BTC Inc brands like Bitcoin Magazine, etc.)
CREATE TABLE IF NOT EXISTS brand_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benefit categories table
CREATE TABLE IF NOT EXISTS benefit_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benefits table (membership benefits/inclusions)
CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    description TEXT,
    benefit_category_id UUID NOT NULL REFERENCES benefit_categories(id) ON DELETE CASCADE,
    sub_category TEXT,
    block_value NUMERIC,
    base_price NUMERIC DEFAULT 0,
    region_multiplier NUMERIC DEFAULT 1.0,
    is_add_on BOOLEAN DEFAULT false,
    inventory_limit TEXT,
    internal_notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benefit to brand tag junction table
CREATE TABLE IF NOT EXISTS benefit_brand_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
    brand_tag_id UUID NOT NULL REFERENCES brand_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(benefit_id, brand_tag_id)
);

-- Brand tag to category mappings
CREATE TABLE IF NOT EXISTS brand_tag_category_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_tag_id UUID NOT NULL REFERENCES brand_tags(id) ON DELETE CASCADE,
    benefit_category_id UUID NOT NULL REFERENCES benefit_categories(id) ON DELETE CASCADE,
    sub_category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(brand_tag_id, benefit_category_id, sub_category)
);

-- Membership tiers table (replaces simple tier enum)
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    base_annual_price NUMERIC NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    icon_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membership tracks table (different membership types/paths)
CREATE TABLE IF NOT EXISTS membership_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track to brand tag junction table
CREATE TABLE IF NOT EXISTS track_brand_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES membership_tracks(id) ON DELETE CASCADE,
    brand_tag_id UUID NOT NULL REFERENCES brand_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(track_id, brand_tag_id)
);

-- Tier/Track packages (pre-configured benefit bundles)
CREATE TABLE IF NOT EXISTS tier_track_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id UUID NOT NULL REFERENCES membership_tiers(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES membership_tracks(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    description TEXT,
    annual_price_override NUMERIC,
    term_default_years INTEGER DEFAULT 1,
    benefits JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status package_status DEFAULT 'draft',
    usage_count INTEGER DEFAULT 0,
    cloned_from_id UUID REFERENCES tier_track_packages(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing thresholds for dynamic discounts
CREATE TABLE IF NOT EXISTS pricing_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold_type TEXT NOT NULL, -- 'benefit_count', 'total_value', 'tier_based'
    threshold_value NUMERIC NOT NULL,
    discount_percentage NUMERIC DEFAULT 0,
    discount_label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benefits_category ON benefits(benefit_category_id);
CREATE INDEX IF NOT EXISTS idx_benefits_sub_category ON benefits(sub_category);
CREATE INDEX IF NOT EXISTS idx_benefit_brand_tags_benefit ON benefit_brand_tags(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefit_brand_tags_brand ON benefit_brand_tags(brand_tag_id);
CREATE INDEX IF NOT EXISTS idx_tier_track_packages_tier ON tier_track_packages(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_track_packages_track ON tier_track_packages(track_id);
CREATE INDEX IF NOT EXISTS idx_tier_track_packages_status ON tier_track_packages(status);
CREATE INDEX IF NOT EXISTS idx_pricing_thresholds_active ON pricing_thresholds(is_active);

-- Enable RLS on all new tables
ALTER TABLE brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_tag_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_brand_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_track_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON brand_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON benefit_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON benefits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON benefit_brand_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON brand_tag_category_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON membership_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON membership_tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON track_brand_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON tier_track_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON pricing_thresholds FOR SELECT TO authenticated USING (true);

-- RLS Policies: Full access for admins (via admins table)
CREATE POLICY "Allow admin full access" ON brand_tags FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON benefit_categories FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON benefits FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON benefit_brand_tags FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON brand_tag_category_mappings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON membership_tiers FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON membership_tracks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON track_brand_tags FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON tier_track_packages FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin full access" ON pricing_thresholds FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true));

-- Function to increment package usage count
CREATE OR REPLACE FUNCTION increment_package_usage(package_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE tier_track_packages
    SET usage_count = usage_count + 1
    WHERE id = package_id;
END;
$$;

-- Insert default benefit categories
INSERT INTO benefit_categories (name, description, display_order) VALUES
    ('Events', 'Conference and event access benefits', 1),
    ('Media', 'Media and content benefits', 2),
    ('Advertising', 'Advertising and promotional benefits', 3),
    ('Networking', 'Networking and community benefits', 4),
    ('Support', 'Support and service benefits', 5)
ON CONFLICT DO NOTHING;

-- Insert default membership tiers (matching existing tier enum values)
INSERT INTO membership_tiers (name, base_annual_price, display_order, description) VALUES
    ('explorer', 5000, 1, 'Entry-level membership with basic benefits'),
    ('builder', 15000, 2, 'Mid-tier membership with enhanced benefits'),
    ('hodler', 35000, 3, 'Premium membership with comprehensive benefits'),
    ('whale', 75000, 4, 'Elite membership with all benefits included')
ON CONFLICT (name) DO UPDATE SET
    base_annual_price = EXCLUDED.base_annual_price,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description;

-- Insert default membership tracks
INSERT INTO membership_tracks (name, description, display_order) VALUES
    ('Standard', 'Standard membership track', 1),
    ('Enterprise', 'Enterprise membership track for larger organizations', 2),
    ('Startup', 'Startup-focused membership track', 3)
ON CONFLICT (name) DO NOTHING;

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_brand_tags_updated_at ON brand_tags;
CREATE TRIGGER update_brand_tags_updated_at BEFORE UPDATE ON brand_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benefit_categories_updated_at ON benefit_categories;
CREATE TRIGGER update_benefit_categories_updated_at BEFORE UPDATE ON benefit_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benefits_updated_at ON benefits;
CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON benefits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_tiers_updated_at ON membership_tiers;
CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_tracks_updated_at ON membership_tracks;
CREATE TRIGGER update_membership_tracks_updated_at BEFORE UPDATE ON membership_tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tier_track_packages_updated_at ON tier_track_packages;
CREATE TRIGGER update_tier_track_packages_updated_at BEFORE UPDATE ON tier_track_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_thresholds_updated_at ON pricing_thresholds;
CREATE TRIGGER update_pricing_thresholds_updated_at BEFORE UPDATE ON pricing_thresholds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
