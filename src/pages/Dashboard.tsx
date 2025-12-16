import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MemberFastFacts } from "@/components/dashboard/MemberFastFacts";
import { EventCards } from "@/components/dashboard/EventCards";
import { MemberResources } from "@/components/dashboard/MemberResources";

export default function Dashboard() {
  const { member, isLoading } = useMember();

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

  if (!member) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Member Profile Not Found
          </h2>
          <p className="text-muted-foreground">
            Your account is not linked to a BFC membership. Please contact support.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <MemberFastFacts />
        <EventCards />
        <MemberResources />
      </div>
    </DashboardLayout>
  );
}
