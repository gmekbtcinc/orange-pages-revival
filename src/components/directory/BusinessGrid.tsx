import { Search } from "lucide-react";
import BusinessCard from "./BusinessCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Business } from "@/lib/businessQueries";

interface BusinessGridProps {
  businesses: Business[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const BusinessGrid = ({
  businesses,
  isLoading,
  emptyMessage = "No businesses found",
}: BusinessGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
};

export default BusinessGrid;
