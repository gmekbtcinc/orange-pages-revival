import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/contexts/member/MemberContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Building2, ArrowRight, ExternalLink } from "lucide-react";

interface SubmissionStatusCardProps {
  userId: string;
}

export function SubmissionStatusCard({ userId }: SubmissionStatusCardProps) {
  const { refetch } = useMember();
  const navigate = useNavigate();

  const { data: submissions = [] } = useQuery({
    queryKey: ["user-submissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_submissions")
        .select(`
          id,
          name,
          status,
          rejection_reason,
          created_business_id,
          created_at
        `)
        .eq("submitter_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const approvedSubmissions = submissions.filter((s) => s.status === "approved");
  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected");

  if (submissions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  You have {pendingSubmissions.length} pending business submission
                  {pendingSubmissions.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendingSubmissions.map((s) => s.name).join(", ")} — We're reviewing your submission and will notify you once it's approved.
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 shrink-0">
                Under Review
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Submissions */}
      {approvedSubmissions.map((submission) => (
        <Card key={submission.id} className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {submission.name} was approved!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your business is now live on Orange Pages
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {submission.created_business_id && (
                  <Link to={`/business/${submission.created_business_id}`}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Listing
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  onClick={async () => {
                    await refetch();
                    navigate("/dashboard/company-profile");
                  }}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Edit Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Rejected Submissions */}
      {rejectedSubmissions.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-500/20 shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {rejectedSubmissions.length} submission{rejectedSubmissions.length > 1 ? "s were" : " was"} not approved
                </p>
                {rejectedSubmissions.map((submission) => (
                  <div key={submission.id} className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>{submission.name}</strong>
                      {submission.rejection_reason && (
                        <span className="block text-red-600 mt-1">
                          Reason: {submission.rejection_reason}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <Badge variant="outline" className="text-red-500 border-red-500/30 shrink-0">
                Not Approved
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
