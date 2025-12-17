import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Clock } from "lucide-react";
import { SpeakerApplicationModal } from "@/components/modals/SpeakerApplicationModal";
import type { Tables } from "@/integrations/supabase/types";

type SpeakerApplication = Tables<"speaker_applications">;

interface SpeakingModuleProps {
  eventId: string;
  eventName: string;
  companyUserId: string;
  deadline: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  under_review: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  waitlisted: "bg-purple-500",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

export function SpeakingModule({
  eventId,
  eventName,
  companyUserId,
  deadline,
}: SpeakingModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["speaker_applications", companyUserId, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speaker_applications")
        .select("*")
        .eq("company_user_id", companyUserId)
        .eq("event_id", eventId);

      if (error) throw error;
      return data as SpeakerApplication[];
    },
    enabled: !!companyUserId,
  });

  const hasApplication = applications.length > 0;
  const latestApplication = applications[0];

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "Deadline passed";
    if (daysLeft === 0) return "Due today!";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-green-500" />
          <span className="font-medium text-foreground">Speaking Opportunity</span>
        </div>
        {deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDeadline(deadline)}</span>
          </div>
        )}
      </div>

      {hasApplication ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground truncate">
              {latestApplication.proposed_topic}
            </span>
            <Badge
              className={`${statusColors[latestApplication.status || "draft"]} text-white text-xs`}
            >
              {statusLabels[latestApplication.status || "draft"]}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            View / Edit Application
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-green-500 text-green-500 hover:bg-green-500/10"
          onClick={() => setIsModalOpen(true)}
        >
          Apply to Speak
        </Button>
      )}

      <SpeakerApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        eventName={eventName}
        companyUserId={companyUserId}
        existingApplication={latestApplication}
      />
    </div>
  );
}
