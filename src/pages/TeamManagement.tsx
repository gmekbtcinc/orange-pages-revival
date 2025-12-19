import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Users, Shield, Clock, Mail, X, Eye } from "lucide-react";
import { InviteUserDialog } from "@/components/team/InviteUserDialog";
import { UserDetailSheet } from "@/components/shared/UserDetailSheet";
import type { Tables } from "@/integrations/supabase/types";

type TeamMembership = Tables<"team_memberships">;
type Profile = Tables<"profiles">;
type Invitation = Tables<"invitations">;

interface TeamMemberWithProfile extends TeamMembership {
  profiles: Profile | null;
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-600 text-white",
  admin: "bg-bitcoin-orange text-white",
  member: "bg-secondary text-secondary-foreground",
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function TeamManagement() {
  const { profile, activeCompanyId, activeCompany, permissions, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithProfile | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Fetch team memberships with profiles for this business
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["team-members", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("team_memberships")
        .select(`
          *,
          profiles!team_memberships_profile_id_fkey (*)
        `)
        .eq("business_id", activeCompanyId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data as unknown as TeamMemberWithProfile[];
    },
    enabled: !!activeCompanyId,
  });

  // Fetch pending invitations
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["pending-invitations", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("business_id", activeCompanyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!activeCompanyId,
  });

  // Fetch membership to get tier
  const { data: membership } = useQuery({
    queryKey: ["membership", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("business_id", activeCompanyId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
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

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: profile?.id })
        .eq("id", invitationId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      toast({ title: "Invitation revoked" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const activeTeamCount = teamMembers.length;
  const maxUsers = tierLimit?.max_users ?? 0;
  const canInviteMore = maxUsers === -1 || activeTeamCount < maxUsers;
  const canManageTeam = permissions?.canManageTeam || false;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const breadcrumbs = [{ label: "Team Management" }];

  if (userLoading || teamLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !activeCompanyId || !canManageTeam) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
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
    <DashboardLayout breadcrumbs={breadcrumbs}>
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
              Manage your team members and invitations
            </p>
          </div>
          {canManageTeam && (
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

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations ({pendingInvitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited as {roleLabels[invitation.role] || invitation.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <Card
              key={member.id}
              className="bg-card border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedMember(member);
                setDetailSheetOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {getInitials(member.profiles?.display_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base text-foreground">
                        {member.profiles?.display_name || "Unknown"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {member.profiles?.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={roleColors[member.role] || "bg-secondary"}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                    {member.is_primary && (
                      <Badge variant="outline" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {member.profiles?.title && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {member.profiles.title}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
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
        businessId={activeCompanyId}
        currentUserId={profile.id}
        canInviteMore={canInviteMore}
      />

      <UserDetailSheet
        member={selectedMember ? {
          ...selectedMember,
          profiles: selectedMember.profiles ? {
            ...selectedMember.profiles,
            avatar_url: selectedMember.profiles.avatar_url || null,
          } : null,
        } : null}
        businessName={activeCompany?.business?.name || undefined}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        canEditRole={canManageTeam}
        currentUserId={profile.id}
      />
    </DashboardLayout>
  );
}
