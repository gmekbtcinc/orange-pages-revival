import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { Category, SearchFilters as Filters } from "@/lib/businessQueries";

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories?: Category[];
  showCategoryFilter?: boolean;
}

const SearchFiltersComponent = ({
  filters,
  onFiltersChange,
  categories = [],
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

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: value as Filters["sort"],
    });
  };

  const handleAttributeToggle = (key: "isBitcoinOnly" | "isBfcMember" | "isVerified") => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const activeFilterCount = [
    filters.isBitcoinOnly,
    filters.isBfcMember,
    filters.isVerified,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search businesses..."
          value={filters.query || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter */}
      {showCategoryFilter && categories.length > 0 && (
        <Select
          value={filters.categorySlug || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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

      {/* Sort */}
      <Select value={filters.sort || "featured"} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="name-asc">Name A-Z</SelectItem>
          <SelectItem value="name-desc">Name Z-A</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>

      {/* Attribute filters */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                {activeFilterCount}
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SearchFiltersComponent;
