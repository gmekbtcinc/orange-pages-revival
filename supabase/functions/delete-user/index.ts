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

interface DeleteUserRequest {
  // For team_memberships based deletion (new system)
  teamMembershipId?: string;
  profileId?: string;
  // For legacy company_users based deletion
  companyUserId?: string;
  deleteAuthUser?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== delete-user function called ===");
  
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the caller is a super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if caller is super_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - super_admin required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { teamMembershipId, profileId, companyUserId, deleteAuthUser = true }: DeleteUserRequest = await req.json();

    // Handle new system: team_memberships + profiles
    if (teamMembershipId || profileId) {
      console.log("Deleting user via team_memberships system:", { teamMembershipId, profileId });

      let userProfileId = profileId;

      // If we have teamMembershipId, get the profile_id from it
      if (teamMembershipId && !profileId) {
        const { data: membership, error: fetchError } = await supabase
          .from("team_memberships")
          .select("profile_id")
          .eq("id", teamMembershipId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching team_membership:", fetchError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch team membership" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!membership) {
          return new Response(
            JSON.stringify({ error: "Team membership not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        userProfileId = membership.profile_id;
      }

      if (!userProfileId) {
        return new Response(
          JSON.stringify({ error: "Could not determine profile_id" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Delete all team_memberships for this user
      const { error: deleteMembershipsError } = await supabase
        .from("team_memberships")
        .delete()
        .eq("profile_id", userProfileId);

      if (deleteMembershipsError) {
        console.error("Error deleting team_memberships:", deleteMembershipsError);
        return new Response(
          JSON.stringify({ error: "Failed to delete team memberships" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Deleted team_memberships for profile:", userProfileId);

      // Delete from profiles table
      const { error: deleteProfileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userProfileId);

      if (deleteProfileError) {
        console.error("Error deleting profile:", deleteProfileError);
        // Don't fail if profile delete fails
      } else {
        console.log("Deleted from profiles:", userProfileId);
      }

      // Delete from auth.users (profile_id === auth user id)
      if (deleteAuthUser) {
        console.log("Deleting from auth.users:", userProfileId);
        
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userProfileId);

        if (deleteAuthError) {
          console.error("Error deleting from auth.users:", deleteAuthError);
          return new Response(
            JSON.stringify({ 
              success: true, 
              warning: "Deleted memberships and profile but failed to delete auth user",
              authError: deleteAuthError.message 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("Deleted from auth.users");
      }

      return new Response(
        JSON.stringify({ success: true, message: "User deleted completely" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle legacy system: company_users
    if (companyUserId) {
      console.log("Deleting company_user (legacy):", companyUserId);

      const { data: companyUser, error: fetchError } = await supabase
        .from("company_users")
        .select("user_id, email")
        .eq("id", companyUserId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching company_user:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!companyUser) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: deleteCompanyUserError } = await supabase
        .from("company_users")
        .delete()
        .eq("id", companyUserId);

      if (deleteCompanyUserError) {
        console.error("Error deleting from company_users:", deleteCompanyUserError);
        return new Response(
          JSON.stringify({ error: "Failed to delete company user" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Deleted from company_users");

      if (companyUser.user_id && deleteAuthUser) {
        console.log("Deleting from auth.users:", companyUser.user_id);
        
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
          companyUser.user_id
        );

        if (deleteAuthError) {
          console.error("Error deleting from auth.users:", deleteAuthError);
          return new Response(
            JSON.stringify({ 
              success: true, 
              warning: "Deleted from company_users but failed to delete auth user",
              authError: deleteAuthError.message 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("Deleted from auth.users");
      }

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Either teamMembershipId, profileId, or companyUserId is required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in delete-user:", error);
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
