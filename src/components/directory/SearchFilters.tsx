import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchAutocomplete from "./SearchAutocomplete";
import type { Category, SearchFilters as Filters } from "@/lib/businessQueries";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories?: Category[];
  countries?: string[];
  tags?: Tag[];
  showCategoryFilter?: boolean;
}

const SearchFiltersComponent = ({
  filters,
  onFiltersChange,
  categories = [],
  countries = [],
  tags = [],
  showCategoryFilter = true,
}: SearchFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, query: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categorySlug: value === "all" ? undefined : value,
    });
  };

  const handleCountryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      country: value === "all" ? undefined : value,
    });
  };

  const handleTagToggle = (tagSlug: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagSlug)
      ? currentTags.filter((t) => t !== tagSlug)
      : [...currentTags, tagSlug];
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: value as Filters["sort"],
    });
  };

  const handleAttributeToggle = (
    key: "isBitcoinOnly" | "isBfcMember" | "isVerified" | "acceptsCrypto"
  ) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: "",
      categorySlug: undefined,
      country: undefined,
      tags: undefined,
      isBitcoinOnly: false,
      isBfcMember: false,
      isVerified: false,
      acceptsCrypto: false,
      sort: "featured",
    });
  };

  const activeAttributeCount = [
    filters.isBitcoinOnly,
    filters.isBfcMember,
    filters.isVerified,
    filters.acceptsCrypto,
  ].filter(Boolean).length;

  const activeTagCount = filters.tags?.length || 0;

  const hasActiveFilters =
    filters.query ||
    filters.categorySlug ||
    filters.country ||
    activeTagCount > 0 ||
    activeAttributeCount > 0 ||
    (filters.sort && filters.sort !== "featured");

  return (
    <div className="space-y-4">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input with autocomplete */}
        <SearchAutocomplete
          value={filters.query || ""}
          onChange={handleSearchChange}
        />

        {/* Category filter */}
        {showCategoryFilter && categories.length > 0 && (
          <Select
            value={filters.categorySlug || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name} ({cat.business_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Country filter */}
        {countries.length > 0 && (
          <Select
            value={filters.country || "all"}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={filters.sort || "featured"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>

        {/* Tags filter dropdown */}
        {tags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Tags
                {activeTagCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                    {activeTagCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={filters.tags?.includes(tag.slug)}
                  onCheckedChange={() => handleTagToggle(tag.slug)}
                >
                  {tag.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Attribute filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeAttributeCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                  {activeAttributeCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Attributes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.isBitcoinOnly}
              onCheckedChange={() => handleAttributeToggle("isBitcoinOnly")}
            >
              Bitcoin Only
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.isBfcMember}
              onCheckedChange={() => handleAttributeToggle("isBfcMember")}
            >
              BFC Member
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.isVerified}
              onCheckedChange={() => handleAttributeToggle("isVerified")}
            >
              Verified
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.acceptsCrypto}
              onCheckedChange={() => handleAttributeToggle("acceptsCrypto")}
            >
              Accepts Crypto
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {(activeTagCount > 0 || filters.country || activeAttributeCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.country && (
            <Badge variant="secondary" className="gap-1">
              {filters.country}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, country: undefined })}
              />
            </Badge>
          )}
          {filters.tags?.map((tagSlug) => {
            const tag = tags.find((t) => t.slug === tagSlug);
            return tag ? (
              <Badge key={tagSlug} variant="secondary" className="gap-1">
                {tag.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleTagToggle(tagSlug)}
                />
              </Badge>
            ) : null;
          })}
          {filters.isBitcoinOnly && (
            <Badge variant="secondary" className="gap-1">
              Bitcoin Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAttributeToggle("isBitcoinOnly")}
              />
            </Badge>
          )}
          {filters.isBfcMember && (
            <Badge variant="secondary" className="gap-1">
              BFC Member
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAttributeToggle("isBfcMember")}
              />
            </Badge>
          )}
          {filters.isVerified && (
            <Badge variant="secondary" className="gap-1">
              Verified
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAttributeToggle("isVerified")}
              />
            </Badge>
          )}
          {filters.acceptsCrypto && (
            <Badge variant="secondary" className="gap-1">
              Accepts Crypto
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAttributeToggle("acceptsCrypto")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFiltersComponent;
