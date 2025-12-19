import { ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, ChevronDown, Building2, Users, Shield, Home, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import bfcLogo from "@/assets/bfc-profile-icon.png";
import { DashboardBreadcrumb, BreadcrumbItem } from "./DashboardBreadcrumb";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const tierColors: Record<string, string> = {
  industry: "bg-slate-500",
  premier: "bg-blue-600",
  executive: "bg-purple-600",
  sponsor: "bg-green-600",
  chairman: "bg-bitcoin-orange",
  // Legacy tiers
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-slate-300",
};

const tierLabels: Record<string, string> = {
  industry: "Industry",
  premier: "Premier",
  executive: "Executive",
  sponsor: "Sponsor",
  chairman: "Chairman's Circle",
  // Legacy tiers for backward compatibility
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const { profile, membership, signOut, permissions, activeCompanyId, teamRole } = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "BF";

  const tier = membership?.tier || "industry";
  const canManageUsers = permissions?.canManageTeam || teamRole === "owner" || teamRole === "admin";

  const { data: isAdmin } = useQuery({
    queryKey: ["user-is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check user_roles table for super_admin or admin role
      const { data: role } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin"])
        .maybeSingle();

      return !!role;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Company */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={bfcLogo}
                  alt="BFC"
                  className="h-10 w-10 rounded-lg"
                />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground">
                    BFC Member Portal
                  </h1>
                  <div className="flex items-center gap-2">
                    {membership && (
                      <Badge
                        className={`${tierColors[tier]} text-white text-xs`}
                      >
                        {tierLabels[tier]}
                      </Badge>
                    )}
                    {!membership && (
                      <Badge variant="outline" className="text-xs">
                        Free Account
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Orange Pages Link */}
              <Link 
                to="/" 
                className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-bitcoin-orange transition-colors"
              >
                <Home className="h-4 w-4" />
                Orange Pages
              </Link>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-foreground hover:text-foreground hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    )}
                    <AvatarFallback className="bg-bitcoin-orange text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-foreground">
                    {profile?.display_name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="cursor-pointer sm:hidden"
                  onClick={() => navigate("/")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Orange Pages
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate("/dashboard")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate("/dashboard/account")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                {activeCompanyId && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/dashboard/company-profile")}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Company Profile
                  </DropdownMenuItem>
                )}
                {canManageUsers && activeCompanyId && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/dashboard/team")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Team
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/admin")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <DashboardBreadcrumb items={breadcrumbs} />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bitcoin for Corporations. All rights reserved.
        </div>
      </footer>
    </div>
  );
}