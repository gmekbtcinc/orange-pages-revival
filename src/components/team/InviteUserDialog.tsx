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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  currentUserId: string; // This is now profile_id
  canInviteMore: boolean;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  businessId,
  currentUserId,
  canInviteMore,
}: InviteUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch inviter info and company name
  const { data: inviterData } = useQuery({
    queryKey: ["inviter-info", currentUserId, businessId],
    queryFn: async () => {
      // Get inviter profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", currentUserId)
        .single();
      
      // Get business name
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .single();
      
      return {
        inviterName: profile?.display_name || "A team member",
        companyName: business?.name || "your company",
      };
    },
    enabled: open,
  });

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Insert into NEW invitations table
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          display_name: displayName.trim() || null,
          role,
          invited_by: currentUserId,
          status: "pending",
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Store the invite URL for manual sharing if email fails
      const generatedInviteUrl = `${window.location.origin}/invite/accept?token=${invitation.token}`;
      setInviteUrl(generatedInviteUrl);

      // Send invitation email via edge function
      let emailSent = false;
      try {
        const { data, error: emailError } = await supabase.functions.invoke("send-team-invitation", {
          body: {
            email: email.toLowerCase().trim(),
            displayName: displayName.trim() || undefined,
            inviterName: inviterData?.inviterName || "A team member",
            companyName: inviterData?.companyName || "your company",
            role,
            inviteToken: invitation.token,
            origin: window.location.origin,
          },
        });

        if (emailError) {
          console.error("Edge function error:", emailError);
        } else if (data?.error) {
          console.error("Email sending failed:", data.error);
        } else {
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }

      return { emailSent, inviteUrl: generatedInviteUrl };
    },
    onSuccess: ({ emailSent, inviteUrl: url }) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      
      if (emailSent) {
        toast({
          title: "Invitation sent",
          description: `An invitation email has been sent to ${email}.`,
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
    setDisplayName("");
    setEmail("");
    setRole("member");
    setInviteUrl(null);
    setCopied(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate();
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
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              type="text"
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
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "admin" 
                ? "Admins can manage team members and edit company profile."
                : "Members can access member benefits but cannot manage the team."}
            </p>
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
