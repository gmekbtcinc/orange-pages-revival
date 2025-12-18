import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  origin: string;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== send-password-reset function called ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, origin }: PasswordResetRequest = await req.json();

    if (!email || !origin) {
      return new Response(
        JSON.stringify({ error: "Email and origin are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset requested for:", email);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if user exists in auth.users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error checking user:", userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = users.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      console.log("User not found, returning success anyway for security");
      // Return success even if user doesn't exist (security best practice)
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing unused tokens for this email
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("email", email.toLowerCase())
      .is("used_at", null);

    // Store the token
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build reset URL
    const resetUrl = `${origin}/reset-password?token=${token}`;

    console.log("Sending password reset email via Resend...");

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bitcoin for Corporations <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: "Reset Your Password - Bitcoin for Corporations",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #f7931a; font-size: 24px; font-weight: bold; margin: 0;">Bitcoin for Corporations</h1>
                </div>

                <!-- Main Content -->
                <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">
                  Reset Your Password
                </h2>

                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  We received a request to reset your password. Click the button below to create a new password:
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </div>

                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #3f3f46; font-size: 14px; word-break: break-all; margin-bottom: 24px;">
                  ${resetUrl}
                </p>

                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} Bitcoin for Corporations. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await res.json();
    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
