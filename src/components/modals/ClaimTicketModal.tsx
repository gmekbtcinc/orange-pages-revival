import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ClaimTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  companyUserId: string;
  remaining: number;
}

export function ClaimTicketModal({
  isOpen,
  onClose,
  eventId,
  companyUserId,
  remaining,
}: ClaimTicketModalProps) {
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeeTitle, setAttendeeTitle] = useState("");
  const [attendeeCompany, setAttendeeCompany] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const claimMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_claims").insert({
        event_id: eventId,
        member_id: companyUserId, // Temporary: using companyUserId until member_id column is removed
        company_user_id: companyUserId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_title: attendeeTitle || null,
        attendee_company: attendeeCompany || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket_claims", companyUserId, eventId] });
      toast({
        title: "Ticket claimed!",
        description: `Ticket claimed for ${attendeeName}`,
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setAttendeeName("");
    setAttendeeEmail("");
    setAttendeeTitle("");
    setAttendeeCompany("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    claimMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Conference Ticket</DialogTitle>
          <DialogDescription>
            Enter attendee details for ticket registration. {remaining} ticket(s) remaining.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attendeeName">Full Name *</Label>
            <Input
              id="attendeeName"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendeeEmail">Email *</Label>
            <Input
              id="attendeeEmail"
              type="email"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendeeTitle">Job Title</Label>
            <Input
              id="attendeeTitle"
              value={attendeeTitle}
              onChange={(e) => setAttendeeTitle(e.target.value)}
              placeholder="CEO"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendeeCompany">Company</Label>
            <Input
              id="attendeeCompany"
              value={attendeeCompany}
              onChange={(e) => setAttendeeCompany(e.target.value)}
              placeholder="Company Inc."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-bitcoin-orange hover:bg-bitcoin-orange-dark"
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? "Claiming..." : "Claim Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
