import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type MemberTier = Database["public"]["Enums"]["member_tier"];

const TIERS: { value: MemberTier; label: string; color: string }[] = [
  { value: "silver", label: "Silver", color: "bg-slate-400" },
  { value: "gold", label: "Gold", color: "bg-yellow-500" },
  { value: "platinum", label: "Platinum", color: "bg-slate-600" },
  { value: "chairman", label: "Chairman's Circle", color: "bg-orange-500" },
  { value: "executive", label: "Executive", color: "bg-purple-500" },
];

interface AllocationsDialogProps {
  eventId: string | null;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AllocationRow {
  tier: MemberTier;
  conference_tickets: number;
  symposium_seats: number;
  vip_dinner_seats: number;
}

export function AllocationsDialog({ eventId, eventName, open, onOpenChange }: AllocationsDialogProps) {
  const queryClient = useQueryClient();
  const [allocations, setAllocations] = useState<AllocationRow[]>(
    TIERS.map((t) => ({
      tier: t.value,
      conference_tickets: 0,
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
      setAllocations(
        TIERS.map((t) => {
          const existing = existingAllocations.find((a) => a.tier === t.value);
          return {
            tier: t.value,
            conference_tickets: existing?.conference_tickets ?? 0,
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
          conference_tickets: a.conference_tickets,
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Allocations: {eventName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Set the number of tickets and seats allocated to each membership tier for this event.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-center">Conference Tickets</TableHead>
                <TableHead className="text-center">Symposium Seats</TableHead>
                <TableHead className="text-center">VIP Dinner Seats</TableHead>
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
                        value={alloc.conference_tickets}
                        onChange={(e) => updateAllocation(alloc.tier, "conference_tickets", parseInt(e.target.value) || 0)}
                        className="w-24 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={alloc.symposium_seats}
                        onChange={(e) => updateAllocation(alloc.tier, "symposium_seats", parseInt(e.target.value) || 0)}
                        className="w-24 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={alloc.vip_dinner_seats}
                        onChange={(e) => updateAllocation(alloc.tier, "vip_dinner_seats", parseInt(e.target.value) || 0)}
                        className="w-24 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Totals</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Conference Tickets:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.conference_tickets, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Symposium Seats:</span>{" "}
                <strong>{allocations.reduce((sum, a) => sum + a.symposium_seats, 0)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">VIP Dinner Seats:</span>{" "}
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
