import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [state, setState] = useState<"loading" | "authenticated" | "unauthorized">("loading");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState("unauthorized");
        return;
      }

      // Check if user has super_admin or admin role in user_roles table
      const { data: role } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin"])
        .maybeSingle();

      setState(role ? "authenticated" : "unauthorized");
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (state === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
