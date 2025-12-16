import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, Building2, User, Mail, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface ClaimWithBusiness {
  id: string;
  business_id: string;
  claimant_user_id: string | null;
  claimant_name: string;
  claimant_email: string;
  claimant_title: string | null;
  verification_method: string | null;
  verification_notes: string | null;
  status: string | null;
  created_at: string | null;
  businesses: {
    name: string;
  } | null;
}

const relationshipLabels: Record<string, string> = {
  owner: "Owner",
  executive: "Executive",
  employee: "Employee",
  authorized_representative: "Authorized Representative",
};

export default function ClaimsQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectingClaim, setRejectingClaim] = useState<ClaimWithBusiness | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["pending-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_claims")
        .select(`
          id,
          business_id,
          claimant_user_id,
          claimant_name,
          claimant_email,
          claimant_title,
          verification_method,
          verification_notes,
          status,
          created_at,
          businesses (name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ClaimWithBusiness[];
    },
  });

  const { data: currentAdmin } = useQuery({
    queryKey: ["current-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (claim: ClaimWithBusiness) => {
      if (!currentAdmin) throw new Error("Admin not found");

      // Update claim status
      const { error: claimError } = await supabase
        .from("business_claims")
        .update({
          status: "approved",
          reviewed_by: currentAdmin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      // Create company_user record with company_admin role
      if (claim.claimant_user_id) {
        const { error: userError } = await supabase.from("company_users").insert({
          business_id: claim.business_id,
          user_id: claim.claimant_user_id,
          email: claim.claimant_email,
          display_name: claim.claimant_name,
          title: claim.claimant_title,
          role: "company_admin",
          can_claim_tickets: true,
          can_register_events: true,
          can_apply_speaking: true,
          can_edit_profile: true,
          can_manage_users: true,
          can_rsvp_dinners: true,
          can_request_resources: true,
          is_active: true,
          accepted_at: new Date().toISOString(),
        });

        if (userError) throw userError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
      toast({
        title: "Claim approved",
        description: "The business claim has been approved and the user has been granted access.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error approving claim",
        description: error.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ claim, reason }: { claim: ClaimWithBusiness; reason: string }) => {
      if (!currentAdmin) throw new Error("Admin not found");

      const { error } = await supabase
        .from("business_claims")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_by: currentAdmin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claim.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
      setRejectingClaim(null);
      setRejectionReason("");
      toast({
        title: "Claim rejected",
        description: "The business claim has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error rejecting claim",
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Claims Queue
          </h1>
          <p className="text-muted-foreground">
            Review and process business ownership claims
          </p>
        </div>

        {claims.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                All caught up!
              </h3>
              <p className="text-muted-foreground">
                No pending business claims to review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card key={claim.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {claim.businesses?.name || "Unknown Business"}
                      </CardTitle>
                      <CardDescription>
                        Submitted {claim.created_at && format(new Date(claim.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 bg-yellow-500/10">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">{claim.claimant_name}</span>
                        {claim.claimant_title && (
                          <span className="text-muted-foreground"> - {claim.claimant_title}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{claim.claimant_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {relationshipLabels[claim.verification_method || ""] || claim.verification_method}
                      </span>
                    </div>
                  </div>

                  {claim.verification_notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        Verification Notes:
                      </p>
                      <p className="text-sm">{claim.verification_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => approveMutation.mutate(claim)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectingClaim(claim)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingClaim} onOpenChange={(open) => !open && setRejectingClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this claim. This will be shared with the claimant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Rejection Reason</Label>
            <Textarea
              id="rejection_reason"
              placeholder="e.g., Could not verify relationship to the company..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingClaim(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectingClaim && rejectMutation.mutate({ claim: rejectingClaim, reason: rejectionReason })}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
