import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Users, Shield, Clock } from "lucide-react";
import { InviteUserDialog } from "@/components/team/InviteUserDialog";
import { EditUserDialog } from "@/components/team/EditUserDialog";
import type { Tables } from "@/integrations/supabase/types";

type CompanyUser = Tables<"company_users">;
type Membership = Tables<"memberships">;
type TierLimit = Tables<"tier_limits">;

const roleColors: Record<string, string> = {
  company_admin: "bg-bitcoin-orange text-white",
  company_user: "bg-secondary text-secondary-foreground",
  super_admin: "bg-purple-600 text-white",
};

const roleLabels: Record<string, string> = {
  company_admin: "Admin",
  company_user: "User",
  super_admin: "Super Admin",
};

const permissionLabels: Record<string, string> = {
  can_claim_tickets: "Tickets",
  can_register_events: "Events",
  can_apply_speaking: "Speaking",
  can_edit_profile: "Profile",
  can_rsvp_dinners: "Dinners",
  can_request_resources: "Resources",
};

export default function TeamManagement() {
  const { member, companyUser, isLoading: memberLoading } = useMember();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  // Fetch company users for this business
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["team-members", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return [];
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("business_id", companyUser.business_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyUser?.business_id,
  });

  // Fetch membership to get tier
  const { data: membership } = useQuery({
    queryKey: ["membership", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("business_id", companyUser.business_id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyUser?.business_id,
  });

  // Fetch tier limits
  const { data: tierLimit } = useQuery({
    queryKey: ["tier-limit", membership?.tier],
    queryFn: async () => {
      if (!membership?.tier) return null;
      const { data, error } = await supabase
        .from("tier_limits")
        .select("*")
        .eq("tier", membership.tier)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!membership?.tier,
  });

  const activeTeamCount = teamMembers.filter((u) => u.is_active).length;
  const maxUsers = tierLimit?.max_users ?? 0;
  const canInviteMore = maxUsers === -1 || activeTeamCount < maxUsers;
  const canManageUsers = companyUser?.can_manage_users || companyUser?.role === "company_admin";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getActivePermissions = (user: CompanyUser) => {
    const permissions: string[] = [];
    if (user.can_claim_tickets) permissions.push("Tickets");
    if (user.can_register_events) permissions.push("Events");
    if (user.can_apply_speaking) permissions.push("Speaking");
    if (user.can_edit_profile) permissions.push("Profile");
    if (user.can_rsvp_dinners) permissions.push("Dinners");
    if (user.can_request_resources) permissions.push("Resources");
    return permissions;
  };

  if (memberLoading || teamLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!companyUser || !canManageUsers) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to manage team members.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Team ({activeTeamCount}
              {maxUsers !== -1 && ` of ${maxUsers}`})
            </h1>
            <p className="text-muted-foreground">
              Manage your team members and their permissions
            </p>
          </div>
          {canManageUsers && (
            <Button
              onClick={() => setInviteDialogOpen(true)}
              disabled={!canInviteMore}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          )}
        </div>

        {!canInviteMore && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-200">
                You've reached the maximum number of team members for your{" "}
                {membership?.tier} tier. Upgrade your membership to add more.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((user) => (
            <Card
              key={user.id}
              className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/50 ${
                !user.is_active ? "opacity-60" : ""
              }`}
              onClick={() => setEditingUser(user)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {getInitials(user.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base text-foreground">
                        {user.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={roleColors[user.role] || "bg-secondary"}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    {!user.user_id && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    {!user.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {user.title && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {user.title}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {getActivePermissions(user).map((perm) => (
                    <Badge
                      key={perm}
                      variant="secondary"
                      className="text-xs bg-muted"
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No team members yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Invite team members to collaborate on your BFC membership
              </p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        businessId={companyUser.business_id}
        currentUserId={companyUser.id}
        canInviteMore={canInviteMore}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          currentUserId={companyUser.id}
        />
      )}
    </DashboardLayout>
  );
}
