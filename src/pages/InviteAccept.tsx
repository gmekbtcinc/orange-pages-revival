import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  token: string;
  role: string;
  status: string;
  expires_at: string | null;
  business_id: string;
  businesses: {
    name: string;
  } | null;
  inviter: {
    display_name: string;
  } | null;
}

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchInvitation = async () => {
      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      setCurrentUserEmail(session?.user?.email || null);

      if (!token) {
        setError("No invitation token provided");
        setLoading(false);
        return;
      }

      // Fetch invitation from the invitations table
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select(`
          id,
          email,
          token,
          role,
          status,
          expires_at,
          business_id,
          display_name,
          businesses:business_id (name),
          inviter:profiles!invitations_invited_by_fkey (display_name)
        `)
        .eq("token", token)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching invitation:", fetchError);
        setError("Failed to load invitation");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Invitation not found or has been revoked");
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (data.status === "accepted") {
        setError("This invitation has already been accepted");
        setLoading(false);
        return;
      }

      // Check if revoked
      if (data.status === "revoked") {
        setError("This invitation has been revoked");
        setLoading(false);
        return;
      }

      if (fetchError) {
        console.error("Error fetching invitation:", fetchError);
        setError("Failed to load invitation");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Invitation not found or has been revoked");
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        setLoading(false);
        return;
      }

      // Check if already accepted
      if ((data.status as string) === "accepted") {
        setError("This invitation has already been accepted");
        setLoading(false);
        return;
      }

      // Check if revoked
      if ((data.status as string) === "revoked") {
        setError("This invitation has been revoked");
        setLoading(false);
        return;
      }

      setInvitation(data as InvitationData);
      setLoading(false);
    };

    checkAuthAndFetchInvitation();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setCurrentUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, [token]);

  const handleAccept = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Not authenticated",
          description: "Please sign in to accept this invitation.",
        });
        setAccepting(false);
        return;
      }

      // Call edge function to accept invitation (bypasses RLS)
      const response = await supabase.functions.invoke("accept-invitation", {
        body: { token: invitation.token },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to accept invitation");
      }

      const data = response.data as { success?: boolean; error?: string; businessName?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      // Send onboarding welcome email
      try {
        await supabase.functions.invoke("send-onboarding-email", {
          body: {
            email: invitation.email,
            displayName: invitation.email.split("@")[0],
            companyName: invitation.businesses?.name || "your company",
            role: invitation.role,
            origin: window.location.origin,
          },
        });
        console.log("Onboarding email sent");
      } catch (emailErr) {
        console.error("Failed to send onboarding email:", emailErr);
        // Don't fail the whole process if email fails
      }

      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${data.businessName || invitation.businesses?.name}. Let's get you started!`,
      });

      // Small delay to let toast show before navigating
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast({
        variant: "destructive",
        title: "Error accepting invitation",
        description: err.message || "Please try again.",
      });
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-bitcoin-orange" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-foreground">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const roleDisplayMap: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Team Member",
  };
  const roleDisplay = roleDisplayMap[invitation.role] || "Team Member";
  const emailMismatch = currentUserEmail && currentUserEmail.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-bitcoin-orange mx-auto mb-4" />
          <CardTitle className="text-foreground">Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on Bitcoin for Corporations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium text-foreground">{invitation.businesses?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-foreground">{roleDisplay}</span>
            </div>
            {invitation.inviter?.display_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invited by</span>
                <span className="font-medium text-foreground">{invitation.inviter.display_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your email</span>
              <span className="font-medium text-foreground">{invitation.email}</span>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Sign in to accept this invitation</span>
              </div>
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link to={`/login?returnTo=${encodeURIComponent(`/invite/accept?token=${token}`)}`}>
                    Sign In
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                New to BFC? Sign up with the email address shown above.
              </p>
            </div>
          ) : emailMismatch ? (
            <div className="space-y-4">
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">Email mismatch</p>
                <p>
                  You're signed in as <strong>{currentUserEmail}</strong>, but this invitation was sent to <strong>{invitation.email}</strong>.
                </p>
                <p className="mt-2">
                  Please sign out and sign in with the correct email address.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Signed in as {currentUserEmail}</span>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Accept Invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
