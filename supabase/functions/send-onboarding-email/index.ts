import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

interface OnboardingEmailRequest {
  email: string;
  displayName: string;
  companyName: string;
  role: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, companyName, role, origin }: OnboardingEmailRequest = await req.json();

    console.log("Sending onboarding email to:", email);
    console.log("Company:", companyName);

    const baseUrl = origin.includes("lovable.app") || origin.includes("lovable.dev") || origin.includes("localhost")
      ? PRODUCTION_URL
      : origin;

    const dashboardUrl = `${baseUrl}/dashboard`;
    const profileUrl = `${baseUrl}/company-profile`;
    const settingsUrl = `${baseUrl}/account-settings`;
    const roleDisplay = role === "company_admin" ? "Admin" : "Team Member";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BFC <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: `Welcome to ${companyName} on BFC!`,
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
                  <div style="background-color: #f7931a; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">🎉</span>
                  </div>
                  <h1 style="color: #f7931a; font-size: 28px; font-weight: bold; margin: 0;">Welcome to the Team!</h1>
                </div>
                
                <!-- Main Content -->
                <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">
                  Hi ${displayName || "there"},
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  You've successfully joined <strong>${companyName}</strong> on Bitcoin for Corporations as a <strong>${roleDisplay}</strong>. Welcome aboard!
                </p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f7931a; padding: 16px; border-radius: 0 6px 6px 0; margin: 24px 0;">
                  <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                    🚀 You're all set to access your BFC member benefits!
                  </p>
                </div>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
                  <strong>Here's what you can do:</strong>
                </p>
                
                <ul style="color: #3f3f46; font-size: 15px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
                  <li><strong>Claim conference tickets</strong> – Access your member ticket allocations</li>
                  <li><strong>Register for events</strong> – Sign up for symposiums and VIP dinners</li>
                  <li><strong>Apply for speaking</strong> – Submit proposals to speak at Bitcoin conferences</li>
                  <li><strong>View member resources</strong> – Access exclusive BFC content</li>
                </ul>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Go to Your Dashboard
                  </a>
                </div>
                
                <!-- Quick Links -->
                <div style="background-color: #f4f4f5; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                  <p style="color: #3f3f46; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Quick Links</p>
                  <p style="margin: 8px 0;">
                    <a href="${profileUrl}" style="color: #f7931a; font-size: 14px;">📊 Company Profile</a>
                  </p>
                  <p style="margin: 8px 0;">
                    <a href="${settingsUrl}" style="color: #f7931a; font-size: 14px;">⚙️ Account Settings</a>
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  Need help? Reach out to your company admin or reply to this email for support.
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

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Onboarding email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-onboarding-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
