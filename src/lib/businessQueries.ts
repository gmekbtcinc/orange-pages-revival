import { supabase } from "@/integrations/supabase/client";

export interface BFCMember {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  tier: string;
  member_since: string;
  category_name: string | null;
  tags: string[];
}

export const fetchBFCMembers = async (): Promise<BFCMember[]> => {
  const { data, error } = await supabase
    .from("memberships")
    .select(`
      tier,
      member_since,
      business:businesses!inner(
        id,
        name,
        description,
        logo_url,
        status,
        category:categories(name),
        business_tags(tag:tags(name))
      )
    `)
    .eq("is_active", true)
    .eq("business.status", "approved")
    .order("member_since", { ascending: true });

  if (error) {
    console.error("Error fetching BFC members:", error);
    throw error;
  }

  // Define tier ranking order
  const tierOrder: Record<string, number> = {
    chairman: 1,
    sponsor: 2,
    executive: 3,
    premier: 4,
    industry: 5,
  };

  // Transform and sort by tier, then by member_since
  const members = data
    .map((m: any) => ({
      id: m.business.id,
      name: m.business.name,
      description: m.business.description,
      logo_url: m.business.logo_url,
      tier: m.tier,
      member_since: m.member_since,
      category_name: m.business.category?.name || null,
      tags: m.business.business_tags?.map((bt: any) => bt.tag?.name).filter(Boolean).slice(0, 3) || [],
    }))
    .sort((a, b) => {
      const tierDiff = (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99);
      if (tierDiff !== 0) return tierDiff;
      return new Date(a.member_since).getTime() - new Date(b.member_since).getTime();
    });

  return members;
};

export interface Business {
  id: string;
  name: string;
  description: string;
  long_description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  founded: string | null;
  employees: string | null;
  featured: boolean;
  // New fields
  is_active: boolean;
  company_type: string | null;
  markets: string | null;
  logo_url: string | null;
  ceo_name: string | null;
  ceo_title: string | null;
  ceo_headshot_url: string | null;
  is_bitcoin_only: boolean;
  accepts_crypto: boolean;
  is_bfc_member: boolean;
  is_verified: boolean;
  is_conference_sponsor: boolean;
  btc_holdings_source: string | null;
  referral_url: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  services: Array<{
    id: string;
    service_name: string;
  }>;
  social_links: Array<{
    platform: string;
    url: string;
  }>;
  articles: Array<{
    id: string;
    title: string;
    url: string;
    source: string | null;
    published_date: string | null;
  }>;
}

const BUSINESS_SELECT = `
  id,
  name,
  description,
  long_description,
  website,
  email,
  phone,
  address,
  city,
  state,
  country,
  founded,
  employees,
  featured,
  is_active,
  company_type,
  markets,
  logo_url,
  ceo_name,
  ceo_title,
  ceo_headshot_url,
  is_bitcoin_only,
  accepts_crypto,
  is_bfc_member,
  is_verified,
  is_conference_sponsor,
  btc_holdings_source,
  referral_url,
  category:categories(id, name, slug),
  business_tags(tag:tags(id, name, slug)),
  business_services(id, service_name),
  business_social_links(platform, url),
  business_articles(id, title, url, source, published_date)
`;

const transformBusiness = (business: any): Business => ({
  ...business,
  is_active: business.is_active ?? true,
  is_bitcoin_only: business.is_bitcoin_only ?? false,
  accepts_crypto: business.accepts_crypto ?? false,
  is_bfc_member: business.is_bfc_member ?? false,
  is_verified: business.is_verified ?? false,
  is_conference_sponsor: business.is_conference_sponsor ?? false,
  tags: business.business_tags?.map((bt: any) => bt.tag).filter(Boolean) || [],
  services: business.business_services || [],
  social_links: business.business_social_links || [],
  articles: business.business_articles || [],
});

export const fetchFeaturedBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("status", "approved")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching featured businesses:", error);
    throw error;
  }

  return data.map(transformBusiness);
};

export const fetchBusinessById = async (id: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("Error fetching business:", error);
    throw error;
  }

  if (!data) return null;
  return transformBusiness(data);
};

export const fetchAllBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching businesses:", error);
    throw error;
  }

  return data.map(transformBusiness);
};
