import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";

const businesses = [
  {
    name: "Lightning Labs",
    category: "Scaling & Layer-2 Protocols",
    description: "Building the Lightning Network, enabling instant, high-volume Bitcoin transactions.",
    tags: ["Lightning", "Layer 2", "Open Source"],
    featured: true,
  },
  {
    name: "Ledger",
    category: "Wallets",
    description: "Hardware wallet for securing Bitcoin and cryptocurrency assets with bank-level security.",
    tags: ["Hardware Wallet", "Security", "Multi-sig"],
    featured: true,
  },
  {
    name: "River Financial",
    category: "Exchanges & Trading Venues",
    description: "Bitcoin-only financial institution offering trading, mining, and custody solutions.",
    tags: ["Exchange", "Custody", "Mining"],
    featured: true,
  },
  {
    name: "BTCPay Server",
    category: "Payments & Commerce",
    description: "Self-hosted, open-source cryptocurrency payment processor with zero fees.",
    tags: ["Payments", "Open Source", "Self-Hosted"],
    featured: true,
  },
];

const FeaturedBusinesses = () => {
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
                <p className="text-sm text-primary font-medium mb-3">
                  {business.category}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {business.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {business.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <Button variant="outline" className="w-full group">
                View Details
                <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBusinesses;
