import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Timeout after 10 seconds if no auth event fires
    const timeout = setTimeout(() => {
      setError("Authentication timed out. Please try again.");
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(timeout);

      if (event === "SIGNED_IN" && session) {
        // Auto-link company_users record by email if exists and not yet linked
        const userEmail = session.user.email;
        const userId = session.user.id;
        
        if (userEmail) {
          const { data: unlinkedUser } = await supabase
            .from("company_users")
            .select("id")
            .eq("email", userEmail)
            .is("user_id", null)
            .maybeSingle();
          
          if (unlinkedUser) {
            await supabase
              .from("company_users")
              .update({ 
                user_id: userId, 
                accepted_at: new Date().toISOString() 
              })
              .eq("id", unlinkedUser.id);
          }
        }

        // Send welcome email for OAuth signups (fire and forget)
        // Check if this is a new user by seeing if created_at is recent (within last 60 seconds)
        const createdAt = new Date(session.user.created_at).getTime();
        const now = Date.now();
        const isNewUser = now - createdAt < 60000; // within 60 seconds
        
        if (isNewUser && userEmail) {
          const displayName = session.user.user_metadata?.full_name || userEmail.split("@")[0];
          supabase.functions.invoke("send-welcome-email", {
            body: { email: userEmail, displayName, origin: window.location.origin },
          }).catch((err) => console.error("Welcome email error:", err));
        }

        // Check for returnTo parameter
        const returnTo = searchParams.get("returnTo");
        
        // Check for pending business submission
        const pendingSubmission = sessionStorage.getItem("pendingBusinessSubmission");
        
        if (pendingSubmission) {
          // Redirect to dashboard with flag to open submit dialog
          navigate("/dashboard?openSubmit=true");
        } else if (returnTo) {
          navigate(returnTo);
        } else {
          navigate("/dashboard");
        }
      } else if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (event === "PASSWORD_RECOVERY") {
        // Redirect to account settings for password update
        navigate("/dashboard/account?resetPassword=true");
      } else if (event === "TOKEN_REFRESHED") {
        // Token refreshed successfully, no action needed
      } else if (event === "USER_UPDATED") {
        // User updated, redirect to dashboard
        navigate("/dashboard");
      }
    });

    // Check if there's already a session (e.g., page refresh)
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        clearTimeout(timeout);
        setError(sessionError.message);
        return;
      }
      
      // If already signed in, handle navigation
      if (session) {
        clearTimeout(timeout);
        const returnTo = searchParams.get("returnTo");
        const pendingSubmission = sessionStorage.getItem("pendingBusinessSubmission");
        
        if (pendingSubmission) {
          navigate("/dashboard?openSubmit=true");
        } else if (returnTo) {
          navigate(returnTo);
        } else {
          navigate("/dashboard");
        }
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
            <Button onClick={() => navigate("/login")}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
