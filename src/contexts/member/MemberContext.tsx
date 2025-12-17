import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type EventAllocation = Tables<"event_allocations">;
type CompanyUser = Tables<"company_users">;
type Membership = Tables<"memberships">;

interface MemberContextType {
  /** Primary source of truth for user identity */
  companyUser: CompanyUser | null;
  /** Convenience property: companyUser?.id for activity table operations */
  companyUserId: string | null;
  /** Company's membership tier and billing info */
  membership: Membership | null;
  allocations: EventAllocation[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Derived convenience property
  const companyUserId = companyUser?.id || null;

  const fetchMember = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCompanyUser(null);
        setMembership(null);
        setAllocations([]);
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user is super admin
      const { data: adminCheck } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      setIsSuperAdmin(adminCheck || false);

      // Fetch company_user record (PRIMARY source of truth)
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      setCompanyUser(companyUserData || null);

      // Fetch membership based on companyUser's business_id
      if (companyUserData?.business_id) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("*")
          .eq("business_id", companyUserData.business_id)
          .eq("is_active", true)
          .maybeSingle();

        setMembership(membershipData || null);

        // Fetch allocations based on membership tier
        if (membershipData?.tier) {
          const { data: allocationData } = await supabase
            .from("event_allocations")
            .select("*")
            .eq("tier", membershipData.tier);
          
          setAllocations(allocationData || []);
        }
      }
    } catch (error) {
      console.error("Error in fetchMember:", error);
      setCompanyUser(null);
      setMembership(null);
      setAllocations([]);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCompanyUser(null);
    setMembership(null);
    setAllocations([]);
    setIsSuperAdmin(false);
  };

  useEffect(() => {
    fetchMember();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(() => fetchMember(), 0);
      } else if (event === "SIGNED_OUT") {
        setCompanyUser(null);
        setMembership(null);
        setAllocations([]);
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MemberContext.Provider value={{ 
      companyUser, 
      companyUserId,
      membership, 
      allocations, 
      isLoading, 
      isSuperAdmin, 
      refetch: fetchMember, 
      signOut 
    }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error("useMember must be used within a MemberProvider");
  }
  return context;
}
