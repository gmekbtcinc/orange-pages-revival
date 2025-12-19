import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Ticket, Eye, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/contexts/member/MemberContext";
import { SubmitBusinessDialog } from "@/components/submissions/SubmitBusinessDialog";

export function FreeQuickActions() {
  const navigate = useNavigate();
  const { activeCompanyId } = useMember();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/dashboard/company-profile")} className="gap-2">
          <Building2 className="h-4 w-4" />
          Edit Company Profile
        </Button>
        
        <Button variant="outline" onClick={() => setSubmitDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Submit New Business
        </Button>
        
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <Search className="h-4 w-4" />
          Browse & Claim
        </Button>
        
        <Button variant="outline" asChild className="gap-2">
          <a href="https://b.tc/conference" target="_blank" rel="noopener noreferrer">
            <Ticket className="h-4 w-4" />
            Buy Conference Tickets
          </a>
        </Button>
        
        {activeCompanyId && (
          <Button 
            variant="outline" 
            onClick={() => navigate(`/business/${activeCompanyId}`)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Public Listing
          </Button>
        )}
      </div>
      
      <SubmitBusinessDialog 
        isOpen={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)} 
      />
    </>
  );
}
