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
  const { companyUser } = useMember();
  const navigate = useNavigate();

  const actions = [
    {
      label: "Claim Tickets",
      icon: Ticket,
      href: "#events",
      permission: companyUser?.can_claim_tickets,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Register for Symposium",
      icon: Calendar,
      href: "#events",
      permission: companyUser?.can_register_events,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Apply to Speak",
      icon: Mic2,
      href: "#events",
      permission: companyUser?.can_apply_speaking,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "RSVP to VIP Dinner",
      icon: UtensilsCrossed,
      href: "#events",
      permission: companyUser?.can_rsvp_dinners,
      onClick: () => {
        const element = document.getElementById("events-section");
        element?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      label: "Edit Company Profile",
      icon: Building2,
      href: "/dashboard/company-profile",
      permission: companyUser?.can_edit_profile,
      onClick: () => navigate("/dashboard/company-profile"),
    },
    {
      label: "Manage Team",
      icon: Users,
      href: "/dashboard/team",
      permission: companyUser?.can_manage_users || companyUser?.role === "company_admin",
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
