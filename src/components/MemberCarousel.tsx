import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { fetchBFCMembers, type BFCMember } from "@/lib/businessQueries";
import { Skeleton } from "@/components/ui/skeleton";
import bfcLogo from "@/assets/bfc-logo.png";

const tierColors: Record<string, string> = {
  chairman: "border-amber-500",
  sponsor: "border-purple-500",
  executive: "border-blue-500",
  premier: "border-emerald-500",
  industry: "border-slate-400",
};

const MemberCarousel = () => {
  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
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
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-lg" />
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
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {members.map((member) => (
              <CarouselItem
                key={member.id}
                className="pl-2 md:pl-4 basis-1/3 md:basis-1/5 lg:basis-1/6"
              >
                <Link
                  to={`/business/${member.id}`}
                  className="block group"
                >
                  <div
                    className={`relative aspect-square rounded-lg border-2 ${
                      tierColors[member.tier] || "border-border"
                    } bg-card overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg`}
                  >
                    {member.logo_url ? (
                      <img
                        src={member.logo_url}
                        alt={member.name}
                        className="w-full h-full object-contain p-3"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-3xl font-bold text-muted-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Hover overlay with name */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
                      <span className="text-xs font-medium text-white text-center line-clamp-2">
                        {member.name}
                      </span>
                    </div>
                  </div>
                </Link>
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
