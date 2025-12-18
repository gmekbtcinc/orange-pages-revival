import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, Calendar, Mic2, UtensilsCrossed, Users } from "lucide-react";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MemberFastFacts } from "@/components/dashboard/MemberFastFacts";
import { EventCards } from "@/components/dashboard/EventCards";
import { MemberResources } from "@/components/dashboard/MemberResources";
import { ClaimStatusCard } from "@/components/claims/ClaimStatusCard";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { FreeQuickActions } from "@/components/dashboard/FreeQuickActions";
import { FreeDashboardWelcome } from "@/components/dashboard/FreeDashboardWelcome";
import { MembershipCTA } from "@/components/dashboard/MembershipCTA";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { companyUser, isLoading, membership } = useMember();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

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
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Account Not Linked
          </h2>
          <p className="text-muted-foreground">
            Your account is not linked to a company. Please contact support.
          </p>
        </div>
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

          {/* Claim Status Cards */}
          {userId && <ClaimStatusCard userId={userId} />}

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

        {/* Claim Status Cards */}
        {userId && <ClaimStatusCard userId={userId} />}

        {/* Member Fast Facts */}
        <MemberFastFacts />

        {/* Events Section */}
        <div id="events-section">
          <EventCards />
        </div>

        {/* Member Resources */}
        <MemberResources />
      </div>
    </DashboardLayout>
  );
}
