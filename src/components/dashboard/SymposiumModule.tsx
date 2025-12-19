import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, MapPin, Calendar } from "lucide-react";
import { SymposiumRegisterModal } from "@/components/modals/SymposiumRegisterModal";
import type { Tables } from "@/integrations/supabase/types";

type SymposiumRegistration = Tables<"symposium_registrations">;

interface SymposiumModuleProps {
  eventId: string;
  profileId: string;
  allocated: number;
  symposiumDate: string | null;
  symposiumVenue: string | null;
}

export function SymposiumModule({
  eventId,
  profileId,
  allocated,
  symposiumDate,
  symposiumVenue,
}: SymposiumModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: registrations = [] } = useQuery({
    queryKey: ["symposium_registrations", profileId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("symposium_registrations")
        .select("*")
        .eq("profile_id", profileId)
        .eq("event_id", eventId);

      if (error) throw error;
      return data as SymposiumRegistration[];
    },
    enabled: !!profileId,
  });

  const registered = registrations.length;
  const remaining = Math.max(0, allocated - registered);
  const progress = allocated > 0 ? (registered / allocated) * 100 : 0;

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
          <Users className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-foreground">BFC Symposium</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {registered} / {allocated} registered
        </span>
      </div>

      {/* Symposium Details */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        {symposiumDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(symposiumDate)}</span>
          </div>
        )}
        {symposiumVenue && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{symposiumVenue}</span>
          </div>
        )}
      </div>

      <Progress value={progress} className="h-2 mb-3" />

      {remaining > 0 ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/10"
          onClick={() => setIsModalOpen(true)}
        >
          Register ({remaining} seats remaining)
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          All seats registered
        </p>
      )}

      <SymposiumRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        profileId={profileId}
        remaining={remaining}
      />
    </div>
  );
}
