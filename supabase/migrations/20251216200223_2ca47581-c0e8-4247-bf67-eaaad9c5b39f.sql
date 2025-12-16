-- Create company_type enum
CREATE TYPE public.company_type AS ENUM ('public', 'private', 'subsidiary');

-- Add new columns to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS company_type public.company_type DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS markets text,
  ADD COLUMN IF NOT EXISTS ceo_name text,
  ADD COLUMN IF NOT EXISTS ceo_title text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS ceo_headshot_url text,
  ADD COLUMN IF NOT EXISTS is_bitcoin_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_crypto boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bfc_member boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS btc_holdings_source text,
  ADD COLUMN IF NOT EXISTS referral_url text,
  ADD COLUMN IF NOT EXISTS is_conference_sponsor boolean DEFAULT false;

-- Create business_social_links table
CREATE TABLE public.business_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (business_id, platform)
);

-- Create business_articles table
CREATE TABLE public.business_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  published_date date,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.business_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_articles ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_social_links
CREATE POLICY "Social links are viewable by everyone"
ON public.business_social_links FOR SELECT
USING (true);

CREATE POLICY "Users can manage social links for their own businesses"
ON public.business_social_links FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = business_social_links.business_id
  AND businesses.submitted_by = auth.uid()
));

-- RLS policies for business_articles
CREATE POLICY "Articles are viewable by everyone"
ON public.business_articles FOR SELECT
USING (true);

CREATE POLICY "Users can manage articles for their own businesses"
ON public.business_articles FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses
  WHERE businesses.id = business_articles.business_id
  AND businesses.submitted_by = auth.uid()
));

-- Create storage bucket for business assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-assets bucket
CREATE POLICY "Business assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-assets');

CREATE POLICY "Users can upload business assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own business assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);