import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  displayName: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteToken: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== send-team-invitation function invoked ===");
  console.log("Request method:", req.method);
  console.log("RESEND_API_KEY configured:", !!RESEND_API_KEY);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body, null, 2));

    const { email, displayName, inviterName, companyName, role, inviteToken, origin }: InvitationEmailRequest = body;

    if (!email || !inviteToken) {
      console.error("Missing required fields: email or inviteToken");
      throw new Error("Missing required fields: email and inviteToken are required");
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured. Please contact support.");
    }

    console.log("Sending invitation email to:", email);
    console.log("Company:", companyName);
    console.log("Inviter:", inviterName);
    console.log("Origin:", origin);

    const acceptUrl = `${origin}/invite/accept?token=${inviteToken}`;
    const roleDisplay = role === "company_admin" ? "Admin" : "Team Member";

    console.log("Accept URL:", acceptUrl);
    console.log("Calling Resend API...");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bitcoin for Corporations <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: `You've been invited to join ${companyName} on BFC`,
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
                  Hi ${displayName},
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Bitcoin for Corporations as a <strong>${roleDisplay}</strong>.
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  As a team member, you'll be able to access the BFC member dashboard, claim conference tickets, register for events, and more.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${acceptUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #3f3f46; font-size: 14px; word-break: break-all; margin-bottom: 24px;">
                  ${acceptUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">
                  © ${new Date().getFullYear()} Bitcoin for Corporations. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    console.log("Resend API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error response:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== Error in send-team-invitation function ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);