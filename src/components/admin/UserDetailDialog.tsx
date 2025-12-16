import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, X, Ticket, Calendar, Mic, Edit, Users, Utensils, BookOpen, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserDetailDialogProps {
  user: {
    id: string;
    display_name: string;
    email: string;
    phone: string | null;
    title: string | null;
    role: string;
    business_id: string;
    is_active: boolean | null;
    user_id: string | null;
    can_claim_tickets: boolean | null;
    can_register_events: boolean | null;
    can_apply_speaking: boolean | null;
    can_edit_profile: boolean | null;
    can_manage_users: boolean | null;
    can_rsvp_dinners: boolean | null;
    can_request_resources: boolean | null;
    invited_at: string | null;
    accepted_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    businesses?: { name: string } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  const { data: activityStats } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [ticketClaims, symposiumRegs, speakerApps, dinnerRsvps] = await Promise.all([
        supabase.from("ticket_claims").select("id", { count: "exact" }).eq("company_user_id", user.id),
        supabase.from("symposium_registrations").select("id", { count: "exact" }).eq("company_user_id", user.id),
        supabase.from("speaker_applications").select("id", { count: "exact" }),
        supabase.from("vip_dinner_rsvps").select("id", { count: "exact" }).eq("company_user_id", user.id),
      ]);
      
      return {
        ticketClaims: ticketClaims.count || 0,
        symposiumRegs: symposiumRegs.count || 0,
        speakerApps: speakerApps.count || 0,
        dinnerRsvps: dinnerRsvps.count || 0,
      };
    },
    enabled: !!user?.id && open,
  });

  if (!user) return null;

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getStatusBadge = () => {
    if (!user.is_active) return <Badge variant="destructive">Inactive</Badge>;
    if (!user.user_id) return <Badge className="bg-yellow-500">Invited</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  const permissions = [
    { key: "can_claim_tickets", label: "Claim conference tickets", icon: Ticket, value: user.can_claim_tickets },
    { key: "can_register_events", label: "Register for symposiums", icon: Calendar, value: user.can_register_events },
    { key: "can_apply_speaking", label: "Submit speaker applications", icon: Mic, value: user.can_apply_speaking },
    { key: "can_edit_profile", label: "Edit company profile", icon: Edit, value: user.can_edit_profile },
    { key: "can_manage_users", label: "Manage team members", icon: Users, value: user.can_manage_users },
    { key: "can_rsvp_dinners", label: "RSVP for VIP dinners", icon: Utensils, value: user.can_rsvp_dinners },
    { key: "can_request_resources", label: "Request member resources", icon: BookOpen, value: user.can_request_resources },
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
              <h3 className="text-xl font-semibold">{user.display_name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.role === "company_admin" ? "default" : "secondary"}>
                  {user.role === "company_admin" ? "Company Admin" : "Company User"}
                </Badge>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact & Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
                <p><span className="text-muted-foreground">Phone:</span> {user.phone || "Not provided"}</p>
                <p><span className="text-muted-foreground">Title:</span> {user.title || "Not provided"}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Company</h4>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{user.businesses?.name || "Unknown"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div>
            <h4 className="font-medium mb-3">Permissions</h4>
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
              <span className="text-muted-foreground">Invited:</span>{" "}
              {user.invited_at ? format(new Date(user.invited_at), "PPP") : "N/A"}
            </div>
            <div>
              <span className="text-muted-foreground">Accepted:</span>{" "}
              {user.accepted_at ? format(new Date(user.accepted_at), "PPP") : "N/A"}
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              {user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              {user.updated_at ? format(new Date(user.updated_at), "PPP") : "N/A"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
