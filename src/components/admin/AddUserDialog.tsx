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
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

type TeamRole = Enums<"team_role">;

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
  const [role, setRole] = useState<TeamRole>("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addUserMutation = useMutation({
    mutationFn: async () => {
      if (!displayName.trim() || !email.trim() || !businessId) {
        throw new Error("Name, email, and company are required");
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if invitation already exists for this email and business
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id, status")
        .eq("email", normalizedEmail)
        .eq("business_id", businessId)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        throw new Error("A pending invitation already exists for this email");
      }

      // Check if user already has a team membership for this business
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        const { data: existingMembership } = await supabase
          .from("team_memberships")
          .select("id")
          .eq("profile_id", existingProfile.id)
          .eq("business_id", businessId)
          .maybeSingle();

        if (existingMembership) {
          throw new Error("This user is already a team member of this company");
        }
      }

      // Get company name for the email
      const selectedBusiness = businesses?.find(b => b.id === businessId);
      const companyName = selectedBusiness?.name || "the company";

      // Generate invite token and expiration
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const generatedInviteUrl = `${window.location.origin}/invite/accept?token=${inviteToken}`;
      setInviteUrl(generatedInviteUrl);

      // Create invitation record ONLY - no company_users record
      const { error: inviteError } = await supabase
        .from("invitations")
        .insert({
          business_id: businessId,
          email: normalizedEmail,
          display_name: displayName.trim(),
          role: role,
          status: "pending",
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      // Send invitation email
      let emailSent = false;
      try {
        console.log("Sending invitation email to:", normalizedEmail);
        const { data, error: emailError } = await supabase.functions.invoke("send-team-invitation", {
          body: {
            email: normalizedEmail,
            displayName: displayName.trim(),
            inviterName: "BFC Admin",
            companyName,
            role: role === "admin" ? "Admin" : role === "owner" ? "Owner" : "Member",
            inviteToken,
            origin: window.location.origin,
          },
        });

        if (emailError) {
          console.error("Edge function error:", emailError);
        } else if (data?.error) {
          console.error("Email sending failed:", data.error);
        } else {
          console.log("Email sent successfully:", data);
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }

      return { emailSent, inviteUrl: generatedInviteUrl };
    },
    onSuccess: ({ emailSent }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      
      if (emailSent) {
        toast.success("User invited and invitation email sent");
        handleClose();
      } else {
        toast.warning("User invited but email could not be sent. Share the invite link manually.");
      }
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
    setRole("member");
    setInviteUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Invite a new user to a member company. They'll receive an invitation email.
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

          {/* Show invite link if email failed */}
          {inviteUrl && !addUserMutation.isPending && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <Label className="text-sm font-medium">Share this invite link manually:</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {inviteUrl ? "Done" : "Cancel"}
          </Button>
          {!inviteUrl && (
            <Button
              onClick={() => addUserMutation.mutate()}
              disabled={!displayName || !email || !businessId || addUserMutation.isPending}
            >
              {addUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Send Invitation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
