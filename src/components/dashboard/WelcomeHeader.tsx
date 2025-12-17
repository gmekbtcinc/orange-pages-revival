import { useMember } from "@/contexts/member/MemberContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Ticket, Building2 } from "lucide-react";

const tierLabels: Record<string, string> = {
  silver: "Silver Member",
  gold: "Gold Member",
  platinum: "Platinum Member",
  chairman: "Chairman's Circle",
  executive: "Executive Member",
};

export function WelcomeHeader() {
  const { member, companyUser, membership, allocations } = useMember();

  // Fetch company name and logo
  const { data: business } = useQuery({
    queryKey: ["business", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return null;
      const { data } = await supabase
        .from("businesses")
        .select("name, logo_url")
        .eq("id", companyUser.business_id)
        .single();
      return data;
    },
    enabled: !!companyUser?.business_id,
  });

  // Fetch upcoming events count
  const { data: events } = useQuery({
    queryKey: ["upcoming-events-count"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id")
        .eq("is_active", true)
        .gte("start_date", today);
      return data || [];
    },
  });

  // Fetch ticket claims count
  const { data: ticketClaims } = useQuery({
    queryKey: ["ticket-claims-count", companyUser?.id],
    queryFn: async () => {
      if (!companyUser?.id) return [];
      const { data } = await supabase
        .from("ticket_claims")
        .select("id")
        .eq("company_user_id", companyUser.id);
      return data || [];
    },
    enabled: !!companyUser?.id,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = companyUser?.display_name || member?.display_name || "there";
  const firstName = displayName.split(" ")[0];
  const tier = membership?.tier || member?.tier || "industry";
  const companyName = business?.name || "Your Company";
  const companyLogo = business?.logo_url;
  const companyInitials = companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card className="bg-gradient-to-r from-bitcoin-orange/10 via-card to-card border-bitcoin-orange/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Company Logo */}
            <Avatar className="h-14 w-14 rounded-lg border border-border">
              <AvatarImage src={companyLogo || undefined} alt={companyName} className="object-cover" />
              <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {getGreeting()}, {firstName}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">{companyName}</span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" className="border-bitcoin-orange/50 text-bitcoin-orange">
                  {tierLabels[tier]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-bitcoin-orange/10">
                <Calendar className="h-5 w-5 text-bitcoin-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{events?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-bitcoin-orange/10">
                <Ticket className="h-5 w-5 text-bitcoin-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ticketClaims?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Tickets Claimed</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
