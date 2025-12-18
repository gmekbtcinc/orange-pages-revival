import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/directory/SearchFilters";
import BusinessGrid from "@/components/directory/BusinessGrid";
import { Button } from "@/components/ui/button";
import {
  searchBusinesses,
  fetchCategoryBySlug,
  type SearchFilters as Filters,
} from "@/lib/businessQueries";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [filters, setFilters] = useState<Filters>({
    categorySlug: slug,
    sort: "featured",
  });

  // Keep category slug synced
  useEffect(() => {
    setFilters((prev) => ({ ...prev, categorySlug: slug }));
  }, [slug]);

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => fetchCategoryBySlug(slug!),
    enabled: !!slug,
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
    [debouncedQuery, filters.categorySlug, filters.sort, filters.isBitcoinOnly, filters.isBfcMember, filters.isVerified]
  );

  // Fetch businesses
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ["businesses", "category", searchKey],
    queryFn: () => searchBusinesses(searchKey),
    enabled: !!slug,
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <Button asChild>
              <Link to="/directory">Browse All Businesses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-secondary py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/directory" className="hover:text-foreground transition-colors">
                Directory
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-secondary-foreground font-medium">{category.name}</span>
            </nav>

            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/directory">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Directory
              </Link>
            </Button>

            <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-muted-foreground max-w-2xl">{category.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {category.business_count} business{category.business_count !== 1 ? "es" : ""}
            </p>
          </div>
        </section>

        {/* Filters and results */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Filters (without category selector) */}
            <div className="mb-8">
              <SearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                showCategoryFilter={false}
              />
            </div>

            {/* Results count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {businessesLoading
                  ? "Loading..."
                  : `Showing ${businesses.length} business${businesses.length !== 1 ? "es" : ""}`}
              </p>
            </div>

            {/* Grid */}
            <BusinessGrid
              businesses={businesses}
              isLoading={businessesLoading}
              emptyMessage={`No businesses found in ${category.name}`}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
