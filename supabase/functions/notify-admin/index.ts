import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "directory@bitcoinforclubs.com";
const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

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

interface NotifyAdminRequest {
  type: "new_claim" | "new_submission";
  businessName: string;
  submitterName: string;
  submitterEmail: string;
  origin: string;
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, businessName, submitterName, submitterEmail, origin: requestOrigin }: NotifyAdminRequest = await req.json();

    console.log("[notify-admin] Received request:", { type, businessName, submitterName, submitterEmail });

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Use production URL for admin links to ensure consistent user experience
    const baseUrl = requestOrigin.includes("lovable") || requestOrigin.includes("localhost") 
      ? PRODUCTION_URL 
      : requestOrigin;
    const adminUrl = `${baseUrl}/admin/claims`;
    
    let subject: string;
    let heading: string;
    let description: string;

    if (type === "new_claim") {
      subject = `🔔 New Business Claim: ${businessName}`;
      heading = "New Business Claim Received";
      description = `<strong>${submitterName}</strong> (${submitterEmail}) has submitted a claim for <strong>${businessName}</strong>.`;
    } else {
      subject = `🔔 New Business Submission: ${businessName}`;
      heading = "New Business Submission Received";
      description = `<strong>${submitterName}</strong> (${submitterEmail}) has submitted a new business: <strong>${businessName}</strong>.`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f7931a; margin: 0; font-size: 24px;">Bitcoin For Clubs</h1>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Admin Notification</p>
              </div>
              
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">${heading}</h2>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                ${description}
              </p>
              
              <p style="color: #555; line-height: 1.6; margin: 0 0 30px 0;">
                Please review this ${type === "new_claim" ? "claim" : "submission"} in the admin panel.
              </p>
              
              <div style="text-align: center;">
                <a href="${adminUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                  Review in Admin Panel
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated notification from the Orange Pages directory.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orange Pages <noreply@bitcoinforclubs.com>",
        to: [ADMIN_EMAIL],
        subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[notify-admin] Resend error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("[notify-admin] Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[notify-admin] Error:", error);
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
