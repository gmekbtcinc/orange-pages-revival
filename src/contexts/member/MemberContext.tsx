import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type CompanyUser = Tables<"company_users">;
type Membership = Tables<"memberships">;
type Admin = Tables<"admins">;
type EventAllocation = Tables<"event_allocations">;

interface MemberContextType {
  // New schema
  companyUser: CompanyUser | null;
  membership: Membership | null;
  admin: Admin | null;
  allocations: EventAllocation[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
  // Computed helpers
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isMember: boolean;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        resetState();
        setIsLoading(false);
        return;
      }

      // Fetch all user data in parallel
      const [companyUserResult, adminResult] = await Promise.all([
        supabase
          .from("company_users")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single(),
        supabase
          .from("admins")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single(),
      ]);

      // Handle company user
      if (companyUserResult.error && companyUserResult.error.code !== "PGRST116") {
        console.error("Error fetching company user:", companyUserResult.error);
      }
      const companyUserData = companyUserResult.data || null;
      setCompanyUser(companyUserData);

      // Handle admin
      if (adminResult.error && adminResult.error.code !== "PGRST116") {
        console.error("Error fetching admin:", adminResult.error);
      }
      setAdmin(adminResult.data || null);

      // If user has a company, fetch membership and allocations
      if (companyUserData?.business_id) {
        const { data: membershipData, error: membershipError } = await supabase
          .from("memberships")
          .select("*")
          .eq("business_id", companyUserData.business_id)
          .eq("is_active", true)
          .single();

        if (membershipError && membershipError.code !== "PGRST116") {
          console.error("Error fetching membership:", membershipError);
        }
        setMembership(membershipData || null);

        // Fetch allocations based on membership tier
        if (membershipData?.tier) {
          const { data: allocationData } = await supabase
            .from("event_allocations")
            .select("*")
            .eq("tier", membershipData.tier);

          setAllocations(allocationData || []);
        } else {
          setAllocations([]);
        }
      } else {
        setMembership(null);
        setAllocations([]);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setCompanyUser(null);
    setMembership(null);
    setAdmin(null);
    setAllocations([]);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetState();
  };

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(() => fetchUserData(), 0);
      } else if (event === "SIGNED_OUT") {
        resetState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Computed values
  const isSuperAdmin = !!admin && admin.is_active === true;
  const isCompanyAdmin = !!companyUser && companyUser.role === "company_admin";
  const isMember = !!membership && membership.is_active === true;

  return (
    <MemberContext.Provider
      value={{
        companyUser,
        membership,
        admin,
        allocations,
        isLoading,
        refetch: fetchUserData,
        signOut,
        isSuperAdmin,
        isCompanyAdmin,
        isMember,
      }}
    >
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
