import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChangeCompanyDialogProps {
  user: {
    id: string;
    display_name: string;
    email: string;
    user_id: string | null;
    business_id: string | null;
    title: string | null;
    businesses: { name: string } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeCompanyDialog({ user, open, onOpenChange }: ChangeCompanyDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [role, setRole] = useState<"company_admin" | "company_user">("company_user");
  const [grantMemberPermissions, setGrantMemberPermissions] = useState(true);

  // Fetch businesses for selection
  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ["admin-businesses-search", search],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select("id, name, is_bfc_member")
        .eq("status", "approved")
        .order("name")
        .limit(50);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Check if target business has membership
  const { data: targetMembership } = useQuery({
    queryKey: ["target-membership", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("id, tier, is_active")
        .eq("business_id", selectedBusinessId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const changeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.user_id) {
        throw new Error("User must have a linked auth account to change company");
      }

      if (!selectedBusinessId) {
        throw new Error("Please select a company");
      }

      // Use the admin_link_user_to_business RPC
      const { data, error } = await supabase.rpc("admin_link_user_to_business", {
        _user_id: user.user_id,
        _business_id: selectedBusinessId,
        _email: user.email,
        _display_name: user.display_name,
        _title: user.title || null,
        _role: role,
        _is_member: grantMemberPermissions && !!targetMembership,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("User company changed successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to change company: " + error.message);
    },
  });

  const handleClose = () => {
    setSearch("");
    setSelectedBusinessId(null);
    setRole("company_user");
    setGrantMemberPermissions(true);
    onOpenChange(false);
  };

  const selectedBusiness = businesses?.find((b) => b.id === selectedBusinessId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Change Company
          </DialogTitle>
          <DialogDescription>
            Reassign {user?.display_name} to a different company. This will update their
            permissions based on the target company's membership status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Company */}
          {user?.business_id && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">Current Company</Label>
              <p className="font-medium">{user.businesses?.name || "Unknown"}</p>
            </div>
          )}

          {/* User must have linked account */}
          {!user?.user_id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This user doesn't have a linked auth account. Use "Link Account" first before changing company.
              </AlertDescription>
            </Alert>
          )}

          {/* Search Companies */}
          <div className="space-y-2">
            <Label>Select New Company</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md">
              {loadingBusinesses ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              ) : businesses?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No companies found</div>
              ) : (
                businesses?.map((business) => (
                  <div
                    key={business.id}
                    className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                      selectedBusinessId === business.id ? "bg-primary/10" : ""
                    }`}
                    onClick={() => setSelectedBusinessId(business.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{business.name}</span>
                      {business.is_bfc_member && (
                        <Badge variant="secondary" className="text-xs">Member</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Company Info */}
          {selectedBusiness && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="text-xs text-primary">Moving to</Label>
              <p className="font-medium">{selectedBusiness.name}</p>
              {targetMembership && (
                <Badge className="mt-1 capitalize">{targetMembership.tier}</Badge>
              )}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role in New Company</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "company_admin" | "company_user")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_admin">Company Admin</SelectItem>
                <SelectItem value="company_user">Company User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Permissions Toggle */}
          {targetMembership && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Grant Member Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Enable ticket claims, event registration, etc.
                </p>
              </div>
              <Switch
                checked={grantMemberPermissions}
                onCheckedChange={setGrantMemberPermissions}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => changeMutation.mutate()}
            disabled={!selectedBusinessId || !user?.user_id || changeMutation.isPending}
          >
            {changeMutation.isPending ? "Changing..." : "Change Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
