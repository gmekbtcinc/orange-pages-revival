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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VipDinnerRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  memberId: string;
  remaining: number;
}

export function VipDinnerRsvpModal({
  isOpen,
  onClose,
  eventId,
  memberId,
  remaining,
}: VipDinnerRsvpModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [guestCompany, setGuestCompany] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [seatingPreferences, setSeatingPreferences] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vip_dinner_rsvps").insert({
        event_id: eventId,
        member_id: memberId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_title: guestTitle || null,
        guest_company: guestCompany || null,
        dietary_requirements: dietaryRequirements || null,
        seating_preferences: seatingPreferences || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vip_dinner_rsvps", memberId, eventId],
      });
      toast({
        title: "RSVP confirmed!",
        description: `${guestName} has been added to the VIP dinner`,
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
    setGuestName("");
    setGuestEmail("");
    setGuestTitle("");
    setGuestCompany("");
    setDietaryRequirements("");
    setSeatingPreferences("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rsvpMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>VIP Dinner RSVP</DialogTitle>
          <DialogDescription>
            Reserve a seat at the exclusive VIP dinner. {remaining} seat(s) remaining.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email *</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestTitle">Title</Label>
              <Input
                id="guestTitle"
                value={guestTitle}
                onChange={(e) => setGuestTitle(e.target.value)}
                placeholder="CEO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCompany">Company</Label>
              <Input
                id="guestCompany"
                value={guestCompany}
                onChange={(e) => setGuestCompany(e.target.value)}
                placeholder="Company Inc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietary">Dietary Requirements</Label>
            <Input
              id="dietary"
              value={dietaryRequirements}
              onChange={(e) => setDietaryRequirements(e.target.value)}
              placeholder="Vegetarian, allergies, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seating">Seating Preferences</Label>
            <Textarea
              id="seating"
              value={seatingPreferences}
              onChange={(e) => setSeatingPreferences(e.target.value)}
              placeholder="Prefer to sit with specific guests or near specific topics"
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={rsvpMutation.isPending}
            >
              {rsvpMutation.isPending ? "Saving..." : "Confirm RSVP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
