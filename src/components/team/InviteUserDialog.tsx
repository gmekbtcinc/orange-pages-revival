import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  currentUserId: string;
  canInviteMore: boolean;
}

const defaultPermissions = {
  company_admin: {
    can_claim_tickets: true,
    can_register_events: true,
    can_apply_speaking: true,
    can_edit_profile: true,
    can_manage_users: true,
    can_rsvp_dinners: true,
    can_request_resources: true,
  },
  company_user: {
    can_claim_tickets: true,
    can_register_events: true,
    can_apply_speaking: false,
    can_edit_profile: false,
    can_manage_users: false,
    can_rsvp_dinners: false,
    can_request_resources: false,
  },
};

export function InviteUserDialog({
  open,
  onOpenChange,
  businessId,
  currentUserId,
  canInviteMore,
}: InviteUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"company_admin" | "company_user">("company_user");
  const [permissions, setPermissions] = useState(defaultPermissions.company_user);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch inviter info and company name
  const { data: inviterData } = useQuery({
    queryKey: ["inviter-info", currentUserId, businessId],
    queryFn: async () => {
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("display_name, business_id, businesses:business_id (name)")
        .eq("id", currentUserId)
        .single();
      
      return companyUser;
    },
    enabled: open,
  });

  const handleRoleChange = (newRole: "company_admin" | "company_user") => {
    setRole(newRole);
    setPermissions(defaultPermissions[newRole]);
  };

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Generate invite token and expiration
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Store the invite URL for manual sharing if email fails
      const generatedInviteUrl = `${window.location.origin}/invite/accept?token=${inviteToken}`;
      setInviteUrl(generatedInviteUrl);

      // Insert into user_invitations
      const { error: inviteError } = await supabase
        .from("user_invitations")
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          role,
          invited_by: currentUserId,
          status: "pending",
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
          ...permissions,
        });

      if (inviteError) throw inviteError;

      // Also insert into company_users with user_id=null (pending)
      const { error: userError } = await supabase
        .from("company_users")
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          role,
          user_id: null,
          invited_by: currentUserId,
          invited_at: new Date().toISOString(),
          is_active: true,
          ...permissions,
        });

      if (userError) throw userError;

      // Send invitation email via edge function
      let emailSent = false;
      try {
        const inviterName = inviterData?.display_name || "A team member";
        const companyName = inviterData?.businesses?.name || "your company";

        console.log("Invoking send-team-invitation edge function...");
        const { data, error: emailError } = await supabase.functions.invoke("send-team-invitation", {
          body: {
            email: email.toLowerCase().trim(),
            displayName: displayName.trim(),
            inviterName,
            companyName,
            role,
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
    onSuccess: ({ emailSent, inviteUrl: url }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      
      if (emailSent) {
        toast({
          title: "Invitation sent",
          description: `${displayName} has been invited and will receive an email shortly.`,
        });
        onOpenChange(false);
        resetForm();
      } else {
        // Show warning toast with invite URL
        toast({
          variant: "default",
          title: "Invitation created",
          description: "Email could not be sent. Please share the invite link manually.",
        });
        setInviteUrl(url);
        // Don't close the dialog - let user copy the link
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating invitation",
        description: error.message || "Please try again.",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setDisplayName("");
    setRole("company_user");
    setPermissions(defaultPermissions.company_user);
    setInviteUrl(null);
    setCopied(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) return;
    inviteMutation.mutate();
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to your team. They'll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Name *</Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => handleRoleChange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_admin">Admin</SelectItem>
                <SelectItem value="company_user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "can_claim_tickets", label: "Claim Tickets" },
                { key: "can_register_events", label: "Register Events" },
                { key: "can_apply_speaking", label: "Apply Speaking" },
                { key: "can_edit_profile", label: "Edit Profile" },
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

          {/* Show invite link if email failed */}
          {inviteUrl && !inviteMutation.isPending && (
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              {inviteUrl ? "Done" : "Cancel"}
            </Button>
            {!inviteUrl && (
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !canInviteMore}
              >
                {inviteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Send Invitation
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
