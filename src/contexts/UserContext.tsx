import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { derivePermissions } from "@/lib/permissions";
import type {
  Profile,
  TeamMembershipWithBusiness,
  CompanyContext,
  EventAllocation,
  UserState,
  UserPermissions,
  TeamRole,
  MemberTier,
} from "@/types/user";
import { DEFAULT_PERMISSIONS, Membership } from "@/types/user";

interface UserContextType extends UserState {
  // Actions
  switchCompany: (businessId: string) => void;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Convenience accessors
  permissions: UserPermissions;
  businessId: string | null;
  businessName: string | null;
  teamRole: TeamRole | null;
  membership: Membership | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "bfc_active_company";

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<TeamMembershipWithBusiness[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<CompanyContext | null>(null);
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Fetch active company details
  const fetchActiveCompanyDetails = useCallback(async (businessId: string, teamMemberships: TeamMembershipWithBusiness[]) => {
    const teamMembership = teamMemberships.find(tm => tm.business_id === businessId);
    if (!teamMembership) {
      setActiveCompany(null);
      setAllocations([]);
      return;
    }

    try {
      // Fetch business details
      const { data: business } = await supabase
        .from("businesses")
        .select("id, name, logo_url, is_verified, is_bfc_member")
        .eq("id", businessId)
        .maybeSingle();

      // Fetch membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .maybeSingle();

      // Derive permissions
      const teamRole = teamMembership.role as TeamRole;
      const tier = membership?.tier as MemberTier | null;
      const isActiveMember = !!membership?.is_active;
      const permissions = derivePermissions(teamRole, tier, isActiveMember);

      setActiveCompany({
        business,
        membership,
        teamMembership,
        permissions,
      });

      // Fetch allocations based on tier
      if (membership?.tier) {
        const { data: allocationData } = await supabase
          .from("event_allocations")
          .select("*")
          .eq("tier", membership.tier);
        setAllocations(allocationData || []);
      } else {
        setAllocations([]);
      }
    } catch (error) {
      console.error("Error fetching active company details:", error);
      setActiveCompany(null);
      setAllocations([]);
    }
  }, []);

  // Main fetch function
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setCompanies([]);
        setActiveCompanyId(null);
        setActiveCompany(null);
        setAllocations([]);
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user is super admin
      const { data: adminCheck } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      setIsSuperAdmin(adminCheck || false);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch team memberships with business info
      const { data: memberships } = await supabase
        .from("team_memberships")
        .select(`
          *,
          businesses:business_id (id, name, logo_url)
        `)
        .eq("profile_id", user.id);

      const typedMemberships = (memberships || []) as TeamMembershipWithBusiness[];
      setCompanies(typedMemberships);

      // Determine active company
      let activeId = localStorage.getItem(STORAGE_KEY);
      
      // Validate stored company is still accessible
      if (activeId && !typedMemberships.find(m => m.business_id === activeId)) {
        activeId = null;
        localStorage.removeItem(STORAGE_KEY);
      }

      // Default to primary company or first company
      if (!activeId && typedMemberships.length > 0) {
        const primary = typedMemberships.find(m => m.is_primary);
        activeId = primary?.business_id || typedMemberships[0].business_id;
      }

      setActiveCompanyId(activeId);

      // Fetch active company details
      if (activeId) {
        await fetchActiveCompanyDetails(activeId, typedMemberships);
      } else {
        setActiveCompany(null);
        setAllocations([]);
      }
    } catch (error) {
      console.error("Error in fetchUser:", error);
      setProfile(null);
      setCompanies([]);
      setActiveCompanyId(null);
      setActiveCompany(null);
      setAllocations([]);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchActiveCompanyDetails]);

  // Switch active company
  const switchCompany = useCallback((businessId: string) => {
    if (!companies.find(c => c.business_id === businessId)) {
      console.error("Cannot switch to company user is not a member of");
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, businessId);
    setActiveCompanyId(businessId);
    fetchActiveCompanyDetails(businessId, companies);
  }, [companies, fetchActiveCompanyDetails]);

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setCompanies([]);
    setActiveCompanyId(null);
    setActiveCompany(null);
    setAllocations([]);
    setIsSuperAdmin(false);
  };

  // Initial fetch and auth state listener
  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(() => fetchUser(), 0);
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem(STORAGE_KEY);
        setProfile(null);
        setCompanies([]);
        setActiveCompanyId(null);
        setActiveCompany(null);
        setAllocations([]);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Realtime subscriptions for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to profile changes
    const profileChannel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          console.log("Profile updated:", payload);
          if (payload.eventType === "UPDATE") {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    // Subscribe to team membership changes
    const membershipChannel = supabase
      .channel("membership-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_memberships",
          filter: `profile_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log("Team membership changed:", payload);
          // Refetch to get updated data with joins
          fetchUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(membershipChannel);
    };
  }, [profile?.id, fetchUser]);

  // Convenience accessors
  const permissions = activeCompany?.permissions || DEFAULT_PERMISSIONS;
  const businessId = activeCompanyId;
  const businessName = activeCompany?.business?.name || null;
  const membership = activeCompany?.membership || null;
  const teamRole = activeCompany?.teamMembership?.role as TeamRole | null;

  return (
    <UserContext.Provider
      value={{
        // State
        profile,
        isSuperAdmin,
        companies,
        activeCompanyId,
        activeCompany,
        allocations,
        isLoading,
        
        // Actions
        switchCompany,
        refetch: fetchUser,
        signOut,
        
        // Convenience
        permissions,
        businessId,
        businessName,
        teamRole,
        membership,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
