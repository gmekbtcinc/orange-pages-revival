import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Bitcoin, Award } from "lucide-react";
import type { Business } from "@/lib/businessQueries";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <Link to={`/business/${business.id}`}>
      <Card className="group h-full overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <div className="p-6">
          {/* Logo and badges */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {business.is_bfc_member && (
                <Badge variant="default" className="text-xs gap-1">
                  <Award className="h-3 w-3" />
                  BFC
                </Badge>
              )}
              {business.is_verified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {business.is_bitcoin_only && (
                <Badge variant="outline" className="text-xs gap-1 border-bitcoin-orange text-bitcoin-orange">
                  <Bitcoin className="h-3 w-3" />
                  Only
                </Badge>
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {business.name}
          </h3>

          {/* Category */}
          {business.category && (
            <p className="text-xs text-muted-foreground mb-3">
              {business.category.name}
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {business.description}
          </p>

          {/* Tags */}
          {business.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {business.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default BusinessCard;
