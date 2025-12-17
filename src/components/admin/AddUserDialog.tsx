import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { UserPlus, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [role, setRole] = useState<UserRole>("company_user");

  // Fetch businesses for selection
  const { data: businesses } = useQuery({
    queryKey: ["businesses-for-add-user"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const addUserMutation = useMutation({
    mutationFn: async () => {
      if (!displayName.trim() || !email.trim() || !businessId) {
        throw new Error("Name, email, and company are required");
      }

      // Check if user already exists for this business
      const { data: existing } = await supabase
        .from("company_users")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .eq("business_id", businessId)
        .maybeSingle();

      if (existing) {
        throw new Error("A user with this email already exists for this company");
      }

      // Create the company_user record
      const { error } = await supabase.from("company_users").insert({
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        title: title.trim() || null,
        business_id: businessId,
        role,
        is_active: true,
        can_claim_tickets: role === "company_admin",
        can_register_events: role === "company_admin",
        can_apply_speaking: role === "company_admin",
        can_edit_profile: role === "company_admin",
        can_manage_users: role === "company_admin",
        can_rsvp_dinners: role === "company_admin",
        can_request_resources: role === "company_admin",
        invited_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("User added successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setDisplayName("");
    setEmail("");
    setTitle("");
    setBusinessId("");
    setRole("company_user");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add User
          </DialogTitle>
          <DialogDescription>
            Add a new user to a member company
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="CEO, CFO, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {businesses?.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Company Admin</span>
                    <span className="text-xs text-muted-foreground">Full access to company features</span>
                  </div>
                </SelectItem>
                <SelectItem value="company_user">
                  <div className="flex flex-col">
                    <span className="font-medium">Company User</span>
                    <span className="text-xs text-muted-foreground">Limited access based on permissions</span>
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
            onClick={() => addUserMutation.mutate()}
            disabled={!displayName || !email || !businessId || addUserMutation.isPending}
          >
            {addUserMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
