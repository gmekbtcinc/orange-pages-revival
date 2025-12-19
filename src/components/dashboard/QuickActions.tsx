import { useMember } from "@/contexts/member/MemberContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Ticket, 
  Calendar, 
  Mic2, 
  Building2, 
  Users,
  UtensilsCrossed
} from "lucide-react";

export function QuickActions() {
  const { permissions, teamRole } = useMember();
  const navigate = useNavigate();

  const actions = [
    {
      label: "Claim Tickets",
      icon: Ticket,
      href: "#events",
      permission: permissions?.canClaimTickets,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Register for Symposium",
      icon: Calendar,
      href: "#events",
      permission: permissions?.canRegisterEvents,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Apply to Speak",
      icon: Mic2,
      href: "#events",
      permission: permissions?.canApplySpeaking,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "RSVP to VIP Dinner",
      icon: UtensilsCrossed,
      href: "#events",
      permission: permissions?.canRsvpDinners,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Edit Company Profile",
      icon: Building2,
      href: "/dashboard/company-profile",
      permission: permissions?.canEditProfile,
      onClick: () => navigate("/dashboard/company-profile"),
    },
    {
      label: "Manage Team",
      icon: Users,
      href: "/dashboard/team",
      permission: permissions?.canManageTeam || teamRole === "owner" || teamRole === "admin",
      onClick: () => navigate("/dashboard/team"),
    },
  ];

  const visibleActions = actions.filter((action) => action.permission);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleActions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="gap-2 border-border text-foreground hover:border-bitcoin-orange hover:bg-bitcoin-orange/10 hover:text-bitcoin-orange"
          onClick={action.onClick}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
