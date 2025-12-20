import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FULFILLMENT_STATUS_LABELS,
  type Fulfillment,
  type FulfillmentStatus
} from "@/types/user";

interface FulfillmentDialogProps {
  businessId: string;
  benefitId: string;
  benefitName: string;
  eventId?: string | null;
  periodYear?: number;
  existingFulfillment?: Fulfillment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FulfillmentDialog({
  businessId,
  benefitId,
  benefitName,
  eventId,
  periodYear,
  existingFulfillment,
  open,
  onOpenChange,
}: FulfillmentDialogProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<FulfillmentStatus>("completed");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [year, setYear] = useState(periodYear?.toString() || currentYear.toString());

  // Load existing fulfillment values
  useEffect(() => {
    if (existingFulfillment) {
      setQuantity(existingFulfillment.quantity.toString());
      setStatus(existingFulfillment.status);
      setTitle(existingFulfillment.title || "");
      setNotes(existingFulfillment.notes || "");
      setProofUrl(existingFulfillment.proof_url || "");
      setScheduledDate(existingFulfillment.scheduled_date || "");
      setYear(existingFulfillment.period_year?.toString() || currentYear.toString());
    } else {
      // Reset form
      setQuantity("1");
      setStatus("completed");
      setTitle("");
      setNotes("");
      setProofUrl("");
      setScheduledDate("");
      setYear(periodYear?.toString() || currentYear.toString());
    }
  }, [existingFulfillment, periodYear, currentYear, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        business_id: businessId,
        benefit_id: benefitId,
        event_id: eventId || null,
        period_year: parseInt(year),
        quantity: parseInt(quantity),
        status,
        title: title || null,
        notes: notes || null,
        proof_url: proofUrl || null,
        scheduled_date: scheduledDate || null,
        fulfilled_at: status === "completed" ? new Date().toISOString() : null,
      };

      if (existingFulfillment) {
        const { error } = await supabase
          .from("fulfillments")
          .update(data)
          .eq("id", existingFulfillment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fulfillments")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillments"] });
      queryClient.invalidateQueries({ queryKey: ["company-fulfillments"] });
      toast.success(existingFulfillment ? "Fulfillment updated" : "Fulfillment recorded");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingFulfillment) return;
      const { error } = await supabase
        .from("fulfillments")
        .delete()
        .eq("id", existingFulfillment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillments"] });
      queryClient.invalidateQueries({ queryKey: ["company-fulfillments"] });
      toast.success("Fulfillment deleted");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingFulfillment ? "Edit" : "Record"} Fulfillment
          </DialogTitle>
          <DialogDescription>
            {benefitName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as FulfillmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FULFILLMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Period Year (if not event-based) */}
          {!eventId && (
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Title / Description</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Episode 47 - The Future of Mining"
            />
          </div>

          {/* Scheduled Date (for scheduled status) */}
          {status === "scheduled" && (
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          )}

          {/* Proof URL */}
          <div className="space-y-2">
            <Label>Proof URL (optional)</Label>
            <Input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Link to podcast episode, magazine scan, etc.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingFulfillment && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Delete
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
              {saveMutation.isPending ? "Saving..." : existingFulfillment ? "Update" : "Record"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
