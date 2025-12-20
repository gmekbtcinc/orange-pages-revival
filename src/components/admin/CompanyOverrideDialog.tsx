import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PASS_TYPE_SHORT_LABELS, PASS_TYPE_LABELS, type CompanyAllocationOverride } from "@/types/user";
import type { Tables } from "@/integrations/supabase/types";

type EventAllocation = Tables<"event_allocations">;

interface CompanyOverrideDialogProps {
  businessId: string;
  eventId: string;
  eventName: string;
  tierAllocation: EventAllocation | null;
  existingOverride: CompanyAllocationOverride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyOverrideDialog({
  businessId,
  eventId,
  eventName,
  tierAllocation,
  existingOverride,
  open,
  onOpenChange,
}: CompanyOverrideDialogProps) {
  const queryClient = useQueryClient();

  const [overrideMode, setOverrideMode] = useState<"absolute" | "additive">("absolute");
  const [gaOverride, setGaOverride] = useState<string>("");
  const [proOverride, setProOverride] = useState<string>("");
  const [whaleOverride, setWhaleOverride] = useState<string>("");
  const [customOverride, setCustomOverride] = useState<string>("");
  const [customPassName, setCustomPassName] = useState<string>("");
  const [symposiumOverride, setSymposiumOverride] = useState<string>("");
  const [dinnerOverride, setDinnerOverride] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Load existing override values
  useEffect(() => {
    if (existingOverride) {
      setOverrideMode(existingOverride.override_mode as "absolute" | "additive");
      setGaOverride(existingOverride.ga_tickets_override?.toString() ?? "");
      setProOverride(existingOverride.pro_tickets_override?.toString() ?? "");
      setWhaleOverride(existingOverride.whale_tickets_override?.toString() ?? "");
      setCustomOverride(existingOverride.custom_tickets_override?.toString() ?? "");
      setCustomPassName(existingOverride.custom_pass_name ?? "");
      setSymposiumOverride(existingOverride.symposium_seats_override?.toString() ?? "");
      setDinnerOverride(existingOverride.vip_dinner_seats_override?.toString() ?? "");
      setReason(existingOverride.reason ?? "");
    } else {
      // Reset form
      setOverrideMode("absolute");
      setGaOverride("");
      setProOverride("");
      setWhaleOverride("");
      setCustomOverride("");
      setCustomPassName(tierAllocation?.custom_pass_name ?? "");
      setSymposiumOverride("");
      setDinnerOverride("");
      setReason("");
    }
  }, [existingOverride, tierAllocation, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        business_id: businessId,
        event_id: eventId,
        override_mode: overrideMode,
        ga_tickets_override: gaOverride !== "" ? parseInt(gaOverride) : null,
        pro_tickets_override: proOverride !== "" ? parseInt(proOverride) : null,
        whale_tickets_override: whaleOverride !== "" ? parseInt(whaleOverride) : null,
        custom_tickets_override: customOverride !== "" ? parseInt(customOverride) : null,
        custom_pass_name: customPassName || null,
        symposium_seats_override: symposiumOverride !== "" ? parseInt(symposiumOverride) : null,
        vip_dinner_seats_override: dinnerOverride !== "" ? parseInt(dinnerOverride) : null,
        reason: reason || null,
      };

      if (existingOverride) {
        const { error } = await supabase
          .from("company_allocation_overrides")
          .update(data)
          .eq("id", existingOverride.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_allocation_overrides")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-overrides"] });
      toast.success(existingOverride ? "Override updated" : "Override created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save override: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingOverride) return;
      const { error } = await supabase
        .from("company_allocation_overrides")
        .delete()
        .eq("id", existingOverride.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-overrides"] });
      toast.success("Override removed");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete override: " + error.message);
    },
  });

  const tierDefault = (field: keyof EventAllocation) =>
    (tierAllocation?.[field] as number) ?? 0;

  const computeEffective = (
    tierValue: number,
    override: string
  ): number | null => {
    if (override === "") return null;
    const overrideNum = parseInt(override);
    if (overrideMode === "absolute") {
      return overrideNum;
    } else {
      return tierValue + overrideNum;
    }
  };

  const OverrideInput = ({
    label,
    tierField,
    value,
    onChange,
    shortLabel,
  }: {
    label: string;
    tierField: keyof EventAllocation;
    value: string;
    onChange: (v: string) => void;
    shortLabel?: string;
  }) => {
    const tierValue = tierDefault(tierField);
    const effective = computeEffective(tierValue, value);

    return (
      <div className="space-y-1">
        <Label className="text-sm">{shortLabel || label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={overrideMode === "absolute" ? tierValue.toString() : "0"}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tier: {tierValue}
            {effective !== null && ` → ${effective}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingOverride ? "Edit" : "Add"} Allocation Override
          </DialogTitle>
          <DialogDescription>
            Override tier allocations for {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Override Mode */}
          <div className="space-y-2">
            <Label>Override Mode</Label>
            <RadioGroup
              value={overrideMode}
              onValueChange={(v) => setOverrideMode(v as "absolute" | "additive")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="absolute" id="absolute" />
                <Label htmlFor="absolute" className="cursor-pointer">
                  Absolute (set exact value)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="additive" id="additive" />
                <Label htmlFor="additive" className="cursor-pointer">
                  Additive (+/- from tier)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {overrideMode === "absolute"
                ? "The value you enter will be the exact allocation."
                : "The value you enter will be added to (or subtracted from) the tier default."}
            </p>
          </div>

          {/* Pass Type Overrides */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Conference Tickets</h4>
            <div className="grid grid-cols-2 gap-4">
              <OverrideInput
                label={PASS_TYPE_LABELS.ga}
                shortLabel={PASS_TYPE_SHORT_LABELS.ga}
                tierField="ga_tickets"
                value={gaOverride}
                onChange={setGaOverride}
              />
              <OverrideInput
                label={PASS_TYPE_LABELS.pro}
                shortLabel={PASS_TYPE_SHORT_LABELS.pro}
                tierField="pro_tickets"
                value={proOverride}
                onChange={setProOverride}
              />
              <OverrideInput
                label={PASS_TYPE_LABELS.whale}
                shortLabel={PASS_TYPE_SHORT_LABELS.whale}
                tierField="whale_tickets"
                value={whaleOverride}
                onChange={setWhaleOverride}
              />
              <OverrideInput
                label="Custom"
                tierField="custom_tickets"
                value={customOverride}
                onChange={setCustomOverride}
              />
            </div>
            {(customOverride !== "" && parseInt(customOverride) > 0) && (
              <div className="space-y-1">
                <Label className="text-sm">Custom Pass Name</Label>
                <Input
                  value={customPassName}
                  onChange={(e) => setCustomPassName(e.target.value)}
                  placeholder="e.g., Speaker Pass"
                />
              </div>
            )}
          </div>

          {/* Other Overrides */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Other Allocations</h4>
            <div className="grid grid-cols-2 gap-4">
              <OverrideInput
                label="Symposium Seats"
                tierField="symposium_seats"
                value={symposiumOverride}
                onChange={setSymposiumOverride}
              />
              <OverrideInput
                label="VIP Dinner Seats"
                tierField="vip_dinner_seats"
                value={dinnerOverride}
                onChange={setDinnerOverride}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Comp tickets for sponsorship, Special deal"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingOverride && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Remove Override
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Saving..."
                : existingOverride
                ? "Update Override"
                : "Add Override"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
