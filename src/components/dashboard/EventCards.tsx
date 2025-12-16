import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/contexts/MemberContext";
import { EventCard } from "./EventCard";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export function EventCards() {
  const { member, allocations } = useMember();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Your Events</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 bg-card border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Separate primary (flagship/regional) and secondary events
  const primaryEvents = events?.filter(
    (e) => e.event_type === "flagship" || e.event_type === "regional"
  ) || [];
  const secondaryEvents = events?.filter(
    (e) => e.event_type === "secondary"
  ) || [];

  const getAllocationForEvent = (eventId: string) => {
    return allocations.find((a) => a.event_id === eventId);
  };

  return (
    <div className="space-y-8">
      {/* Primary Events */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Primary Events
        </h2>
        {primaryEvents.length === 0 ? (
          <p className="text-muted-foreground">No primary events available.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {primaryEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                allocation={getAllocationForEvent(event.id)}
                memberId={member?.id || ""}
                isPrimary
              />
            ))}
          </div>
        )}
      </div>

      {/* Secondary Events */}
      {secondaryEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Secondary Events
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {secondaryEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                allocation={getAllocationForEvent(event.id)}
                memberId={member?.id || ""}
                isPrimary={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
