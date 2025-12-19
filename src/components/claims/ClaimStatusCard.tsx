import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Building2, ArrowRight, ExternalLink } from "lucide-react";

interface ClaimStatusCardProps {
  userId: string;
}

export function ClaimStatusCard({ userId }: ClaimStatusCardProps) {
  const { refetch } = useUser();
  const navigate = useNavigate();

  const { data: claims = [] } = useQuery({
    queryKey: ["user-claims", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_claims")
        .select(`
          id,
          status,
          business_id,
          rejection_reason,
          created_at,
          businesses (name)
        `)
        .eq("claimant_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");
  const rejectedClaims = claims.filter((c) => c.status === "rejected");

  if (claims.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  You have {pendingClaims.length} pending business claim
                  {pendingClaims.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendingClaims.map((c) => c.businesses?.name || "Unknown").join(", ")} — We're reviewing your claim and will notify you once it's approved.
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 shrink-0">
                Under Review
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Claims */}
      {approvedClaims.map((claim) => (
        <Card key={claim.id} className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Your claim for {claim.businesses?.name || "the business"} was approved!
                </p>
                <p className="text-sm text-muted-foreground">
                  You now have access to manage this business listing
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {claim.business_id && (
                  <Link to={`/business/${claim.business_id}`}>
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

      {/* Rejected Claims */}
      {rejectedClaims.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-500/20 shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {rejectedClaims.length} claim{rejectedClaims.length > 1 ? "s were" : " was"} not approved
                </p>
                {rejectedClaims.map((claim) => (
                  <div key={claim.id} className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>{claim.businesses?.name || "Unknown business"}</strong>
                      {claim.rejection_reason && (
                        <span className="block text-red-600 mt-1">
                          Reason: {claim.rejection_reason}
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
