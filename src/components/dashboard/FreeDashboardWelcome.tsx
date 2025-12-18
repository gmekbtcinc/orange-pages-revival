import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMember } from "@/contexts/member/MemberContext";

export function FreeDashboardWelcome() {
  const { companyUser } = useMember();
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-lg bg-card border border-border">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {companyUser?.display_name?.split(" ")[0] || "there"}
          </h1>
          <Badge variant="outline" className="text-muted-foreground">
            Free Account
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage your business listing on the Orange Pages directory
        </p>
      </div>
      
      <Button asChild className="gap-2 shrink-0">
        <a href="https://bitcoinforcorporations.com/join/" target="_blank" rel="noopener noreferrer">
          <Award className="h-4 w-4" />
          Become a Member
        </a>
      </Button>
    </div>
  );
}
