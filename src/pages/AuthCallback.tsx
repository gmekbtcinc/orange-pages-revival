import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
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
      }
    });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
