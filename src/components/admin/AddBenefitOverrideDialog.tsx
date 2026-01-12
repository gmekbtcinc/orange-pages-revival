import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Gift } from "lucide-react";

interface AddBenefitOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  onSuccess: () => void;
}

export function AddBenefitOverrideDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  onSuccess,
}: AddBenefitOverrideDialogProps) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [selectedBenefitId, setSelectedBenefitId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [overrideMode, setOverrideMode] = useState<"absolute" | "additive">("additive");
  const [reason, setReason] = useState("");

  // Fetch all benefits
  const { data: benefits = [] } = useQuery({
    queryKey: ["benefits-for-override"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("id, label, description, benefit_categories(name)")
        .eq("is_active", true)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing overrides for this company
  const { data: existingOverrides = [] } = useQuery({
    queryKey: ["existing-overrides", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_benefit_overrides")
        .select("benefit_id")
        .eq("business_id", businessId)
        .eq("period_year", currentYear);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_benefit_overrides")
        .insert({
          business_id: businessId,
          benefit_id: selectedBenefitId,
          quantity_override: isUnlimited ? null : parseInt(quantity, 10),
          is_unlimited_override: isUnlimited,
          override_mode: overrideMode,
          period_year: currentYear,
          reason: reason || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Benefit override added",
        description: `Override has been added for ${businessName}`,
      });
      onOpenChange(false);
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const resetForm = () => {
    setSelectedBenefitId("");
    setQuantity("1");
    setIsUnlimited(false);
    setOverrideMode("additive");
    setReason("");
  };

  // Filter out benefits that already have overrides
  const existingBenefitIds = existingOverrides.map((o) => o.benefit_id);
  const availableBenefits = benefits.filter((b) => !existingBenefitIds.includes(b.id));

  const selectedBenefit = benefits.find((b) => b.id === selectedBenefitId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Benefit Override
          </DialogTitle>
          <DialogDescription>
            Grant additional benefits to {businessName} beyond their tier package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Benefit</Label>
            <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a benefit..." />
              </SelectTrigger>
              <SelectContent>
                {availableBenefits.map((benefit) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span>{benefit.label}</span>
                      {benefit.benefit_categories?.name && (
                        <span className="text-xs text-muted-foreground">
                          ({benefit.benefit_categories.name})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBenefit?.description && (
              <p className="text-xs text-muted-foreground">{selectedBenefit.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Override Mode</Label>
            <Select value={overrideMode} onValueChange={(v) => setOverrideMode(v as "absolute" | "additive")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="additive">
                  <div>
                    <span className="font-medium">Additive</span>
                    <span className="text-muted-foreground ml-2">— Add to existing allocation</span>
                  </div>
                </SelectItem>
                <SelectItem value="absolute">
                  <div>
                    <span className="font-medium">Absolute</span>
                    <span className="text-muted-foreground ml-2">— Replace existing allocation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Unlimited</Label>
            <Switch checked={isUnlimited} onCheckedChange={setIsUnlimited} />
          </div>

          {!isUnlimited && (
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {overrideMode === "additive"
                  ? "This amount will be added to their tier allocation"
                  : "This will replace their tier allocation entirely"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Why is this override being granted?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedBenefitId}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
