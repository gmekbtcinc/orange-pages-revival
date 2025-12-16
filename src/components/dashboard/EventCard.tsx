import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { TicketClaimModule } from "./TicketClaimModule";
import { SymposiumModule } from "./SymposiumModule";
import { SpeakingModule } from "./SpeakingModule";
import { VipDinnerModule } from "./VipDinnerModule";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;
type EventAllocation = Tables<"event_allocations">;

interface EventCardProps {
  event: Event;
  allocation: EventAllocation | undefined;
  memberId: string;
  isPrimary: boolean;
}

export function EventCard({ event, allocation, memberId, isPrimary }: EventCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const eventTypeColors: Record<string, string> = {
    flagship: "bg-bitcoin-orange",
    regional: "bg-blue-600",
    secondary: "bg-gray-600",
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge
              className={`${eventTypeColors[event.event_type]} text-white text-xs mb-2`}
            >
              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
            </Badge>
            <CardTitle className="text-lg text-foreground">{event.name}</CardTitle>
            {event.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{event.subtitle}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          {event.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(event.start_date)}
                {event.end_date && ` - ${formatDate(event.end_date)}`}
              </span>
            </div>
          )}
          {event.location_city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {event.location_city}
                {event.location_country && `, ${event.location_country}`}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conference Tickets - Always shown */}
        <TicketClaimModule
          eventId={event.id}
          memberId={memberId}
          allocated={allocation?.conference_tickets || 0}
        />

        {/* Primary events get all 4 modules */}
        {isPrimary && (
          <>
            {event.has_symposium && (
              <SymposiumModule
                eventId={event.id}
                memberId={memberId}
                allocated={allocation?.symposium_seats || 0}
                symposiumDate={event.symposium_date}
                symposiumVenue={event.symposium_venue}
              />
            )}

            {event.speaking_applications_open && (
              <SpeakingModule
                eventId={event.id}
                eventName={event.name}
                memberId={memberId}
                deadline={event.speaking_deadline}
              />
            )}

            {event.has_vip_dinner && (
              <VipDinnerModule
                eventId={event.id}
                memberId={memberId}
                allocated={allocation?.vip_dinner_seats || 0}
                dinnerDate={event.vip_dinner_date}
                dinnerTime={event.vip_dinner_time}
                dinnerVenue={event.vip_dinner_venue}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
