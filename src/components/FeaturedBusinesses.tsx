import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Loader2 } from "lucide-react";
import { fetchFeaturedBusinesses } from "@/lib/businessQueries";

const FeaturedBusinesses = () => {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ["featuredBusinesses"],
    queryFn: fetchFeaturedBusinesses,
  });
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Featured Businesses
            </h2>
            <p className="text-muted-foreground">
              Spotlight on leading Bitcoin companies and services
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex">
            View All
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map((business, index) => (
            <Card key={index} className="relative p-6 hover:shadow-lg transition-shadow duration-300 border-border">
              {business.featured && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">{business.name}</h3>
                {business.category && (
                  <p className="text-sm text-primary font-medium mb-3">
                    {business.category.name}
                  </p>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {business.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {business.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
              
              <Link to={`/business/${business.id}`}>
                <Button variant="outline" className="w-full group">
                  View Details
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </Card>
          ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No featured businesses available at the moment.
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedBusinesses;
