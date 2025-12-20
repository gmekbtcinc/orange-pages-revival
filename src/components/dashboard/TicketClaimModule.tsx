import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ticket } from "lucide-react";
import { ClaimTicketModal } from "@/components/modals/ClaimTicketModal";
import { PASS_TYPE_LABELS, PASS_TYPE_COLORS, type PassType } from "@/types/user";
import type { Tables } from "@/integrations/supabase/types";

type TicketClaim = Tables<"ticket_claims">;
type EventAllocation = Tables<"event_allocations">;

interface TicketClaimModuleProps {
  eventId: string;
  businessId: string;
  profileId: string;
  allocation: EventAllocation | undefined;
}

interface PassTypeData {
  type: PassType;
  label: string;
  colorClass: string;
  allocated: number;
  claimed: number;
  remaining: number;
  progress: number;
}

export function TicketClaimModule({ eventId, businessId, profileId, allocation }: TicketClaimModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPassType, setSelectedPassType] = useState<PassType>("ga");

  // Query all claims for this business and event
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["ticket_claims", businessId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_claims")
        .select("*")
        .eq("business_id", businessId)
        .eq("event_id", eventId);

      if (error) throw error;
      return data as TicketClaim[];
    },
    enabled: !!businessId,
  });

  // Group claims by pass_type
  const claimsByType = claims.reduce((acc, claim) => {
    const passType = (claim.pass_type || "ga") as PassType;
    acc[passType] = (acc[passType] || 0) + 1;
    return acc;
  }, {} as Record<PassType, number>);

  // Build pass type data for rendering
  const passTypes: PassTypeData[] = [];

  const passTypeConfigs: { type: PassType; allocField: keyof EventAllocation }[] = [
    { type: "ga", allocField: "ga_tickets" },
    { type: "pro", allocField: "pro_tickets" },
    { type: "whale", allocField: "whale_tickets" },
    { type: "custom", allocField: "custom_tickets" },
  ];

  for (const config of passTypeConfigs) {
    const allocated = (allocation?.[config.allocField] as number) || 0;
    if (allocated > 0) {
      const claimed = claimsByType[config.type] || 0;
      const remaining = Math.max(0, allocated - claimed);
      const progress = allocated > 0 ? (claimed / allocated) * 100 : 0;

      // Use custom pass name if available for the custom type
      const label = config.type === "custom" && allocation?.custom_pass_name
        ? allocation.custom_pass_name
        : PASS_TYPE_LABELS[config.type];

      passTypes.push({
        type: config.type,
        label,
        colorClass: PASS_TYPE_COLORS[config.type],
        allocated,
        claimed,
        remaining,
        progress,
      });
    }
  }

  // If no allocations, show empty state
  if (passTypes.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Ticket className="h-4 w-4" />
          <span className="text-sm">No tickets allocated for this event</span>
        </div>
      </div>
    );
  }

  const handleClaimClick = (passType: PassType) => {
    setSelectedPassType(passType);
    setIsModalOpen(true);
  };

  const selectedPassTypeData = passTypes.find(p => p.type === selectedPassType);

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Ticket className="h-4 w-4 text-bitcoin-orange" />
        <span className="font-medium text-foreground">Conference Tickets</span>
      </div>

      {passTypes.map((passTypeData) => (
        <div key={passTypeData.type} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${passTypeData.colorClass}`} />
              <span className="text-sm text-foreground">{passTypeData.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {passTypeData.claimed} / {passTypeData.allocated}
            </span>
          </div>

          <Progress value={passTypeData.progress} className="h-1.5" />

          {passTypeData.remaining > 0 ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-7"
              onClick={() => handleClaimClick(passTypeData.type)}
            >
              Claim {passTypeData.label} ({passTypeData.remaining} remaining)
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              All {passTypeData.label} tickets claimed
            </p>
          )}
        </div>
      ))}

      <ClaimTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        businessId={businessId}
        profileId={profileId}
        passType={selectedPassType}
        passTypeLabel={selectedPassTypeData?.label || PASS_TYPE_LABELS[selectedPassType]}
        remaining={selectedPassTypeData?.remaining || 0}
      />
    </div>
  );
}
