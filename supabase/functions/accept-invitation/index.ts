import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  invitationId?: string;
  token?: string;
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

    const authToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authToken);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Authenticated user:", user.id, user.email);

    const { invitationId, token }: AcceptInvitationRequest = await req.json();

    if (!invitationId && !token) {
      return new Response(JSON.stringify({ error: "invitationId or token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try user_invitations table first (admin-created invitations)
    let invitation = null;
    let inviteSource: "user_invitations" | "invitations" = "invitations";

    if (token) {
      const { data: userInvite } = await supabaseAdmin
        .from("user_invitations")
        .select("*")
        .eq("invite_token", token)
        .maybeSingle();

      if (userInvite) {
        invitation = {
          ...userInvite,
          token: userInvite.invite_token,
          invited_by: userInvite.invited_by,
        };
        inviteSource = "user_invitations";
        console.log("Found invitation in user_invitations table");
      }
    }

    // Fallback to invitations table
    if (!invitation) {
      let query = supabaseAdmin.from("invitations").select("*");
      
      if (invitationId) {
        query = query.eq("id", invitationId);
      } else if (token) {
        query = query.eq("token", token);
      }

      const { data: teamInvite, error: inviteError } = await query.maybeSingle();

      if (inviteError) {
        console.error("Error fetching invitation:", inviteError);
        return new Response(JSON.stringify({ error: "Failed to fetch invitation" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      invitation = teamInvite;
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

    // Check if revoked
    if (invitation.status === "revoked") {
      return new Response(JSON.stringify({ error: "Invitation has been revoked" }), {
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

    // Check if user already has a team membership for this business
    const { data: existingMembership } = await supabaseAdmin
      .from("team_memberships")
      .select("id")
      .eq("profile_id", user.id)
      .eq("business_id", invitation.business_id)
      .maybeSingle();

    if (existingMembership) {
      console.log("User already has membership for this business");
      // Just mark invitation as accepted in the correct table
      if (inviteSource === "user_invitations") {
        await supabaseAdmin
          .from("user_invitations")
          .update({ status: "accepted", accepted_at: now })
          .eq("id", invitation.id);
      } else {
        await supabaseAdmin
          .from("invitations")
          .update({ status: "accepted", accepted_at: now, accepted_by: user.id })
          .eq("id", invitation.id);
      }

      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("name")
        .eq("id", invitation.business_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          message: "You are already a member of this company",
          businessName: business?.name || "the company",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has any existing memberships to determine is_primary
    const { data: existingMemberships } = await supabaseAdmin
      .from("team_memberships")
      .select("id")
      .eq("profile_id", user.id);

    const isPrimary = !existingMemberships || existingMemberships.length === 0;

    // Create the team_membership record
    console.log("Creating team_membership for user:", user.id, "business:", invitation.business_id);
    const { data: newMembership, error: membershipError } = await supabaseAdmin
      .from("team_memberships")
      .insert({
        profile_id: user.id,
        business_id: invitation.business_id,
        role: invitation.role,
        is_primary: isPrimary,
        invited_by: invitation.invited_by,
      })
      .select()
      .single();

    if (membershipError) {
      console.error("Error creating team_membership:", membershipError);
      return new Response(JSON.stringify({ error: "Failed to create team membership" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Team membership created:", newMembership.id);

    // Update invitation status in the correct table
    if (inviteSource === "user_invitations") {
      const { error: statusError } = await supabaseAdmin
        .from("user_invitations")
        .update({
          status: "accepted",
          accepted_at: now,
        })
        .eq("id", invitation.id);

      if (statusError) {
        console.error("Error updating user_invitations status:", statusError);
      }
    } else {
      const { error: statusError } = await supabaseAdmin
        .from("invitations")
        .update({
          status: "accepted",
          accepted_at: now,
          accepted_by: user.id,
        })
        .eq("id", invitation.id);

      if (statusError) {
        console.error("Error updating invitation status:", statusError);
      }
    }

    // Fetch business name for response
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("name")
      .eq("id", invitation.business_id)
      .maybeSingle();

    // Fetch the inviter info to send notification
    let inviterInfo = null;
    if (invitation.invited_by) {
      const { data: inviter } = await supabaseAdmin
        .from("profiles")
        .select("email, display_name")
        .eq("id", invitation.invited_by)
        .maybeSingle();
      inviterInfo = inviter;
    }

    // Send acceptance notification to inviter
    if (inviterInfo?.email) {
      try {
        console.log("Sending acceptance notification to inviter:", inviterInfo.email);
        
        // Get the accepted user's profile
        const { data: acceptedProfile } = await supabaseAdmin
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        const notifyResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-acceptance-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inviterEmail: inviterInfo.email,
              inviterName: inviterInfo.display_name || "Team Admin",
              acceptedUserName: acceptedProfile?.display_name || user.email,
              acceptedUserEmail: user.email,
              companyName: business?.name || "your company",
            }),
          }
        );
        const notifyResult = await notifyResponse.json();
        console.log("Acceptance notification result:", notifyResult);
      } catch (notifyError) {
        console.error("Failed to send acceptance notification:", notifyError);
        // Don't fail the main operation
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation accepted successfully",
        businessName: business?.name || "the company",
        teamMembershipId: newMembership.id,
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
