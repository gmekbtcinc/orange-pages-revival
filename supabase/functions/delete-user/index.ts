import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  companyUserId: string;
  deleteAuthUser?: boolean; // If true, also delete from auth.users
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== delete-user function called ===");

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

    const { companyUserId, deleteAuthUser = true }: DeleteUserRequest = await req.json();

    if (!companyUserId) {
      return new Response(
        JSON.stringify({ error: "companyUserId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Deleting company_user:", companyUserId);

    // First, get the company_user to find the auth user_id
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

    // Delete from company_users first
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

    // If the user has an auth account and deleteAuthUser is true, delete from auth.users
    if (companyUser.user_id && deleteAuthUser) {
      console.log("Deleting from auth.users:", companyUser.user_id);
      
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        companyUser.user_id
      );

      if (deleteAuthError) {
        console.error("Error deleting from auth.users:", deleteAuthError);
        // Don't fail the whole operation, just log the error
        // The company_user is already deleted
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

  } catch (error: any) {
    console.error("Error in delete-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
