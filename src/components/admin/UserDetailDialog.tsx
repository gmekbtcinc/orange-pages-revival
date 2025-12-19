import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, X, Ticket, Calendar, Mic, Edit, Users, Utensils, BookOpen, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { derivePermissions, getRoleDisplayName, getTierDisplayName } from "@/lib/permissions";
import type { Enums } from "@/integrations/supabase/types";

type TeamRole = Enums<"team_role">;
type MemberTier = Enums<"member_tier">;

interface UserDetailDialogProps {
  user: {
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
    businesses?: { 
      id: string;
      name: string;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  // Fetch membership tier for the business
  const { data: membership } = useQuery({
    queryKey: ["membership-for-user", user?.business_id],
    queryFn: async () => {
      if (!user?.business_id) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("tier, is_active")
        .eq("business_id", user.business_id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.business_id && open,
  });

  const { data: activityStats } = useQuery({
    queryKey: ["user-activity", user?.profile_id, user?.business_id],
    queryFn: async () => {
      if (!user?.profile_id || !user?.business_id) return null;
      
      const [ticketClaims, symposiumRegs, speakerApps, dinnerRsvps] = await Promise.all([
        supabase.from("ticket_claims").select("id", { count: "exact" }).eq("profile_id", user.profile_id).eq("business_id", user.business_id),
        supabase.from("symposium_registrations").select("id", { count: "exact" }).eq("profile_id", user.profile_id),
        supabase.from("speaker_applications").select("id", { count: "exact" }).eq("profile_id", user.profile_id),
        supabase.from("vip_dinner_rsvps").select("id", { count: "exact" }).eq("profile_id", user.profile_id),
      ]);
      
      return {
        ticketClaims: ticketClaims.count || 0,
        symposiumRegs: symposiumRegs.count || 0,
        speakerApps: speakerApps.count || 0,
        dinnerRsvps: dinnerRsvps.count || 0,
      };
    },
    enabled: !!user?.profile_id && !!user?.business_id && open,
  });

  if (!user || !user.profiles) return null;

  const initials = user.profiles.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Derive permissions from role and membership
  const isActiveMember = membership?.is_active ?? false;
  const tier = membership?.tier as MemberTier | null;
  const derivedPermissions = derivePermissions(user.role, tier, isActiveMember);

  const getStatusBadge = () => {
    if (!isActiveMember) {
      return <Badge variant="secondary">Free User</Badge>;
    }
    return <Badge className="bg-green-500">Active Member</Badge>;
  };

  const permissions = [
    { key: "canClaimTickets", label: "Claim conference tickets", icon: Ticket, value: derivedPermissions.canClaimTickets },
    { key: "canRegisterEvents", label: "Register for symposiums", icon: Calendar, value: derivedPermissions.canRegisterEvents },
    { key: "canApplySpeaking", label: "Submit speaker applications", icon: Mic, value: derivedPermissions.canApplySpeaking },
    { key: "canEditProfile", label: "Edit company profile", icon: Edit, value: derivedPermissions.canEditProfile },
    { key: "canManageTeam", label: "Manage team members", icon: Users, value: derivedPermissions.canManageTeam },
    { key: "canRsvpDinners", label: "RSVP for VIP dinners", icon: Utensils, value: derivedPermissions.canRsvpDinners },
    { key: "canRequestResources", label: "Request member resources", icon: BookOpen, value: derivedPermissions.canRequestResources },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.profiles.display_name}</h3>
              <p className="text-muted-foreground">{user.profiles.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={user.role === "owner" ? "default" : user.role === "admin" ? "secondary" : "outline"}>
                  {getRoleDisplayName(user.role)}
                </Badge>
                {tier && (
                  <Badge className="bg-bitcoin-orange text-white">
                    {getTierDisplayName(tier)}
                  </Badge>
                )}
                {getStatusBadge()}
                {user.is_primary && (
                  <Badge variant="outline">Primary</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact & Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {user.profiles.email}</p>
                <p><span className="text-muted-foreground">Phone:</span> {user.profiles.phone || "Not provided"}</p>
                <p><span className="text-muted-foreground">Title:</span> {user.profiles.title || "Not provided"}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Company</h4>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{user.businesses?.name || "Unknown"}</span>
              </div>
              {tier && (
                <p className="text-sm text-muted-foreground mt-1">
                  Membership Tier: {getTierDisplayName(tier)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Permissions</h4>
              <span className="text-xs text-muted-foreground">
                Based on {getRoleDisplayName(user.role)} role {tier ? `+ ${getTierDisplayName(tier)} tier` : "(no active membership)"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <div key={perm.key} className="flex items-center gap-2 text-sm">
                  {perm.value ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <perm.icon className="h-4 w-4 text-muted-foreground" />
                  <span className={perm.value ? "" : "text-muted-foreground"}>{perm.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h4 className="font-medium mb-3">Activity Summary</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{activityStats?.ticketClaims || 0}</p>
                <p className="text-xs text-muted-foreground">Ticket Claims</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{activityStats?.symposiumRegs || 0}</p>
                <p className="text-xs text-muted-foreground">Symposium Regs</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{activityStats?.speakerApps || 0}</p>
                <p className="text-xs text-muted-foreground">Speaker Apps</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{activityStats?.dinnerRsvps || 0}</p>
                <p className="text-xs text-muted-foreground">Dinner RSVPs</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Joined:</span>{" "}
              {user.joined_at ? format(new Date(user.joined_at), "PPP") : "N/A"}
            </div>
            <div>
              <span className="text-muted-foreground">Record Created:</span>{" "}
              {user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
