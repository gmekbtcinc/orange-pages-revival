import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;
type EventAllocation = Tables<"event_allocations">;

interface MemberContextType {
  member: Member | null;
  allocations: EventAllocation[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMember = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMember(null);
        setAllocations([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching member:", error);
      }
      setMember(data || null);

      // Fetch allocations for the member's tier
      if (data?.tier) {
        const { data: allocationData } = await supabase
          .from("event_allocations")
          .select("*")
          .eq("tier", data.tier);
        
        setAllocations(allocationData || []);
      }
    } catch (error) {
      console.error("Error in fetchMember:", error);
      setMember(null);
      setAllocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setAllocations([]);
  };

  useEffect(() => {
    fetchMember();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(() => fetchMember(), 0);
      } else if (event === "SIGNED_OUT") {
        setMember(null);
        setAllocations([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MemberContext.Provider value={{ member, allocations, isLoading, refetch: fetchMember, signOut }}>
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
