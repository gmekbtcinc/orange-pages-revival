import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Ticket } from "lucide-react";

export function TicketProgress() {
  const { allocations, activeCompanyId } = useUser();

  // Fetch events for allocations
  const { data: events } = useQuery({
    queryKey: ["events-for-progress"],
    queryFn: async () => {
      const eventIds = allocations.map((a) => a.event_id);
      if (eventIds.length === 0) return [];
      
      const { data } = await supabase
        .from("events")
        .select("id, name")
        .in("id", eventIds)
        .eq("is_active", true);
      return data || [];
    },
    enabled: allocations.length > 0,
  });

  // Fetch ticket claims for this company
  const { data: ticketClaims } = useQuery({
    queryKey: ["ticket-claims-progress", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data } = await supabase
        .from("ticket_claims")
        .select("event_id")
        .eq("business_id", activeCompanyId);
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  // Calculate progress for each event
  const eventProgress = allocations
    .filter((allocation) => allocation.conference_tickets && allocation.conference_tickets > 0)
    .map((allocation) => {
      const event = events?.find((e) => e.id === allocation.event_id);
      const claimed = ticketClaims?.filter((t) => t.event_id === allocation.event_id).length || 0;
      const total = allocation.conference_tickets || 0;
      const progress = total > 0 ? (claimed / total) * 100 : 0;
      const isComplete = claimed >= total;

      return {
        eventId: allocation.event_id,
        eventName: event?.name || "Event",
        claimed,
        total,
        progress,
        isComplete,
      };
    });

  if (eventProgress.length === 0) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Ticket className="h-5 w-5 text-bitcoin-orange" />
          Ticket Allocation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {eventProgress.map((item) => (
          <div key={item.eventId} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {item.eventName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.claimed} of {item.total} claimed
                </span>
                {item.isComplete && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <Progress 
              value={item.progress} 
              className="h-2 bg-muted [&>div]:bg-bitcoin-orange"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
