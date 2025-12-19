import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isLoading, profile, isAdmin } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
