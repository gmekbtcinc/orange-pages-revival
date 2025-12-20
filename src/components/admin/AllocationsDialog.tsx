import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { PASS_TYPE_LABELS, PASS_TYPE_SHORT_LABELS, type PassType } from "@/types/user";

type MemberTier = Database["public"]["Enums"]["member_tier"];

const TIERS: { value: MemberTier; label: string; color: string }[] = [
  { value: "industry", label: "Industry", color: "bg-blue-500" },
  { value: "premier", label: "Premier", color: "bg-emerald-500" },
  { value: "executive", label: "Executive", color: "bg-purple-500" },
  { value: "sponsor", label: "Sponsor", color: "bg-amber-500" },
  { value: "chairman", label: "Chairman's Circle", color: "bg-orange-500" },
];

interface AllocationsDialogProps {
  eventId: string | null;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AllocationRow {
  tier: MemberTier;
  ga_tickets: number;
  pro_tickets: number;
  whale_tickets: number;
  custom_tickets: number;
  custom_pass_name: string | null;
  symposium_seats: number;
  vip_dinner_seats: number;
}

export function AllocationsDialog({ eventId, eventName, open, onOpenChange }: AllocationsDialogProps) {
  const queryClient = useQueryClient();
  const [customPassName, setCustomPassName] = useState<string>("");
  const [allocations, setAllocations] = useState<AllocationRow[]>(
    TIERS.map((t) => ({
      tier: t.value,
      ga_tickets: 0,
      pro_tickets: 0,
      whale_tickets: 0,
      custom_tickets: 0,
      custom_pass_name: null,
      symposium_seats: 0,
      vip_dinner_seats: 0,
    }))
  );

  const { data: existingAllocations } = useQuery({
    queryKey: ["event-allocations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_allocations")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && open,
  });

  useEffect(() => {
    if (existingAllocations) {
      // Get custom pass name from first allocation that has one
      const firstWithCustomName = existingAllocations.find((a) => a.custom_pass_name);
      if (firstWithCustomName?.custom_pass_name) {
        setCustomPassName(firstWithCustomName.custom_pass_name);
      }

      setAllocations(
        TIERS.map((t) => {
          const existing = existingAllocations.find((a) => a.tier === t.value);
          return {
            tier: t.value,
            ga_tickets: existing?.ga_tickets ?? 0,
            pro_tickets: existing?.pro_tickets ?? 0,
            whale_tickets: existing?.whale_tickets ?? 0,
            custom_tickets: existing?.custom_tickets ?? 0,
            custom_pass_name: existing?.custom_pass_name ?? null,
            symposium_seats: existing?.symposium_seats ?? 0,
            vip_dinner_seats: existing?.vip_dinner_seats ?? 0,
          };
        })
      );
    }
  }, [existingAllocations]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event selected");

      // Delete existing allocations for this event
      await supabase.from("event_allocations").delete().eq("event_id", eventId);

      // Insert new allocations
      const { error } = await supabase.from("event_allocations").insert(
        allocations.map((a) => ({
          event_id: eventId,
          tier: a.tier,
          ga_tickets: a.ga_tickets,
          pro_tickets: a.pro_tickets,
          whale_tickets: a.whale_tickets,
          custom_tickets: a.custom_tickets,
          custom_pass_name: customPassName || null,
          symposium_seats: a.symposium_seats,
          vip_dinner_seats: a.vip_dinner_seats,
        }))
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["event-detail"] });
      toast.success("Allocations saved successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save allocations: " + error.message);
    },
  });

  const updateAllocation = (tier: MemberTier, field: keyof AllocationRow, value: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.tier === tier ? { ...a, [field]: Math.max(0, value) } : a))
    );
  };

  const getTierInfo = (tier: MemberTier) => TIERS.find((t) => t.value === tier)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Allocations: {eventName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Set the number of tickets and seats allocated to each membership tier for this event.
          </p>

          {/* Custom pass name field */}
          {allocations.some((a) => a.custom_tickets > 0) && (
            <div className="mb-4 p-3 border rounded-lg bg-muted/50">
              <Label htmlFor="custom-pass-name" className="text-sm font-medium">
                Custom Pass Name
              </Label>
              <Input
                id="custom-pass-name"
                placeholder="e.g., Speaker Pass, Media Pass"
                value={customPassName}
                onChange={(e) => setCustomPassName(e.target.value)}
                className="mt-1 max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Name for the custom pass type (shown when custom tickets are allocated)
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Tier</TableHead>
                  <TableHead className="text-center min-w-[80px]" title={PASS_TYPE_LABELS.ga}>
                    {PASS_TYPE_SHORT_LABELS.ga}
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]" title={PASS_TYPE_LABELS.pro}>
                    {PASS_TYPE_SHORT_LABELS.pro}
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]" title={PASS_TYPE_LABELS.whale}>
                    {PASS_TYPE_SHORT_LABELS.whale}
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]" title={customPassName || PASS_TYPE_LABELS.custom}>
                    {customPassName || PASS_TYPE_SHORT_LABELS.custom}
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]">Symposium</TableHead>
                  <TableHead className="text-center min-w-[80px]">VIP Dinner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((alloc) => {
                  const tierInfo = getTierInfo(alloc.tier);
                  return (
                    <TableRow key={alloc.tier}>
                      <TableCell>
                        <Badge className={tierInfo.color}>{tierInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.ga_tickets}
                          onChange={(e) => updateAllocation(alloc.tier, "ga_tickets", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.pro_tickets}
                          onChange={(e) => updateAllocation(alloc.tier, "pro_tickets", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.whale_tickets}
                          onChange={(e) => updateAllocation(alloc.tier, "whale_tickets", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.custom_tickets}
                          onChange={(e) => updateAllocation(alloc.tier, "custom_tickets", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.symposium_seats}
                          onChange={(e) => updateAllocation(alloc.tier, "symposium_seats", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.vip_dinner_seats}
                          onChange={(e) => updateAllocation(alloc.tier, "vip_dinner_seats", parseInt(e.target.value) || 0)}
                          className="w-16 mx-auto text-center"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Totals</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{PASS_TYPE_SHORT_LABELS.ga}:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.ga_tickets, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{PASS_TYPE_SHORT_LABELS.pro}:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.pro_tickets, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{PASS_TYPE_SHORT_LABELS.whale}:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.whale_tickets, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">{customPassName || PASS_TYPE_SHORT_LABELS.custom}:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.custom_tickets, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Symposium:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.symposium_seats, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">VIP Dinner:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.vip_dinner_seats, 0)}</strong>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Allocations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
