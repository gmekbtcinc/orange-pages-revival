import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, FileCheck, Users, ArrowRight, Clock, CheckCircle, XCircle, UserPlus, Ticket, GraduationCap, Mic, Utensils, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type ActivityItem = {
  id: string;
  type: "ticket" | "symposium" | "speaker" | "dinner";
  userName: string;
  companyName: string | null;
  eventName: string | null;
  timestamp: string;
  status: string | null;
};

const activityConfig = {
  ticket: { icon: Ticket, label: "Ticket Claimed", color: "text-blue-500" },
  symposium: { icon: GraduationCap, label: "Symposium Registration", color: "text-purple-500" },
  speaker: { icon: Mic, label: "Speaker Application", color: "text-green-500" },
  dinner: { icon: Utensils, label: "VIP Dinner RSVP", color: "text-orange-500" },
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  approved: "bg-green-500/10 text-green-600 border-green-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [companies, memberships, pendingClaims, users, ticketClaims, symposiums, speakerApps, dinnerRsvps] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("memberships").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("ticket_claims").select("id", { count: "exact", head: true }),
        supabase.from("symposium_registrations").select("id", { count: "exact", head: true }),
        supabase.from("speaker_applications").select("id", { count: "exact", head: true }),
        supabase.from("vip_dinner_rsvps").select("id", { count: "exact", head: true }),
      ]);

      return {
        companies: companies.count || 0,
        memberships: memberships.count || 0,
        pendingClaims: pendingClaims.count || 0,
        users: users.count || 0,
        totalEngagements: (ticketClaims.count || 0) + (symposiums.count || 0) + (speakerApps.count || 0) + (dinnerRsvps.count || 0),
      };
    },
  });

  const { data: recentClaims = [] } = useQuery({
    queryKey: ["admin-recent-claims"],
    queryFn: async () => {
      const { data } = await supabase
        .from("business_claims")
        .select(`
          id,
          status,
          created_at,
          claimant_name,
          businesses (name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  const { data: recentUsers = [] } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_memberships")
        .select(`
          id,
          role,
          created_at,
          profiles (display_name),
          businesses (name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const [tickets, symposiums, speakers, dinners] = await Promise.all([
        supabase
          .from("ticket_claims")
          .select(`
            id,
            attendee_name,
            attendee_company,
            claimed_at,
            status,
            events (name)
          `)
          .order("claimed_at", { ascending: false })
          .limit(5),
        supabase
          .from("symposium_registrations")
          .select(`
            id,
            attendee_name,
            attendee_company,
            registered_at,
            status,
            events (name)
          `)
          .order("registered_at", { ascending: false })
          .limit(5),
        supabase
          .from("speaker_applications")
          .select(`
            id,
            speaker_name,
            speaker_company,
            created_at,
            status,
            events (name)
          `)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("vip_dinner_rsvps")
          .select(`
            id,
            guest_name,
            guest_company,
            rsvp_at,
            status,
            events (name)
          `)
          .order("rsvp_at", { ascending: false })
          .limit(5),
      ]);

      const activities: ActivityItem[] = [
        ...(tickets.data || []).map((t: any) => ({
          id: `ticket-${t.id}`,
          type: "ticket" as const,
          userName: t.attendee_name,
          companyName: t.attendee_company,
          eventName: t.events?.name,
          timestamp: t.claimed_at,
          status: t.status,
        })),
        ...(symposiums.data || []).map((s: any) => ({
          id: `symposium-${s.id}`,
          type: "symposium" as const,
          userName: s.attendee_name,
          companyName: s.attendee_company,
          eventName: s.events?.name,
          timestamp: s.registered_at,
          status: s.status,
        })),
        ...(speakers.data || []).map((s: any) => ({
          id: `speaker-${s.id}`,
          type: "speaker" as const,
          userName: s.speaker_name,
          companyName: s.speaker_company,
          eventName: s.events?.name,
          timestamp: s.created_at,
          status: s.status,
        })),
        ...(dinners.data || []).map((d: any) => ({
          id: `dinner-${d.id}`,
          type: "dinner" as const,
          userName: d.guest_name,
          companyName: d.guest_company,
          eventName: d.events?.name,
          timestamp: d.rsvp_at,
          status: d.status,
        })),
      ];

      // Sort by timestamp descending and take top 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
  });

  const statCards = [
    {
      label: "Total Companies",
      value: stats?.companies || 0,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      label: "Active Memberships",
      value: stats?.memberships || 0,
      icon: Crown,
      color: "text-yellow-500",
    },
    {
      label: "Total Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Event Engagements",
      value: stats?.totalEngagements || 0,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      label: "Pending Claims",
      value: stats?.pendingClaims || 0,
      icon: FileCheck,
      color: "text-orange-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of BFC platform activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/admin/claims")} className="gap-2">
              <FileCheck className="h-4 w-4" />
              Review Claims
              {(stats?.pendingClaims || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats?.pendingClaims}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/memberships")} className="gap-2">
              <Crown className="h-4 w-4" />
              Manage Memberships
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/companies")} className="gap-2">
              <Building2 className="h-4 w-4" />
              View All Companies
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Claims */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription>Latest business ownership claims</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/claims")} className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentClaims.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No claims yet</p>
              ) : (
                <div className="space-y-3">
                  {recentClaims.map((claim: any) => {
                    const StatusIcon = statusIcons[claim.status] || Clock;
                    return (
                      <div key={claim.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {claim.businesses?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {claim.claimant_name} • {claim.created_at && format(new Date(claim.created_at), "MMM d")}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[claim.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {claim.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly added company users</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((membership: any) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{membership.profiles?.display_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {membership.businesses?.name || "Unknown Company"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs capitalize">
                          {membership.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {membership.created_at && format(new Date(membership.created_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Activity Feed */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Activity
              </CardTitle>
              <CardDescription>Recent member engagement across events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/events")} className="gap-1">
              View Events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const config = activityConfig[activity.type];
                  const ActivityIcon = config.icon;
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center`}>
                          <ActivityIcon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {activity.userName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.companyName || "—"} • {activity.eventName || "Unknown Event"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp && format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
