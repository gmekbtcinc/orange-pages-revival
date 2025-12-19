import { ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Crown,
  FileCheck,
  Users,
  Calendar,
  Settings,
  Home,
  Bell,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AdminBreadcrumb, BreadcrumbItem } from "./AdminBreadcrumb";
import bfcLogo from "@/assets/bfc-profile-icon.png";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AdminLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

// All nav items with role requirements
const allNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["super_admin", "admin"], showBadge: false },
  { label: "Companies", href: "/admin/companies", icon: Building2, roles: ["super_admin", "admin", "moderator"], showBadge: false },
  { label: "Memberships", href: "/admin/memberships", icon: Crown, roles: ["super_admin", "admin"], showBadge: false },
  { label: "Claims", href: "/admin/claims", icon: FileCheck, roles: ["super_admin", "admin", "moderator"], showBadge: true },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["super_admin", "admin"], showBadge: false },
  { label: "Events", href: "/admin/events", icon: Calendar, roles: ["super_admin", "admin"], showBadge: false },
  // Hidden for now - revisit later:
  // { label: "Tiers & Tracks", href: "/admin/tiers", icon: Layers, roles: ["super_admin", "admin"] },
  // { label: "Benefits", href: "/admin/benefits", icon: Gift, roles: ["super_admin", "admin"] },
  // { label: "Packages", href: "/admin/packages", icon: Package, roles: ["super_admin", "admin"] },
  // { label: "Pricing", href: "/admin/pricing", icon: DollarSign, roles: ["super_admin", "admin"] },
];

export function AdminLayout({ children, breadcrumbs }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: admin } = useQuery({
    queryKey: ["current-admin-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check user_roles table for admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "moderator"])
        .maybeSingle();

      if (!roleData) return null;

      // Get avatar from company_users
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("avatar_url, display_name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      // Get display name from company_users, auth metadata, or email
      const displayName = companyUser?.display_name || 
        user.user_metadata?.full_name || 
        user.email?.split('@')[0] || 
        'Admin';

      return {
        display_name: displayName,
        email: user.email,
        avatar_url: companyUser?.avatar_url || null,
        role: roleData.role as AppRole,
      };
    },
  });

  // Fetch pending counts for badge
  const { data: pendingCounts } = useQuery({
    queryKey: ["admin-pending-counts"],
    queryFn: async () => {
      const [claimsRes, submissionsRes] = await Promise.all([
        supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("business_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        claims: claimsRes.count || 0,
        submissions: submissionsRes.count || 0,
        total: (claimsRes.count || 0) + (submissionsRes.count || 0),
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter nav items based on user's role
  const navItems = useMemo(() => {
    if (!admin?.role) return [];
    return allNavItems.filter(item => item.roles.includes(admin.role));
  }, [admin?.role]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initials = admin?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={bfcLogo}
                alt="BFC"
                className="h-10 w-10 rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-foreground">BFC Admin</h1>
                <p className="text-xs text-muted-foreground">
                  {admin?.role === "moderator" ? "Content Moderator" : "Management Console"}
                </p>
              </div>
            </div>
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/admin/claims")}
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {pendingCounts?.total && pendingCounts.total > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
                  {pendingCounts.total > 99 ? "99+" : pendingCounts.total}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* User Section - Moved below logo */}
        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-foreground hover:bg-muted">
                <Avatar className="h-8 w-8">
                  {admin?.avatar_url && (
                    <AvatarImage src={admin.avatar_url} alt={admin?.display_name || "Admin"} />
                  )}
                  <AvatarFallback className="bg-bitcoin-orange text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left truncate">
                  <p className="text-sm font-medium text-foreground truncate">
                    {admin?.display_name || "Admin"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Orange Pages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Member Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/account")}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            const badgeCount = item.showBadge ? pendingCounts?.total : 0;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 text-foreground hover:text-foreground hover:bg-muted",
                  isActive && "bg-primary/10 text-primary hover:text-primary"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {badgeCount && badgeCount > 0 ? (
                  <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                    {badgeCount}
                  </Badge>
                ) : null}
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <AdminBreadcrumb items={breadcrumbs} />
        )}
        <main className="flex-1 p-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="px-8 py-4 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bitcoin for Corporations. Admin Portal.
          </div>
        </footer>
      </div>
    </div>
  );
}