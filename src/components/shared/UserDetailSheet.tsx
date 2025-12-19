import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Ticket, Calendar, Mic, Edit, Users, Utensils, BookOpen, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { derivePermissions, getRoleDisplayName, getTierDisplayName } from "@/lib/permissions";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

type TeamRole = Enums<"team_role">;
type MemberTier = Enums<"member_tier">;

interface TeamMemberWithProfile {
  id: string;
  profile_id: string;
  business_id: string;
  role: TeamRole;
  is_primary: boolean;
  joined_at: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    phone: string | null;
    title: string | null;
    avatar_url: string | null;
  } | null;
}

interface UserDetailSheetProps {
  member: TeamMemberWithProfile | null;
  businessName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEditRole?: boolean;
  currentUserId?: string;
}

export function UserDetailSheet({ 
  member, 
  businessName,
  open, 
  onOpenChange, 
  canEditRole = false,
  currentUserId
}: UserDetailSheetProps) {
  const queryClient = useQueryClient();

  // Fetch membership tier for the business
  const { data: membership } = useQuery({
    queryKey: ["membership-for-user", member?.business_id],
    queryFn: async () => {
      if (!member?.business_id) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("tier, is_active")
        .eq("business_id", member.business_id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!member?.business_id && open,
  });

  const { data: activityStats } = useQuery({
    queryKey: ["user-activity-sheet", member?.profile_id, member?.business_id],
    queryFn: async () => {
      if (!member?.profile_id || !member?.business_id) return null;
      
      const [ticketClaims, symposiumRegs, speakerApps, dinnerRsvps] = await Promise.all([
        supabase.from("ticket_claims").select("id", { count: "exact" }).eq("profile_id", member.profile_id).eq("business_id", member.business_id),
        supabase.from("symposium_registrations").select("id", { count: "exact" }).eq("profile_id", member.profile_id),
        supabase.from("speaker_applications").select("id", { count: "exact" }).eq("profile_id", member.profile_id),
        supabase.from("vip_dinner_rsvps").select("id", { count: "exact" }).eq("profile_id", member.profile_id),
      ]);
      
      return {
        ticketClaims: ticketClaims.count || 0,
        symposiumRegs: symposiumRegs.count || 0,
        speakerApps: speakerApps.count || 0,
        dinnerRsvps: dinnerRsvps.count || 0,
      };
    },
    enabled: !!member?.profile_id && !!member?.business_id && open,
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamRole }) => {
      const { error } = await supabase
        .from("team_memberships")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  if (!member || !member.profiles) return null;

  const profile = member.profiles;
  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Derive permissions from role and membership
  const isActiveMember = membership?.is_active ?? false;
  const tier = membership?.tier as MemberTier | null;
  const derivedPermissions = derivePermissions(member.role, tier, isActiveMember);

  const permissions = [
    { key: "canClaimTickets", label: "Claim tickets", icon: Ticket, value: derivedPermissions.canClaimTickets },
    { key: "canRegisterEvents", label: "Register symposiums", icon: Calendar, value: derivedPermissions.canRegisterEvents },
    { key: "canApplySpeaking", label: "Apply speaking", icon: Mic, value: derivedPermissions.canApplySpeaking },
    { key: "canEditProfile", label: "Edit profile", icon: Edit, value: derivedPermissions.canEditProfile },
    { key: "canManageTeam", label: "Manage team", icon: Users, value: derivedPermissions.canManageTeam },
    { key: "canRsvpDinners", label: "RSVP dinners", icon: Utensils, value: derivedPermissions.canRsvpDinners },
    { key: "canRequestResources", label: "Request resources", icon: BookOpen, value: derivedPermissions.canRequestResources },
  ];

  const isCurrentUser = currentUserId === member.profile_id;
  const canChangeRole = canEditRole && !isCurrentUser && member.role !== "owner";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Team Member Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* User Info Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{profile.display_name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"}>
                  {getRoleDisplayName(member.role)}
                </Badge>
                {tier && (
                  <Badge className="bg-bitcoin-orange text-white text-xs">
                    {getTierDisplayName(tier)}
                  </Badge>
                )}
                {member.is_primary && (
                  <Badge variant="outline" className="text-xs">Primary</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Contact</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {profile.phone || "Not provided"}</p>
              <p><span className="text-muted-foreground">Title:</span> {profile.title || "Not provided"}</p>
            </div>
          </div>

          {businessName && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-sm">Company</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{businessName}</span>
                </div>
              </div>
            </>
          )}

          {/* Role Management */}
          {canChangeRole && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-sm">Change Role</h4>
                <Select
                  value={member.role}
                  onValueChange={(value) => updateRoleMutation.mutate({ id: member.id, role: value as TeamRole })}
                  disabled={updateRoleMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Admins can manage team members and edit company profile.
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Permissions</h4>
              <span className="text-xs text-muted-foreground">
                {isActiveMember ? getTierDisplayName(tier) : "No membership"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <div key={perm.key} className="flex items-center gap-1.5 text-xs">
                  {perm.value ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground" />
                  )}
                  <perm.icon className="h-3 w-3 text-muted-foreground" />
                  <span className={perm.value ? "" : "text-muted-foreground"}>{perm.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Activity</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{activityStats?.ticketClaims || 0}</p>
                <p className="text-[10px] text-muted-foreground">Tickets</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{activityStats?.symposiumRegs || 0}</p>
                <p className="text-[10px] text-muted-foreground">Symposiums</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{activityStats?.speakerApps || 0}</p>
                <p className="text-[10px] text-muted-foreground">Speaking</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-lg font-bold">{activityStats?.dinnerRsvps || 0}</p>
                <p className="text-[10px] text-muted-foreground">Dinners</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="text-sm">
            <p>
              <span className="text-muted-foreground">Joined:</span>{" "}
              {member.joined_at ? format(new Date(member.joined_at), "PPP") : "N/A"}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
