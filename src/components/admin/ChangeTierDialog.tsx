import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChangeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: {
    id: string;
    tier: string;
    businesses?: { name: string } | null;
  };
  onSuccess: () => void;
}

const tierColors: Record<string, string> = {
  silver: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  platinum: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  chairman: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  executive: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const tierLabels: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  chairman: "Chairman's Circle",
  executive: "Executive",
};

export function ChangeTierDialog({
  open,
  onOpenChange,
  membership,
  onSuccess,
}: ChangeTierDialogProps) {
  const { toast } = useToast();
  const [newTier, setNewTier] = useState(membership.tier);
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const tierValue = newTier as "silver" | "gold" | "platinum" | "chairman" | "executive";
      const { error } = await supabase
        .from("memberships")
        .update({
          tier: tierValue,
          notes: notes ? `Tier changed on ${format(effectiveDate, "MMM d, yyyy")}: ${notes}` : undefined,
        })
        .eq("id", membership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      const action = getTierLevel(newTier) > getTierLevel(membership.tier) ? "upgraded" : "downgraded";
      toast({
        title: `Membership ${action}`,
        description: `${membership.businesses?.name} is now ${tierLabels[newTier] || newTier}`,
      });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getTierLevel = (tier: string): number => {
    const levels: Record<string, number> = {
      silver: 1,
      gold: 2,
      platinum: 3,
      chairman: 4,
      executive: 5,
    };
    return levels[tier] || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Membership Tier</DialogTitle>
          <DialogDescription>
            Update the membership tier for {membership.businesses?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Tier</Label>
            <div>
              <Badge variant="outline" className={tierColors[membership.tier] || ""}>
                <Crown className="h-3 w-3 mr-1" />
                {tierLabels[membership.tier] || membership.tier}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Tier</Label>
            <Select value={newTier} onValueChange={setNewTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="chairman">Chairman's Circle</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(date) => date && setEffectiveDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Reason for tier change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || newTier === membership.tier}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Change Tier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
