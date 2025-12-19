import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== verify-password-reset function called ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "verify";

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === "verify") {
      // Just verify the token is valid
      const { token }: VerifyTokenRequest = await req.json();

      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate token format (64 hex characters for 32-byte token)
      if (!/^[a-f0-9]{64}$/i.test(token)) {
        console.log("Invalid token format received");
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid token format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: tokenData, error: tokenError } = await supabase
        .from("password_reset_tokens")
        .select("email, expires_at, used_at")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenData) {
        console.log("Token not found");
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid or expired reset link" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if token was already used
      if (tokenData.used_at) {
        console.log("Token already used");
        return new Response(
          JSON.stringify({ valid: false, error: "This reset link has already been used" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        console.log("Token expired");
        return new Response(
          JSON.stringify({ valid: false, error: "This reset link has expired" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Token is valid for:", tokenData.email);
      return new Response(
        JSON.stringify({ valid: true, email: tokenData.email }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "reset") {
      // Actually reset the password
      const { token, newPassword }: ResetPasswordRequest = await req.json();

      if (!token || !newPassword) {
        return new Response(
          JSON.stringify({ success: false, error: "Token and new password are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate token format (64 hex characters for 32-byte token)
      if (!/^[a-f0-9]{64}$/i.test(token)) {
        console.log("Invalid token format received for reset");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid token format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Fetch and validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from("password_reset_tokens")
        .select("id, email, expires_at, used_at")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid reset link" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (tokenData.used_at) {
        return new Response(
          JSON.stringify({ success: false, error: "This reset link has already been used" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "This reset link has expired" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find the user by email
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to process request" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const user = users.users.find(
        (u) => u.email?.toLowerCase() === tokenData.email.toLowerCase()
      );

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update password" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark token as used
      await supabase
        .from("password_reset_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      console.log("Password reset successful for:", tokenData.email);
      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
