import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/directory/SearchFilters";
import BusinessGrid from "@/components/directory/BusinessGrid";
import {
  searchBusinesses,
  fetchCategories,
  fetchCountries,
  fetchTags,
  type SearchFilters as Filters,
} from "@/lib/businessQueries";

const Directory = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL
  const [filters, setFilters] = useState<Filters>(() => ({
    query: searchParams.get("search") || "",
    categorySlug: searchParams.get("category") || undefined,
    country: searchParams.get("country") || undefined,
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
    sort: (searchParams.get("sort") as Filters["sort"]) || "featured",
    isBitcoinOnly: searchParams.get("bitcoinOnly") === "true",
    isBfcMember: searchParams.get("bfcMember") === "true",
    isVerified: searchParams.get("verified") === "true",
    acceptsCrypto: searchParams.get("acceptsCrypto") === "true",
  }));

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("search", filters.query);
    if (filters.categorySlug) params.set("category", filters.categorySlug);
    if (filters.country) params.set("country", filters.country);
    if (filters.tags && filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
    if (filters.isBitcoinOnly) params.set("bitcoinOnly", "true");
    if (filters.isBfcMember) params.set("bfcMember", "true");
    if (filters.isVerified) params.set("verified", "true");
    if (filters.acceptsCrypto) params.set("acceptsCrypto", "true");
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Fetch countries
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filters.query), 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Search query key
  const searchKey = useMemo(
    () => ({
      ...filters,
      query: debouncedQuery,
    }),
    [
      debouncedQuery,
      filters.categorySlug,
      filters.country,
      filters.tags,
      filters.sort,
      filters.isBitcoinOnly,
      filters.isBfcMember,
      filters.isVerified,
      filters.acceptsCrypto,
    ]
  );

  // Fetch businesses
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["businesses", "search", searchKey],
    queryFn: () => searchBusinesses(searchKey),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-secondary py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-2">
              Browse Directory
            </h1>
            <p className="text-muted-foreground">
              Discover Bitcoin businesses and services
            </p>
          </div>
        </section>

        {/* Filters and results */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="mb-8">
              <SearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                countries={countries}
                tags={tags}
              />
            </div>

            {/* Results count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Searching..."
                  : `Showing ${businesses.length} business${businesses.length !== 1 ? "es" : ""}`}
              </p>
            </div>

            {/* Grid */}
            <BusinessGrid businesses={businesses} isLoading={isLoading} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Directory;
