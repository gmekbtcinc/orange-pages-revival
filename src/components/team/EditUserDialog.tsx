import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CompanyUser = Tables<"company_users">;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CompanyUser;
  currentUserId: string;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwnRecord = user.id === currentUserId;

  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active ?? true);
  const [permissions, setPermissions] = useState({
    can_claim_tickets: user.can_claim_tickets ?? false,
    can_register_events: user.can_register_events ?? false,
    can_apply_speaking: user.can_apply_speaking ?? false,
    can_edit_profile: user.can_edit_profile ?? false,
    can_manage_users: user.can_manage_users ?? false,
    can_rsvp_dinners: user.can_rsvp_dinners ?? false,
    can_request_resources: user.can_request_resources ?? false,
  });

  useEffect(() => {
    setRole(user.role);
    setIsActive(user.is_active ?? true);
    setPermissions({
      can_claim_tickets: user.can_claim_tickets ?? false,
      can_register_events: user.can_register_events ?? false,
      can_apply_speaking: user.can_apply_speaking ?? false,
      can_edit_profile: user.can_edit_profile ?? false,
      can_manage_users: user.can_manage_users ?? false,
      can_rsvp_dinners: user.can_rsvp_dinners ?? false,
      can_request_resources: user.can_request_resources ?? false,
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_users")
        .update({
          role: isOwnRecord ? user.role : role, // Can't change own role
          is_active: isActive,
          ...permissions,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "User updated",
        description: "Team member permissions have been updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error.message || "Please try again.",
      });
    },
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update permissions for {user.display_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-foreground">{user.display_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {!user.user_id && (
              <Badge variant="outline" className="text-xs">
                Pending
              </Badge>
            )}
          </div>

          {isOwnRecord && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-yellow-200">
                You cannot change your own role
              </p>
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as any)}
              disabled={isOwnRecord}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_admin">Admin</SelectItem>
                <SelectItem value="company_user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isOwnRecord}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "can_claim_tickets", label: "Claim Tickets" },
                { key: "can_register_events", label: "Register Events" },
                { key: "can_apply_speaking", label: "Apply Speaking" },
                { key: "can_edit_profile", label: "Edit Profile" },
                { key: "can_manage_users", label: "Manage Users" },
                { key: "can_rsvp_dinners", label: "RSVP Dinners" },
                { key: "can_request_resources", label: "Request Resources" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={permissions[key as keyof typeof permissions]}
                    onCheckedChange={() =>
                      togglePermission(key as keyof typeof permissions)
                    }
                  />
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
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
