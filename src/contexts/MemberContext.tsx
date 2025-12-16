import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;
type Business = Tables<"businesses">;
type EventAllocation = Tables<"event_allocations">;

interface MemberWithBusiness extends Member {
  business: Business | null;
}

interface MemberContextType {
  user: User | null;
  session: Session | null;
  member: MemberWithBusiness | null;
  allocations: EventAllocation[];
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<MemberWithBusiness | null>(null);
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberData = async (userId: string) => {
    // Fetch member record
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (memberError) {
      console.error("Error fetching member:", memberError);
      setMember(null);
      setAllocations([]);
      return;
    }

    // Fetch associated business
    let business: Business | null = null;
    if (memberData.business_id) {
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", memberData.business_id)
        .single();

      business = businessData;
    }

    setMember({ ...memberData, business });

    // Fetch allocations for member's tier
    const { data: allocationData } = await supabase
      .from("event_allocations")
      .select("*")
      .eq("tier", memberData.tier);

    setAllocations(allocationData || []);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchMemberData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchMemberData(session.user.id);
        } else {
          setMember(null);
          setAllocations([]);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setAllocations([]);
  };

  const refreshMember = async () => {
    if (user) {
      await fetchMemberData(user.id);
    }
  };

  return (
    <MemberContext.Provider
      value={{
        user,
        session,
        member,
        allocations,
        isLoading,
        signOut,
        refreshMember,
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
