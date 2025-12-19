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
import { UserCheck, Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Enums } from "@/integrations/supabase/types";

type TeamRole = Enums<"team_role">;

interface DirectAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string; // Optional - if not provided, show company selector
}

interface FoundProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  title: string | null;
}

export function DirectAssignDialog({ open, onOpenChange, businessId: preselectedBusinessId }: DirectAssignDialogProps) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState(preselectedBusinessId || "");
  const [role, setRole] = useState<TeamRole>("member");

  // Fetch businesses for selection (only if no preselected business)
  const { data: businesses } = useQuery({
    queryKey: ["businesses-for-direct-assign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open && !preselectedBusinessId,
  });

  const searchProfile = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    setSearchError(null);
    setFoundProfile(null);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, title")
      .eq("email", searchEmail.trim().toLowerCase())
      .maybeSingle();
    
    setSearching(false);
    
    if (error) {
      setSearchError("Error searching for user");
      return;
    }
    
    if (data) {
      setFoundProfile(data);
    } else {
      setSearchError(`No user found with email "${searchEmail}". They need to create an account first.`);
    }
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!foundProfile || !businessId) {
        throw new Error("User and company are required");
      }

      // Check if user already has a team membership for this business
      const { data: existingMembership } = await supabase
        .from("team_memberships")
        .select("id")
        .eq("profile_id", foundProfile.id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (existingMembership) {
        throw new Error("This user is already a member of this company");
      }

      // Check if this is the user's first team membership (to set is_primary)
      const { count } = await supabase
        .from("team_memberships")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", foundProfile.id);

      const isPrimary = (count || 0) === 0;

      // Create team membership directly
      const { error } = await supabase
        .from("team_memberships")
        .insert({
          profile_id: foundProfile.id,
          business_id: businessId,
          role: role,
          is_primary: isPrimary,
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-company-team", businessId] });
      queryClient.invalidateQueries({ queryKey: ["company-team-memberships"] });
      toast.success(`${foundProfile?.display_name} has been assigned to the company`);
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setSearchEmail("");
    setFoundProfile(null);
    setSearchError(null);
    if (!preselectedBusinessId) {
      setBusinessId("");
    }
    setRole("member");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Direct Role Assignment
          </DialogTitle>
          <DialogDescription>
            Assign an existing user to a company without sending an invitation. The user must already have an account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search for user */}
          <div className="space-y-2">
            <Label htmlFor="search-email">Find User by Email</Label>
            <div className="flex gap-2">
              <Input
                id="search-email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchProfile()}
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={searchProfile} 
                disabled={searching || !searchEmail.trim()}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search error */}
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {/* Found user */}
          {foundProfile && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <div className="flex items-center gap-3 mt-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={foundProfile.avatar_url || undefined} />
                    <AvatarFallback>
                      {foundProfile.display_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{foundProfile.display_name}</p>
                    <p className="text-sm text-muted-foreground">{foundProfile.email}</p>
                    {foundProfile.title && (
                      <p className="text-xs text-muted-foreground">{foundProfile.title}</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Company selection (only if not preselected) */}
          {!preselectedBusinessId && (
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
          )}

          {/* Role selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">
                  <div className="flex flex-col">
                    <span className="font-medium">Owner</span>
                    <span className="text-xs text-muted-foreground">Full control over company</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">Can manage team and profile</span>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex flex-col">
                    <span className="font-medium">Member</span>
                    <span className="text-xs text-muted-foreground">Access to member benefits only</span>
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
            onClick={() => assignMutation.mutate()}
            disabled={!foundProfile || (!preselectedBusinessId && !businessId) || assignMutation.isPending}
          >
            {assignMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
