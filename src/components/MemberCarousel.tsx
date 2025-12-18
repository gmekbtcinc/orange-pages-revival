import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import { ExternalLink, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBFCMembers } from "@/lib/businessQueries";
import bfcLogo from "@/assets/bfc-logo.png";

const tierLabels: Record<string, string> = {
  chairman: "Chairman's Circle",
  sponsor: "Sponsor",
  executive: "Executive",
  premier: "Premier",
  industry: "Industry",
};

const MemberCarousel = () => {
  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const { data: members, isLoading } = useQuery({
    queryKey: ["bfc-members"],
    queryFn: fetchBFCMembers,
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={bfcLogo} alt="BFC" className="h-8 w-auto" />
            <h2 className="text-2xl font-bold text-foreground">
              Bitcoin for Corporations Members
            </h2>
          </div>
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-80 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!members || members.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={bfcLogo} alt="BFC" className="h-8 w-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Bitcoin for Corporations Members
          </h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {members.map((member) => (
              <CarouselItem
                key={member.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full bg-card border-border hover:border-bitcoin-orange/50 transition-colors">
                  <CardContent className="p-5">
                    {/* Header with logo and tier badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {member.logo_url ? (
                          <img
                            src={member.logo_url}
                            alt={member.name}
                            className="h-10 w-10 rounded object-contain bg-white p-1"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {member.name}
                          </h3>
                          {member.category_name && (
                            <span className="text-sm text-bitcoin-orange">
                              {member.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-bitcoin-orange text-white text-xs shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        {tierLabels[member.tier] || member.tier}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                      {member.description}
                    </p>

                    {/* Tags */}
                    {member.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {member.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-border text-muted-foreground"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Button
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-bitcoin-orange/10 hover:border-bitcoin-orange hover:text-bitcoin-orange"
                      asChild
                    >
                      <Link to={`/business/${member.id}`}>
                        View Details
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {members.length} companies powering Bitcoin adoption
        </p>
      </div>
    </section>
  );
};

export default MemberCarousel;
