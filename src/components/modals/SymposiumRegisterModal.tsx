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

interface SymposiumRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  companyUserId: string;
  remaining: number;
}

export function SymposiumRegisterModal({
  isOpen,
  onClose,
  eventId,
  companyUserId,
  remaining,
}: SymposiumRegisterModalProps) {
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeeTitle, setAttendeeTitle] = useState("");
  const [attendeeCompany, setAttendeeCompany] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("symposium_registrations").insert({
        event_id: eventId,
        member_id: companyUserId, // Temporary: using companyUserId until member_id column is removed
        company_user_id: companyUserId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_title: attendeeTitle || null,
        attendee_company: attendeeCompany || null,
        dietary_requirements: dietaryRequirements || null,
        accessibility_needs: accessibilityNeeds || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["symposium_registrations", companyUserId, eventId],
      });
      toast({
        title: "Registered!",
        description: `${attendeeName} registered for the symposium`,
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
    setDietaryRequirements("");
    setAccessibilityNeeds("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for Symposium</DialogTitle>
          <DialogDescription>
            Register an attendee for the BFC Symposium. {remaining} seat(s) remaining.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendeeTitle">Job Title</Label>
              <Input
                id="attendeeTitle"
                value={attendeeTitle}
                onChange={(e) => setAttendeeTitle(e.target.value)}
                placeholder="CFO"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietary">Dietary Requirements</Label>
            <Input
              id="dietary"
              value={dietaryRequirements}
              onChange={(e) => setDietaryRequirements(e.target.value)}
              placeholder="Vegetarian, gluten-free, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessibility">Accessibility Needs</Label>
            <Textarea
              id="accessibility"
              value={accessibilityNeeds}
              onChange={(e) => setAccessibilityNeeds(e.target.value)}
              placeholder="Any accessibility requirements..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
