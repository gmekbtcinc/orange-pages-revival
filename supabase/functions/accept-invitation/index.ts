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

interface AcceptInvitationRequest {
  invitationId?: string;
  token?: string;
}

serve(async (req) => {
  console.log("=== accept-invitation function called ===");
  
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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

    // Fetch the invitation from the consolidated invitations table
    let query = supabaseAdmin.from("invitations").select("*");
    
    if (invitationId) {
      query = query.eq("id", invitationId);
    } else if (token) {
      query = query.eq("token", token);
    }

    const { data: invitation, error: inviteError } = await query.maybeSingle();

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

    // Ensure user has a profile record
    console.log("Ensuring profile exists for user:", user.id);
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile for the user
      console.log("Creating profile for user:", user.id);
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
          display_name: invitation.display_name || user.email!.split("@")[0],
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail - profile might already exist from trigger
      }
    } else if (invitation.display_name && existingProfile.display_name !== invitation.display_name) {
      // Update display name if invitation has one
      console.log("Updating profile display name");
      await supabaseAdmin
        .from("profiles")
        .update({ display_name: invitation.display_name })
        .eq("id", user.id);
    }

    // Check if user already has a team membership for this business
    const { data: existingMembership } = await supabaseAdmin
      .from("team_memberships")
      .select("id")
      .eq("profile_id", user.id)
      .eq("business_id", invitation.business_id)
      .maybeSingle();

    if (existingMembership) {
      console.log("User already has membership for this business");
      // Mark invitation as accepted
      await supabaseAdmin
        .from("invitations")
        .update({ status: "accepted", accepted_at: now, accepted_by: user.id })
        .eq("id", invitation.id);

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
    console.log("Creating team_membership for user:", user.id, "business:", invitation.business_id, "role:", invitation.role);
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

    // Update invitation status
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
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
