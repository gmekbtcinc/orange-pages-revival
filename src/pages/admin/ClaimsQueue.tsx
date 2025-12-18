import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, Building2, User, Mail, Briefcase, Plus } from "lucide-react";
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

interface Submission {
  id: string;
  submitter_user_id: string;
  submitter_email: string;
  submitter_name: string;
  name: string;
  description: string;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  category_id: string | null;
  wants_to_claim: boolean;
  claim_title: string | null;
  claim_relationship: string | null;
  status: string;
  created_at: string;
  categories?: { name: string } | null;
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
  const [rejectingSubmission, setRejectingSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
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

  // Fetch pending submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["pending-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_submissions")
        .select(`
          id,
          submitter_user_id,
          submitter_email,
          submitter_name,
          name,
          description,
          website,
          city,
          state,
          country,
          category_id,
          wants_to_claim,
          claim_title,
          claim_relationship,
          status,
          created_at,
          categories (name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Submission[];
    },
  });

  const { data: currentAdmin } = useQuery({
    queryKey: ["current-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check user_roles table for admin role
      const { data: role } = await supabase
        .from("user_roles")
        .select("id, user_id")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin"])
        .maybeSingle();

      return role;
    },
  });

  // Approve claim mutation - now with free/member permission logic
  const approveMutation = useMutation({
    mutationFn: async (claim: ClaimWithBusiness) => {
      if (!currentAdmin) throw new Error("Admin not found");

      // Check if business has active membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, tier")
        .eq("business_id", claim.business_id)
        .eq("is_active", true)
        .maybeSingle();

      const isBFCMember = !!membership;

      // Update claim status
      const { error: claimError } = await supabase
        .from("business_claims")
        .update({
          status: "approved",
          reviewed_by: currentAdmin.user_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      // Link user to business using admin RPC function (bypasses RLS)
      if (claim.claimant_user_id) {
        const { error: linkError } = await supabase.rpc('admin_link_user_to_business', {
          _user_id: claim.claimant_user_id,
          _business_id: claim.business_id,
          _email: claim.claimant_email,
          _display_name: claim.claimant_name,
          _title: claim.claimant_title,
          _role: 'company_admin',
          _is_member: isBFCMember,
        });

        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
      toast({
        title: "Claim approved",
        description: "The business claim has been approved and the user has been granted access.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error approving claim",
        description: error.message,
      });
    },
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ claim, reason }: { claim: ClaimWithBusiness; reason: string }) => {
      if (!currentAdmin) throw new Error("Admin not found");

      const { error } = await supabase
        .from("business_claims")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_by: currentAdmin.user_id,
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
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error rejecting claim",
        description: error.message,
      });
    },
  });

  // Approve submission mutation
  const approveSubmissionMutation = useMutation({
    mutationFn: async (submission: Submission) => {
      if (!currentAdmin) throw new Error("Admin not found");

      // Create the business record
      const { data: newBusiness, error: bizError } = await supabase
        .from("businesses")
        .insert({
          name: submission.name,
          description: submission.description,
          website: submission.website,
          city: submission.city,
          state: submission.state,
          country: submission.country,
          category_id: submission.category_id,
          status: "approved",
          submitted_by: submission.submitter_user_id,
        })
        .select()
        .single();

      if (bizError) throw bizError;

      // Update submission with created_business_id
      const { error: updateError } = await supabase
        .from("business_submissions")
        .update({
          status: "approved",
          created_business_id: newBusiness.id,
          reviewed_by: currentAdmin.user_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      // If submitter wanted to claim, link user using admin RPC function (bypasses RLS)
      if (submission.wants_to_claim && submission.submitter_user_id) {
        const { error: linkError } = await supabase.rpc('admin_link_user_to_business', {
          _user_id: submission.submitter_user_id,
          _business_id: newBusiness.id,
          _email: submission.submitter_email,
          _display_name: submission.submitter_name,
          _title: submission.claim_title,
          _role: 'company_admin',
          _is_member: false, // New submissions start as free users
        });

        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-submissions"] });
      toast({
        title: "Submission approved",
        description: "The business has been added to the directory.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error approving submission",
        description: error.message,
      });
    },
  });

  // Reject submission mutation
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ submission, reason }: { submission: Submission; reason: string }) => {
      if (!currentAdmin) throw new Error("Admin not found");

      const { error } = await supabase
        .from("business_submissions")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_by: currentAdmin.user_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-submissions"] });
      setRejectingSubmission(null);
      setRejectionReason("");
      toast({
        title: "Submission rejected",
        description: "The business submission has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error rejecting submission",
        description: error.message,
      });
    },
  });

  if (claimsLoading || submissionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: "Claims & Submissions" }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Claims & Submissions Queue
          </h1>
          <p className="text-muted-foreground">
            Review business claims and new submissions
          </p>
        </div>

        <Tabs defaultValue="claims">
          <TabsList>
            <TabsTrigger value="claims" className="gap-2">
              <Building2 className="h-4 w-4" />
              Claims ({claims.length})
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Plus className="h-4 w-4" />
              Submissions ({submissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Claims Tab */}
          <TabsContent value="claims" className="mt-6">
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
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="mt-6">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    All caught up!
                  </h3>
                  <p className="text-muted-foreground">
                    No pending business submissions to review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            {submission.name}
                            {submission.wants_to_claim && (
                              <Badge variant="secondary" className="text-xs">
                                + Claim
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Submitted by {submission.submitter_name} on {format(new Date(submission.created_at), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 bg-yellow-500/10">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{submission.description}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{submission.submitter_email}</span>
                        </div>
                        {submission.website && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={submission.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {submission.website}
                            </a>
                          </div>
                        )}
                        {(submission.city || submission.country) && (
                          <div className="text-sm text-muted-foreground">
                            📍 {[submission.city, submission.state, submission.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                        {submission.categories?.name && (
                          <div className="text-sm">
                            <Badge variant="outline">{submission.categories.name}</Badge>
                          </div>
                        )}
                      </div>

                      {submission.wants_to_claim && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground font-medium mb-1">
                            Claim Request:
                          </p>
                          <p className="text-sm">
                            {submission.claim_title && `${submission.claim_title} - `}
                            {relationshipLabels[submission.claim_relationship || ""] || submission.claim_relationship}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => approveSubmissionMutation.mutate(submission)}
                          disabled={approveSubmissionMutation.isPending}
                          className="flex-1"
                        >
                          {approveSubmissionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setRejectingSubmission(submission)}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Claim Dialog */}
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

      {/* Reject Submission Dialog */}
      <Dialog open={!!rejectingSubmission} onOpenChange={(open) => !open && setRejectingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="submission_rejection_reason">Rejection Reason</Label>
            <Textarea
              id="submission_rejection_reason"
              placeholder="e.g., Duplicate listing, not a Bitcoin business..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingSubmission(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectingSubmission && rejectSubmissionMutation.mutate({ submission: rejectingSubmission, reason: rejectionReason })}
              disabled={rejectSubmissionMutation.isPending || !rejectionReason.trim()}
            >
              {rejectSubmissionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
