import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Calendar, Mic, Edit, Users, Utensils, BookOpen } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditUserPermissionsDialogProps {
  user: {
    id: string;
    display_name: string;
    role: string;
    can_claim_tickets: boolean | null;
    can_register_events: boolean | null;
    can_apply_speaking: boolean | null;
    can_edit_profile: boolean | null;
    can_manage_users: boolean | null;
    can_rsvp_dinners: boolean | null;
    can_request_resources: boolean | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_FIELDS = [
  { key: "can_claim_tickets", label: "Claim conference tickets", icon: Ticket, description: "Allow user to claim conference tickets for their company" },
  { key: "can_register_events", label: "Register for symposiums", icon: Calendar, description: "Allow user to register for symposium events" },
  { key: "can_apply_speaking", label: "Submit speaker applications", icon: Mic, description: "Allow user to submit speaking applications" },
  { key: "can_edit_profile", label: "Edit company profile", icon: Edit, description: "Allow user to edit the company profile" },
  { key: "can_manage_users", label: "Manage team members", icon: Users, description: "Allow user to invite and manage team members" },
  { key: "can_rsvp_dinners", label: "RSVP for VIP dinners", icon: Utensils, description: "Allow user to RSVP for VIP dinner events" },
  { key: "can_request_resources", label: "Request member resources", icon: BookOpen, description: "Allow user to request member resources" },
] as const;

type PermissionKey = typeof PERMISSION_FIELDS[number]["key"];

export function EditUserPermissionsDialog({ user, open, onOpenChange }: EditUserPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string>("company_user");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    can_claim_tickets: false,
    can_register_events: false,
    can_apply_speaking: false,
    can_edit_profile: false,
    can_manage_users: false,
    can_rsvp_dinners: false,
    can_request_resources: false,
  });

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPermissions({
        can_claim_tickets: user.can_claim_tickets ?? false,
        can_register_events: user.can_register_events ?? false,
        can_apply_speaking: user.can_apply_speaking ?? false,
        can_edit_profile: user.can_edit_profile ?? false,
        can_manage_users: user.can_manage_users ?? false,
        can_rsvp_dinners: user.can_rsvp_dinners ?? false,
        can_request_resources: user.can_request_resources ?? false,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");
      
      const { error } = await supabase
        .from("company_users")
        .update({
          role: role as "company_admin" | "company_user",
          ...permissions,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User permissions updated");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update permissions: " + error.message);
    },
  });

  const applyPreset = (preset: "full" | "view" | "standard") => {
    switch (preset) {
      case "full":
        setPermissions({
          can_claim_tickets: true,
          can_register_events: true,
          can_apply_speaking: true,
          can_edit_profile: true,
          can_manage_users: true,
          can_rsvp_dinners: true,
          can_request_resources: true,
        });
        break;
      case "view":
        setPermissions({
          can_claim_tickets: false,
          can_register_events: false,
          can_apply_speaking: false,
          can_edit_profile: false,
          can_manage_users: false,
          can_rsvp_dinners: false,
          can_request_resources: false,
        });
        break;
      case "standard":
        setPermissions({
          can_claim_tickets: true,
          can_register_events: true,
          can_apply_speaking: false,
          can_edit_profile: false,
          can_manage_users: false,
          can_rsvp_dinners: false,
          can_request_resources: false,
        });
        break;
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Permissions: {user.display_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Selector */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_admin">Company Admin</SelectItem>
                <SelectItem value="company_user">Company User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPreset("full")}>
                Full Access
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("standard")}>
                Standard User
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("view")}>
                View Only
              </Button>
            </div>
          </div>

          {/* Permission Toggles */}
          <div className="space-y-4">
            <Label>Permissions</Label>
            {PERMISSION_FIELDS.map((perm) => (
              <div key={perm.key} className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <perm.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{perm.label}</p>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
                <Switch
                  checked={permissions[perm.key]}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => ({ ...prev, [perm.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
