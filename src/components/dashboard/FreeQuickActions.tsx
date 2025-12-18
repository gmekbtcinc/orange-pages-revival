import { useNavigate } from "react-router-dom";
import { Building2, Ticket, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/contexts/member/MemberContext";

export function FreeQuickActions() {
  const navigate = useNavigate();
  const { companyUser } = useMember();

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => navigate("/dashboard/company-profile")} className="gap-2">
        <Building2 className="h-4 w-4" />
        Edit Company Profile
      </Button>
      
      <Button variant="outline" asChild className="gap-2">
        <a href="https://b.tc/conference" target="_blank" rel="noopener noreferrer">
          <Ticket className="h-4 w-4" />
          Buy Conference Tickets
        </a>
      </Button>
      
      {companyUser?.business_id && (
        <Button 
          variant="outline" 
          onClick={() => navigate(`/business/${companyUser.business_id}`)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View Public Listing
        </Button>
      )}
    </div>
  );
}
