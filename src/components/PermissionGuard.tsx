import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import type { UserPermissions } from "@/types/user";

type PermissionKey = keyof Pick<
  UserPermissions,
  "canEditProfile" | "canManageTeam" | "canManageLeadership"
>;

interface PermissionGuardProps {
  children: ReactNode;
  /** The permission key to check */
  permission: PermissionKey;
  /** Where to redirect if permission denied (default: /dashboard) */
  redirectTo?: string;
  /** Optional: require an active company to be selected */
  requireCompany?: boolean;
}

/**
 * Guards routes based on user permissions.
 * Use inside ProtectedRoute to add permission-based access control.
 *
 * Example:
 * <ProtectedRoute>
 *   <PermissionGuard permission="canManageTeam">
 *     <TeamManagement />
 *   </PermissionGuard>
 * </ProtectedRoute>
 */
export function PermissionGuard({
  children,
  permission,
  redirectTo = "/dashboard",
  requireCompany = true,
}: PermissionGuardProps) {
  const { permissions, activeCompanyId, isLoading } = useUser();

  // Show loading while user context initializes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check if company is required and missing
  if (requireCompany && !activeCompanyId) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has the required permission
  const hasPermission = permissions?.[permission] ?? false;

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
