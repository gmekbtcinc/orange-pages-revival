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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EditBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: {
    id: string;
    member_since: string;
    billing_email: string | null;
    billing_contact_name: string | null;
    payment_amount_cents: number | null;
    renewal_date: string | null;
    next_payment_due: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    notes: string | null;
    businesses?: { name: string } | null;
  };
  onSuccess: () => void;
}

export function EditBillingDialog({
  open,
  onOpenChange,
  membership,
  onSuccess,
}: EditBillingDialogProps) {
  const { toast } = useToast();

  const [memberSince, setMemberSince] = useState<Date>(
    new Date(membership.member_since)
  );
  const [billingEmail, setBillingEmail] = useState(membership.billing_email || "");
  const [billingContactName, setBillingContactName] = useState(membership.billing_contact_name || "");
  const [paymentAmountDollars, setPaymentAmountDollars] = useState(
    membership.payment_amount_cents ? (membership.payment_amount_cents / 100).toString() : ""
  );
  const [renewalDate, setRenewalDate] = useState<Date | undefined>(
    membership.renewal_date ? new Date(membership.renewal_date) : undefined
  );
  const [nextPaymentDue, setNextPaymentDue] = useState<Date | undefined>(
    membership.next_payment_due ? new Date(membership.next_payment_due) : undefined
  );
  const [notes, setNotes] = useState(membership.notes || "");

  const mutation = useMutation({
    mutationFn: async () => {
      const paymentCents = paymentAmountDollars
        ? Math.round(parseFloat(paymentAmountDollars) * 100)
        : null;

      const { error } = await supabase
        .from("memberships")
        .update({
          member_since: format(memberSince, "yyyy-MM-dd"),
          billing_email: billingEmail || null,
          billing_contact_name: billingContactName || null,
          payment_amount_cents: paymentCents,
          renewal_date: renewalDate ? format(renewalDate, "yyyy-MM-dd") : null,
          next_payment_due: nextPaymentDue ? format(nextPaymentDue, "yyyy-MM-dd") : null,
          notes: notes || null,
        })
        .eq("id", membership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Billing updated", description: "Billing information has been saved." });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Membership Details</DialogTitle>
          <DialogDescription>
            Update membership and billing details for {membership.businesses?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Member Since - prominent at top */}
          <div className="space-y-2">
            <Label>Member Since</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !memberSince && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {memberSince ? format(memberSince, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={memberSince}
                  onSelect={(date) => date && setMemberSince(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              The date this company became a BFC member
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Billing Email</Label>
              <Input
                type="email"
                placeholder="billing@company.com"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Billing Contact</Label>
              <Input
                placeholder="Contact name"
                value={billingContactName}
                onChange={(e) => setBillingContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={paymentAmountDollars}
                onChange={(e) => setPaymentAmountDollars(e.target.value)}
                className="pl-7"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !renewalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {renewalDate ? format(renewalDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={renewalDate}
                    onSelect={setRenewalDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Next Payment Due</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextPaymentDue && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextPaymentDue ? format(nextPaymentDue, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextPaymentDue}
                    onSelect={setNextPaymentDue}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(membership.stripe_customer_id || membership.stripe_subscription_id) && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <Label className="text-sm text-muted-foreground">Stripe Integration</Label>
              {membership.stripe_customer_id && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Customer ID:</span>{" "}
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    {membership.stripe_customer_id}
                  </code>
                </p>
              )}
              {membership.stripe_subscription_id && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Subscription ID:</span>{" "}
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    {membership.stripe_subscription_id}
                  </code>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Internal notes..."
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
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
