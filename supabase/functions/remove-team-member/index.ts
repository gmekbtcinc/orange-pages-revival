import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://orangepages.bitcoinforcorporations.com',
  'https://bitcoinforcorporations.com',
  'http://localhost:5173',
  'http://localhost:8080',
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, ''))) ||
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app')
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

interface RemoveTeamMemberRequest {
  membershipId: string;
  businessId: string;
}

serve(async (req) => {
  console.log("=== remove-team-member function called ===");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json()) as RemoveTeamMemberRequest;
    const { membershipId, businessId } = body;

    if (!membershipId || !businessId) {
      return new Response(
        JSON.stringify({ error: "membershipId and businessId are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the caller is a team admin for this business
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
      "is_team_admin",
      {
        _profile_id: caller.id,
        _business_id: businessId,
      }
    );

    if (adminCheckError) {
      console.error("Error checking team admin:", adminCheckError);
      return new Response(JSON.stringify({ error: "Authorization check failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch membership to get profile info for invitation cleanup
    const { data: membership, error: fetchError } = await supabase
      .from("team_memberships")
      .select("id, profile_id, profiles(email)")
      .eq("id", membershipId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching team membership:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch team member" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: "Team member not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prevent removing yourself
    if (membership.profile_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot remove yourself from the team" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Delete the team membership
    const { error: deleteError } = await supabase
      .from("team_memberships")
      .delete()
      .eq("id", membershipId)
      .eq("business_id", businessId);

    if (deleteError) {
      console.error("Error deleting team membership:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to remove team member" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Best-effort: revoke any pending invitations for this email
    const email = ((membership.profiles as any)?.email || "").toLowerCase();
    if (email) {
      const { error: inviteCleanupError } = await supabase
        .from("invitations")
        .update({ status: "revoked" })
        .eq("business_id", businessId)
        .eq("email", email)
        .eq("status", "pending");

      if (inviteCleanupError) {
        console.warn("Invite cleanup failed:", inviteCleanupError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Team member removed",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in remove-team-member:", error);
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
