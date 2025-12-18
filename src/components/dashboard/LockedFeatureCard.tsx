import { LucideIcon, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LockedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefit: string;
}

export function LockedFeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  benefit 
}: LockedFeatureCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-center">
        <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-2">{benefit}</p>
        <Button size="sm" asChild>
          <a href="https://bitcoinforcorporations.com/join/" target="_blank" rel="noopener noreferrer">
            Unlock with Membership
          </a>
        </Button>
      </div>
      
      {/* Blurred content preview */}
      <CardContent className="pt-6 blur-sm pointer-events-none opacity-50 pb-24">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Fake content preview */}
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}
