import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UtensilsCrossed, MapPin, Clock } from "lucide-react";
import { VipDinnerRsvpModal } from "@/components/modals/VipDinnerRsvpModal";
import type { Tables } from "@/integrations/supabase/types";

type VipDinnerRsvp = Tables<"vip_dinner_rsvps">;

interface VipDinnerModuleProps {
  eventId: string;
  companyUserId: string;
  allocated: number;
  dinnerDate: string | null;
  dinnerTime: string | null;
  dinnerVenue: string | null;
}

export function VipDinnerModule({
  eventId,
  companyUserId,
  allocated,
  dinnerDate,
  dinnerTime,
  dinnerVenue,
}: VipDinnerModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: rsvps = [] } = useQuery({
    queryKey: ["vip_dinner_rsvps", companyUserId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_dinner_rsvps")
        .select("*")
        .eq("company_user_id", companyUserId)
        .eq("event_id", eventId);

      if (error) throw error;
      return data as VipDinnerRsvp[];
    },
    enabled: !!companyUserId,
  });

  const reserved = rsvps.length;
  const remaining = Math.max(0, allocated - reserved);
  const progress = allocated > 0 ? (reserved / allocated) * 100 : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-foreground">VIP Dinner</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {reserved} / {allocated} reserved
        </span>
      </div>

      {/* Dinner Details */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        {dinnerDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDate(dinnerDate)}
              {dinnerTime && ` at ${dinnerTime}`}
            </span>
          </div>
        )}
        {dinnerVenue && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{dinnerVenue}</span>
          </div>
        )}
      </div>

      <Progress value={progress} className="h-2 mb-3" />

      {remaining > 0 ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10"
          onClick={() => setIsModalOpen(true)}
        >
          RSVP ({remaining} seats remaining)
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          All seats reserved
        </p>
      )}

      <VipDinnerRsvpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        companyUserId={companyUserId}
        remaining={remaining}
      />
    </div>
  );
}
