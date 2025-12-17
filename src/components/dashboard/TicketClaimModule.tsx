import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ticket } from "lucide-react";
import { ClaimTicketModal } from "@/components/modals/ClaimTicketModal";
import type { Tables } from "@/integrations/supabase/types";

type TicketClaim = Tables<"ticket_claims">;

interface TicketClaimModuleProps {
  eventId: string;
  companyUserId: string;
  allocated: number;
}

export function TicketClaimModule({ eventId, companyUserId, allocated }: TicketClaimModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["ticket_claims", companyUserId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_claims")
        .select("*")
        .eq("company_user_id", companyUserId)
        .eq("event_id", eventId);

      if (error) throw error;
      return data as TicketClaim[];
    },
    enabled: !!companyUserId,
  });

  const claimed = claims.length;
  const remaining = Math.max(0, allocated - claimed);
  const progress = allocated > 0 ? (claimed / allocated) * 100 : 0;

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-bitcoin-orange" />
          <span className="font-medium text-foreground">Conference Tickets</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {claimed} / {allocated} claimed
        </span>
      </div>

      <Progress value={progress} className="h-2 mb-3" />

      {remaining > 0 ? (
        <Button
          size="sm"
          className="w-full bg-bitcoin-orange hover:bg-bitcoin-orange-dark"
          onClick={() => setIsModalOpen(true)}
        >
          Claim Tickets ({remaining} remaining)
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          All tickets claimed
        </p>
      )}

      <ClaimTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        companyUserId={companyUserId}
        remaining={remaining}
      />
    </div>
  );
}
