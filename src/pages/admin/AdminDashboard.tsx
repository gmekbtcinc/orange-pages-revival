import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, FileCheck, Users, ArrowRight, Clock, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

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
      const [companies, memberships, pendingClaims, users] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("memberships").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      return {
        companies: companies.count || 0,
        memberships: memberships.count || 0,
        pendingClaims: pendingClaims.count || 0,
        users: users.count || 0,
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
      label: "Pending Claims",
      value: stats?.pendingClaims || 0,
      icon: FileCheck,
      color: "text-orange-500",
    },
    {
      label: "Total Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-green-500",
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </AdminLayout>
  );
}
