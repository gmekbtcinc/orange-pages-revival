import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Ticket, Calendar, Mic2, UtensilsCrossed, Users, Building2, Search } from "lucide-react";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MemberFastFacts } from "@/components/dashboard/MemberFastFacts";
import { EventCards } from "@/components/dashboard/EventCards";
import { MemberResources } from "@/components/dashboard/MemberResources";
import { ClaimStatusCard } from "@/components/claims/ClaimStatusCard";
import { SubmissionStatusCard } from "@/components/claims/SubmissionStatusCard";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { FreeQuickActions } from "@/components/dashboard/FreeQuickActions";
import { FreeDashboardWelcome } from "@/components/dashboard/FreeDashboardWelcome";
import { MembershipCTA } from "@/components/dashboard/MembershipCTA";
import { SubmitBusinessDialog } from "@/components/submissions/SubmitBusinessDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { companyUser, isLoading, membership } = useMember();
  const [userId, setUserId] = useState<string | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<Record<string, unknown> | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Check for pending submission on mount
  useEffect(() => {
    const openSubmit = searchParams.get("openSubmit");
    const pendingData = sessionStorage.getItem("pendingBusinessSubmission");
    
    if (pendingData && userId) {
      try {
        const parsed = JSON.parse(pendingData);
        console.log("[Dashboard] Found pending submission data:", parsed);
        setPendingSubmissionData(parsed);
        setSubmitDialogOpen(true);
        // Clear URL param
        searchParams.delete("openSubmit");
        setSearchParams(searchParams, { replace: true });
        toast({
          title: "Continue your submission",
          description: "We've restored your business submission form.",
        });
      } catch (e) {
        console.error("[Dashboard] Error parsing pending submission:", e);
        sessionStorage.removeItem("pendingBusinessSubmission");
      }
    } else if (openSubmit === "true" && userId) {
      setSubmitDialogOpen(true);
      searchParams.delete("openSubmit");
      setSearchParams(searchParams, { replace: true });
    }
  }, [userId, searchParams, setSearchParams, toast]);

  // Clear pending data when dialog closes
  const handleDialogClose = () => {
    setSubmitDialogOpen(false);
    setPendingSubmissionData(null);
    sessionStorage.removeItem("pendingBusinessSubmission");
  };

  // Check if user's business has an active membership
  const { data: hasMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ["business-membership-status", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return false;
      const { data } = await supabase
        .from("memberships")
        .select("id")
        .eq("business_id", companyUser.business_id)
        .eq("is_active", true)
        .maybeSingle();
      return !!data;
    },
    enabled: !!companyUser?.business_id,
  });

  const isFreeUser = !hasMembership && !membershipLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!companyUser) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-bitcoin-orange/10 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-bitcoin-orange" />
              </div>
              <CardTitle className="text-2xl">Welcome to Orange Pages</CardTitle>
              <CardDescription className="text-base">
                Your account isn't linked to a company yet. Get started by claiming an existing business or submitting a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = "/"}
                >
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Find & Claim Business</span>
                  <span className="text-xs text-muted-foreground">Browse the directory</span>
                </Button>
                <Button 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Submit New Business</span>
                  <span className="text-xs text-muted-foreground">Add to directory</span>
                </Button>
              </div>
              {userId && <ClaimStatusCard userId={userId} />}
              {userId && <SubmissionStatusCard userId={userId} />}
            </CardContent>
          </Card>
        </div>
        <SubmitBusinessDialog 
          isOpen={submitDialogOpen} 
          onClose={handleDialogClose}
          initialData={pendingSubmissionData}
        />
      </DashboardLayout>
    );
  }

  // Free user dashboard
  if (isFreeUser) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Free Welcome Header */}
          <FreeDashboardWelcome />

          {/* Free Quick Actions */}
          <FreeQuickActions />

          {/* Status Cards */}
          {userId && <ClaimStatusCard userId={userId} />}
          {userId && <SubmissionStatusCard userId={userId} />}

          {/* Membership CTA */}
          <MembershipCTA />

          {/* Locked Features Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              BFC Member Benefits
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <LockedFeatureCard
                icon={Ticket}
                title="Conference Tickets"
                description="Claim your allocated conference passes for Bitcoin events"
                benefit="Members get 2-10 tickets included"
              />
              <LockedFeatureCard
                icon={Calendar}
                title="BFC Symposium"
                description="Exclusive members-only symposium with industry leaders"
                benefit="Premium networking event"
              />
              <LockedFeatureCard
                icon={Mic2}
                title="Speaking Opportunities"
                description="Apply to speak at Bitcoin conferences worldwide"
                benefit="Members get priority consideration"
              />
              <LockedFeatureCard
                icon={UtensilsCrossed}
                title="VIP Dinners"
                description="Intimate dinners with Bitcoin industry executives"
                benefit="Executive tier and above"
              />
              <LockedFeatureCard
                icon={Users}
                title="Team Management"
                description="Add team members to share dashboard access"
                benefit="Higher tiers get more seats"
              />
            </div>
          </div>
        </div>
        <SubmitBusinessDialog 
          isOpen={submitDialogOpen} 
          onClose={handleDialogClose}
          initialData={pendingSubmissionData}
        />
      </DashboardLayout>
    );
  }

  // Full BFC member dashboard
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* Quick Actions */}
        <QuickActions />

        {/* Status Cards */}
        {userId && <ClaimStatusCard userId={userId} />}
        {userId && <SubmissionStatusCard userId={userId} />}

        {/* Member Fast Facts */}
        <MemberFastFacts />

        {/* Events Section */}
        <div id="events-section">
          <EventCards />
        </div>

        {/* Member Resources */}
        <MemberResources />
      </div>
      <SubmitBusinessDialog 
        isOpen={submitDialogOpen} 
        onClose={handleDialogClose}
        initialData={pendingSubmissionData}
      />
    </DashboardLayout>
  );
}
