import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  invitationId: string;
}

serve(async (req) => {
  console.log("=== accept-invitation function called ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No auth header");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Authenticated user:", user.id, user.email);

    const { invitationId }: AcceptInvitationRequest = await req.json();

    if (!invitationId) {
      return new Response(JSON.stringify({ error: "invitationId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("id", invitationId)
      .maybeSingle();

    if (inviteError) {
      console.error("Error fetching invitation:", inviteError);
      return new Response(JSON.stringify({ error: "Failed to fetch invitation" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Invitation found:", invitation.id, invitation.email, invitation.status);

    // Verify the invitation email matches the user's email
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      console.error("Email mismatch:", invitation.email, "vs", user.email);
      return new Response(JSON.stringify({ error: "Email mismatch - sign in with the correct email" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return new Response(JSON.stringify({ error: "Invitation already accepted" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const now = new Date().toISOString();

    // Step 1: Delete any existing company_users record for this user with no business_id
    // (created by signup trigger)
    console.log("Deleting orphan company_users records for user:", user.id);
    const { error: deleteError } = await supabaseAdmin
      .from("company_users")
      .delete()
      .eq("user_id", user.id)
      .is("business_id", null);

    if (deleteError) {
      console.log("Delete orphan error (may be fine):", deleteError);
    }

    // Step 2: Update the invitation-created company_users record to link the user_id
    console.log("Updating company_users record for email:", invitation.email, "business:", invitation.business_id);
    const { data: updatedCompanyUser, error: updateError } = await supabaseAdmin
      .from("company_users")
      .update({
        user_id: user.id,
        accepted_at: now,
      })
      .eq("business_id", invitation.business_id)
      .eq("email", invitation.email.toLowerCase())
      .is("user_id", null)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Error updating company_users:", updateError);
      return new Response(JSON.stringify({ error: "Failed to link user to company" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!updatedCompanyUser) {
      console.error("No company_users record found to update");
      // Try to see what exists
      const { data: existingRecords } = await supabaseAdmin
        .from("company_users")
        .select("id, email, user_id, business_id")
        .eq("business_id", invitation.business_id)
        .ilike("email", invitation.email);
      console.log("Existing records:", existingRecords);
      
      return new Response(JSON.stringify({ error: "Company user record not found - invitation may be corrupted" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Company user updated:", updatedCompanyUser.id);

    // Step 3: Update invitation status
    const { error: statusError } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: now,
      })
      .eq("id", invitationId);

    if (statusError) {
      console.error("Error updating invitation status:", statusError);
      // Don't fail - the important part (linking) is done
    }

    console.log("Invitation accepted successfully");

    // Fetch business name for response
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("name")
      .eq("id", invitation.business_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation accepted successfully",
        businessName: business?.name || "the company",
        companyUserId: updatedCompanyUser.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in accept-invitation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
