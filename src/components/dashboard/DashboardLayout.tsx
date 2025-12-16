import { ReactNode } from "react";
import { useMember } from "@/contexts/member/MemberContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, ChevronDown, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const tierColors: Record<string, string> = {
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-slate-300",
  chairman: "bg-bitcoin-orange",
  executive: "bg-purple-600",
};

const tierLabels: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  chairman: "Chairman's Circle",
  executive: "Executive",
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { member, signOut } = useMember();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = member?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "BF";

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Company */}
            <div className="flex items-center gap-4">
              <img
                src="/bfc-logo.svg"
                alt="BFC"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/120x40/1D1D1D/FA660E?text=BFC";
                }}
              />
              <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">
                  BFC Member Portal
                </h1>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${tierColors[member?.tier || "silver"]} text-white text-xs`}
                  >
                    {tierLabels[member?.tier || "silver"]}
                  </Badge>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-bitcoin-orange text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-foreground">
                    {member?.display_name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate("/dashboard")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                {member?.business_id && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate("/dashboard/company-profile")}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Company Profile
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
