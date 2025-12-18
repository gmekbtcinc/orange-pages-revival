import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface BulkEditUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  onComplete: () => void;
}

type PermissionField = 
  | "can_claim_tickets"
  | "can_register_events"
  | "can_apply_speaking"
  | "can_edit_profile"
  | "can_manage_users"
  | "can_rsvp_dinners"
  | "can_request_resources";

const PERMISSIONS: { key: PermissionField; label: string }[] = [
  { key: "can_claim_tickets", label: "Claim Tickets" },
  { key: "can_register_events", label: "Register Events" },
  { key: "can_apply_speaking", label: "Apply Speaking" },
  { key: "can_edit_profile", label: "Edit Profile" },
  { key: "can_manage_users", label: "Manage Users" },
  { key: "can_rsvp_dinners", label: "RSVP Dinners" },
  { key: "can_request_resources", label: "Request Resources" },
];

export function BulkEditUsersDialog({ 
  open, 
  onOpenChange, 
  selectedUserIds,
  onComplete 
}: BulkEditUsersDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"no_change" | "active" | "inactive">("no_change");
  const [role, setRole] = useState<"no_change" | "company_admin" | "company_user">("no_change");
  const [permissions, setPermissions] = useState<Record<PermissionField, "no_change" | "enable" | "disable">>({
    can_claim_tickets: "no_change",
    can_register_events: "no_change",
    can_apply_speaking: "no_change",
    can_edit_profile: "no_change",
    can_manage_users: "no_change",
    can_rsvp_dinners: "no_change",
    can_request_resources: "no_change",
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, boolean | string> = {};
      
      if (status !== "no_change") {
        updates.is_active = status === "active";
      }
      
      if (role !== "no_change") {
        updates.role = role;
      }
      
      Object.entries(permissions).forEach(([key, value]) => {
        if (value !== "no_change") {
          updates[key] = value === "enable";
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No changes selected");
      }

      const { error } = await supabase
        .from("company_users")
        .update(updates)
        .in("id", selectedUserIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success(`Updated ${selectedUserIds.length} users`);
      onComplete();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setStatus("no_change");
    setRole("no_change");
    setPermissions({
      can_claim_tickets: "no_change",
      can_register_events: "no_change",
      can_apply_speaking: "no_change",
      can_edit_profile: "no_change",
      can_manage_users: "no_change",
      can_rsvp_dinners: "no_change",
      can_request_resources: "no_change",
    });
  };

  const hasChanges = 
    status !== "no_change" || 
    role !== "no_change" || 
    Object.values(permissions).some(v => v !== "no_change");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Edit {selectedUserIds.length} Users
          </DialogTitle>
          <DialogDescription>
            Changes will apply to all selected users. Leave fields as "No Change" to keep existing values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No Change</SelectItem>
                <SelectItem value="active">Set Active</SelectItem>
                <SelectItem value="inactive">Set Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No Change</SelectItem>
                <SelectItem value="company_admin">Company Admin</SelectItem>
                <SelectItem value="company_user">Company User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-2 border rounded-lg p-3">
              {PERMISSIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Select 
                    value={permissions[key]} 
                    onValueChange={(v) => setPermissions(prev => ({ ...prev, [key]: v }))}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_change">No Change</SelectItem>
                      <SelectItem value="enable">Enable</SelectItem>
                      <SelectItem value="disable">Disable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => bulkUpdateMutation.mutate()}
            disabled={!hasChanges || bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending ? "Updating..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
