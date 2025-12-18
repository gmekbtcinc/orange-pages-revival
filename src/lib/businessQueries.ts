import { supabase } from "@/integrations/supabase/client";

export interface BusinessSuggestion {
  id: string;
  name: string;
  logo_url: string | null;
  category_name: string | null;
}

export const fetchBusinessSuggestions = async (
  query: string,
  limit: number = 5
): Promise<BusinessSuggestion[]> => {
  if (!query || query.trim().length < 2) return [];

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      logo_url,
      category:categories(name)
    `)
    .eq("status", "approved")
    .eq("is_active", true)
    .ilike("name", searchTerm)
    .limit(limit);

  if (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    name: b.name,
    logo_url: b.logo_url,
    category_name: b.category?.name || null,
  }));
};

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

// Category type for directory
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  business_count: number;
}

// Fetch all categories with business counts
export const fetchCategories = async (): Promise<Category[]> => {
  // Get categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon")
    .order("name");

  if (catError) {
    console.error("Error fetching categories:", catError);
    throw catError;
  }

  // Get counts per category
  const { data: businesses, error: bizError } = await supabase
    .from("businesses")
    .select("category_id")
    .eq("status", "approved");

  if (bizError) {
    console.error("Error fetching business counts:", bizError);
    throw bizError;
  }

  // Count businesses per category
  const countMap = businesses.reduce((acc: Record<string, number>, b) => {
    if (b.category_id) {
      acc[b.category_id] = (acc[b.category_id] || 0) + 1;
    }
    return acc;
  }, {});

  return categories.map((cat) => ({
    ...cat,
    business_count: countMap[cat.id] || 0,
  }));
};

// Search filters interface
export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  country?: string;
  tags?: string[];
  isBitcoinOnly?: boolean;
  isBfcMember?: boolean;
  isVerified?: boolean;
  acceptsCrypto?: boolean;
  sort?: "featured" | "name-asc" | "name-desc" | "newest";
}

// Fetch unique countries for filter
export const fetchCountries = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("businesses")
    .select("country")
    .eq("status", "approved")
    .not("country", "is", null);

  if (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }

  const countries = [...new Set(data.map((b) => b.country).filter(Boolean))] as string[];
  return countries.sort();
};

// Fetch all tags for filter
export const fetchTags = async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }

  return data;
};

// Search businesses with filters
export const searchBusinesses = async (filters: SearchFilters): Promise<Business[]> => {
  let query = supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("status", "approved");

  // Apply expanded text search across more fields
  if (filters.query && filters.query.trim()) {
    const searchTerm = `%${filters.query.trim()}%`;
    query = query.or(
      `name.ilike.${searchTerm},description.ilike.${searchTerm},long_description.ilike.${searchTerm},city.ilike.${searchTerm},country.ilike.${searchTerm},ceo_name.ilike.${searchTerm}`
    );
  }

  // Apply country filter
  if (filters.country) {
    query = query.eq("country", filters.country);
  }

  // Apply attribute filters
  if (filters.isBitcoinOnly) {
    query = query.eq("is_bitcoin_only", true);
  }
  if (filters.isBfcMember) {
    query = query.eq("is_bfc_member", true);
  }
  if (filters.isVerified) {
    query = query.eq("is_verified", true);
  }
  if (filters.acceptsCrypto) {
    query = query.eq("accepts_crypto", true);
  }

  // Apply sorting
  switch (filters.sort) {
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "featured":
    default:
      query = query.order("featured", { ascending: false }).order("name", { ascending: true });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error searching businesses:", error);
    throw error;
  }

  let results = data.map(transformBusiness);

  // Filter by category (client-side due to join structure)
  if (filters.categorySlug) {
    results = results.filter((b) => b.category?.slug === filters.categorySlug);
  }

  // Filter by tags (client-side due to join structure)
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((b) =>
      filters.tags!.some((tagSlug) => b.tags.some((t) => t.slug === tagSlug))
    );
  }

  return results;
};

// Fetch businesses by category slug
export const fetchBusinessesByCategory = async (categorySlug: string): Promise<Business[]> => {
  return searchBusinesses({ categorySlug, sort: "featured" });
};

// Fetch category by slug
export const fetchCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching category:", error);
    throw error;
  }

  if (!data) return null;

  // Get count
  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("category_id", data.id);

  return {
    ...data,
    business_count: count || 0,
  };
};
