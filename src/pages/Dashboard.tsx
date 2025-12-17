import { useEffect, useState } from "react";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TicketProgress } from "@/components/dashboard/TicketProgress";
import { MemberFastFacts } from "@/components/dashboard/MemberFastFacts";
import { EventCards } from "@/components/dashboard/EventCards";
import { MemberResources } from "@/components/dashboard/MemberResources";
import { ClaimStatusCard } from "@/components/claims/ClaimStatusCard";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { member, companyUser, isLoading, allocations } = useMember();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

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

  if (!member && !companyUser) {
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

  const hasAllocations = allocations.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* Quick Actions */}
        <QuickActions />

        {/* Ticket Progress */}
        {hasAllocations && <TicketProgress />}

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
