import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

interface WelcomeEmailRequest {
  email: string;
  displayName: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, origin }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const baseUrl = origin.includes("lovable.app") || origin.includes("lovable.dev") || origin.includes("localhost")
      ? PRODUCTION_URL
      : origin;

    const dashboardUrl = `${baseUrl}/dashboard`;
    const directoryUrl = `${baseUrl}/`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BFC <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: "Welcome to Orange Pages!",
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
                  <h1 style="color: #f7931a; font-size: 28px; font-weight: bold; margin: 0;">🍊 Orange Pages</h1>
                  <p style="color: #71717a; font-size: 14px; margin-top: 8px;">The Bitcoin Business Directory</p>
                </div>
                
                <!-- Main Content -->
                <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">
                  Welcome${displayName ? `, ${displayName}` : ""}!
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Thanks for signing up for Orange Pages. Your account has been created successfully.
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  <strong>Here's what you can do next:</strong>
                </p>
                
                <ul style="color: #3f3f46; font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
                  <li><strong>Claim your business</strong> - If your company is already listed, claim it to manage your profile</li>
                  <li><strong>Submit a new business</strong> - Add your Bitcoin-friendly business to the directory</li>
                  <li><strong>Explore the directory</strong> - Discover Bitcoin businesses worldwide</li>
                </ul>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Go to Your Dashboard
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 14px; text-align: center; margin-bottom: 24px;">
                  Or <a href="${directoryUrl}" style="color: #f7931a;">browse the directory</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <!-- BFC Membership Promo -->
                <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="color: #92400e; font-size: 16px; margin: 0 0 8px 0;">🏆 Become a BFC Member</h3>
                  <p style="color: #92400e; font-size: 14px; margin: 0 0 12px 0;">
                    Unlock exclusive benefits: conference tickets, speaking opportunities, VIP dinners, and more.
                  </p>
                  <a href="https://bitcoinforcorporations.com/join/" style="color: #92400e; font-size: 14px; font-weight: 600;">
                    Learn More →
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  If you didn't create this account, you can safely ignore this email.
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
    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
