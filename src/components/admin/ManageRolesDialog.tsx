import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ManageRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRole?: {
    id: string;
    user_id: string;
    role: AppRole;
    email?: string;
  } | null;
}

export function ManageRolesDialog({
  open,
  onOpenChange,
  existingRole,
}: ManageRolesDialogProps) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(existingRole?.user_id || "");
  const [role, setRole] = useState<AppRole>(existingRole?.role || "admin");
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<{ id: string; email: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const isEditing = !!existingRole;

  // Sync state when existingRole changes
  useEffect(() => {
    if (existingRole) {
      setUserId(existingRole.user_id);
      setRole(existingRole.role);
    } else {
      setUserId("");
      setRole("admin");
    }
  }, [existingRole]);


  // Search for user by email
  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    setSearching(true);
    try {
      // Search in company_users
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("user_id, email")
        .eq("email", searchEmail.trim())
        .not("user_id", "is", null)
        .maybeSingle();

      if (companyUser?.user_id) {
        setFoundUser({ id: companyUser.user_id, email: companyUser.email });
        setUserId(companyUser.user_id);
        toast.success("User found!");
        return;
      }

      toast.error("No user found with that email. User must have logged in at least once.");
    } catch (error) {
      toast.error("Error searching for user");
    } finally {
      setSearching(false);
    }
  };

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID is required");

      // Check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .maybeSingle();

      if (existing && !isEditing) {
        throw new Error("User already has this role");
      }

      if (isEditing && existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("id", existingRole.id);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(isEditing ? "Role updated successfully" : "Role assigned successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setUserId("");
    setSearchEmail("");
    setFoundUser(null);
    setRole("admin");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isEditing ? "Edit Role" : "Assign Admin Role"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the role for this user"
              : "Search for a user by email and assign them an admin role"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={searchUser}
                  disabled={searching}
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
              {foundUser && (
                <p className="text-sm text-green-600">
                  Found: {foundUser.email}
                </p>
              )}
            </div>
          )}

          {isEditing && existingRole?.email && (
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-muted-foreground">{existingRole.email}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Super Admin</span>
                    <span className="text-xs text-muted-foreground">Full access to all features</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">Manage content and users</span>
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex flex-col">
                    <span className="font-medium">Moderator</span>
                    <span className="text-xs text-muted-foreground">Review and moderate content</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => assignRoleMutation.mutate()}
            disabled={!userId || assignRoleMutation.isPending}
          >
            {assignRoleMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? "Update Role" : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
