import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ClaimBusinessDialogProps {
  businessId: string;
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const relationshipOptions = [
  { value: "owner", label: "Owner" },
  { value: "executive", label: "Executive" },
  { value: "employee", label: "Employee" },
  { value: "authorized_representative", label: "Authorized Representative" },
];

export function ClaimBusinessDialog({
  businessId,
  businessName,
  isOpen,
  onClose,
  userId,
}: ClaimBusinessDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    claimant_name: "",
    claimant_email: "",
    claimant_title: "",
    verification_method: "owner",
    verification_notes: "",
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("You must be logged in to claim a business");
      }

      const { error } = await supabase.from("business_claims").insert({
        business_id: businessId,
        claimant_user_id: userId,
        claimant_name: formData.claimant_name.trim(),
        claimant_email: formData.claimant_email.trim().toLowerCase(),
        claimant_title: formData.claimant_title.trim(),
        verification_method: formData.verification_method,
        verification_notes: formData.verification_notes.trim(),
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-claims"] });
      queryClient.invalidateQueries({ queryKey: ["business-claim-status"] });
      toast({
        title: "Claim submitted!",
        description:
          "Your claim has been submitted for review. We'll notify you once it's processed.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error submitting claim",
        description: error.message || "Please try again.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      claimant_name: "",
      claimant_email: "",
      claimant_title: "",
      verification_method: "owner",
      verification_notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      // Redirect to login with return URL
      navigate(`/login?returnTo=/business/${businessId}`);
      return;
    }

    if (!formData.claimant_name || !formData.claimant_email || !formData.claimant_title) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    claimMutation.mutate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this Business</DialogTitle>
          <DialogDescription>
            Submit a claim to manage <strong>{businessName}</strong>. Our team will
            review and verify your relationship to the company.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claimant_name">Full Name *</Label>
            <Input
              id="claimant_name"
              placeholder="John Doe"
              value={formData.claimant_name}
              onChange={(e) => handleChange("claimant_name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimant_email">Email *</Label>
            <Input
              id="claimant_email"
              type="email"
              placeholder="john@company.com"
              value={formData.claimant_email}
              onChange={(e) => handleChange("claimant_email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimant_title">Job Title *</Label>
            <Input
              id="claimant_title"
              placeholder="CEO, Director, etc."
              value={formData.claimant_title}
              onChange={(e) => handleChange("claimant_title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification_method">Company Relationship</Label>
            <Select
              value={formData.verification_method}
              onValueChange={(v) => handleChange("verification_method", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification_notes">
              How can we verify your relationship to this company?
            </Label>
            <Textarea
              id="verification_notes"
              placeholder="e.g., I'm listed as CEO on our website, my company email domain matches, etc."
              value={formData.verification_notes}
              onChange={(e) => handleChange("verification_notes", e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={claimMutation.isPending}>
              {claimMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Claim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
