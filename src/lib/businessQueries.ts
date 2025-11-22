import { supabase } from "@/integrations/supabase/client";

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
}

export const fetchFeaturedBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
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
      category:categories(id, name, slug),
      business_tags(tag:tags(id, name, slug)),
      business_services(id, service_name)
    `)
    .eq("status", "approved")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching featured businesses:", error);
    throw error;
  }

  return data.map((business) => ({
    ...business,
    tags: business.business_tags?.map((bt) => bt.tag).filter(Boolean) || [],
    services: business.business_services || [],
  }));
};

export const fetchBusinessById = async (id: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
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
      category:categories(id, name, slug),
      business_tags(tag:tags(id, name, slug)),
      business_services(id, service_name)
    `)
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching business:", error);
    throw error;
  }

  return {
    ...data,
    tags: data.business_tags?.map((bt) => bt.tag).filter(Boolean) || [],
    services: data.business_services || [],
  };
};

export const fetchAllBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
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
      category:categories(id, name, slug),
      business_tags(tag:tags(id, name, slug)),
      business_services(id, service_name)
    `)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching businesses:", error);
    throw error;
  }

  return data.map((business) => ({
    ...business,
    tags: business.business_tags?.map((bt) => bt.tag).filter(Boolean) || [],
    services: business.business_services || [],
  }));
};
