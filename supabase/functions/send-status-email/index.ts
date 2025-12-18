import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

type EmailType = "submission_approved" | "submission_rejected" | "claim_approved" | "claim_rejected";

interface StatusEmailRequest {
  type: EmailType;
  email: string;
  recipientName: string;
  businessName: string;
  businessId?: string;
  rejectionReason?: string;
  origin: string;
}

function getEmailContent(params: StatusEmailRequest, baseUrl: string) {
  const { type, recipientName, businessName, businessId, rejectionReason } = params;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const businessUrl = businessId ? `${baseUrl}/business/${businessId}` : null;
  const profileUrl = `${baseUrl}/dashboard/company-profile`;

  switch (type) {
    case "submission_approved":
      return {
        subject: `Your business "${businessName}" has been approved!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 16px;">
                    <span style="font-size: 32px;">✅</span>
                  </div>
                </div>
                
                <h2 style="color: #18181b; font-size: 20px; text-align: center; margin-bottom: 16px;">
                  Your Business Has Been Approved!
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Hi ${recipientName},
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Great news! <strong>${businessName}</strong> has been approved and is now live on Orange Pages.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${profileUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Edit Your Company Profile
                  </a>
                </div>
                
                ${businessUrl ? `<p style="color: #71717a; font-size: 14px; text-align: center;"><a href="${businessUrl}" style="color: #f7931a;">View your public listing →</a></p>` : ""}
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  Need help? Reply to this email and we'll be happy to assist.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">© ${new Date().getFullYear()} Bitcoin for Corporations</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "submission_rejected":
      return {
        subject: `Update on your business submission "${businessName}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">
                  Update on Your Submission
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Hi ${recipientName},
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Unfortunately, we weren't able to approve your submission for <strong>${businessName}</strong> at this time.
                </p>
                
                ${rejectionReason ? `
                <div style="background-color: #fef2f2; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #991b1b; font-size: 14px; margin: 0;">
                    <strong>Reason:</strong> ${rejectionReason}
                  </p>
                </div>
                ` : ""}
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  You're welcome to submit again with updated information. If you have questions, please reply to this email.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  Need help? Reply to this email and we'll be happy to assist.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">© ${new Date().getFullYear()} Bitcoin for Corporations</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "claim_approved":
      return {
        subject: `Your claim for "${businessName}" has been approved!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 16px;">
                    <span style="font-size: 32px;">🎉</span>
                  </div>
                </div>
                
                <h2 style="color: #18181b; font-size: 20px; text-align: center; margin-bottom: 16px;">
                  Your Claim Has Been Approved!
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Hi ${recipientName},
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Congratulations! Your claim for <strong>${businessName}</strong> has been verified and approved. You now have full access to manage your company profile on Orange Pages.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${profileUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Manage Your Profile
                  </a>
                </div>
                
                ${businessUrl ? `<p style="color: #71717a; font-size: 14px; text-align: center;"><a href="${businessUrl}" style="color: #f7931a;">View your public listing →</a></p>` : ""}
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  Need help? Reply to this email and we'll be happy to assist.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">© ${new Date().getFullYear()} Bitcoin for Corporations</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "claim_rejected":
      return {
        subject: `Update on your claim for "${businessName}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">
                  Update on Your Claim
                </h2>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  Hi ${recipientName},
                </p>
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Unfortunately, we weren't able to verify your claim for <strong>${businessName}</strong> at this time.
                </p>
                
                ${rejectionReason ? `
                <div style="background-color: #fef2f2; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #991b1b; font-size: 14px; margin: 0;">
                    <strong>Reason:</strong> ${rejectionReason}
                  </p>
                </div>
                ` : ""}
                
                <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  If you believe this was an error or have additional documentation, please reply to this email.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #f7931a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                
                <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
                  Need help? Reply to this email and we'll be happy to assist.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #a1a1aa; font-size: 12px;">© ${new Date().getFullYear()} Bitcoin for Corporations</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: StatusEmailRequest = await req.json();
    console.log("Sending status email:", params.type, "to:", params.email);

    const baseUrl = params.origin.includes("lovable.app") || params.origin.includes("lovable.dev") || params.origin.includes("localhost")
      ? PRODUCTION_URL
      : params.origin;

    const { subject, html } = getEmailContent(params, baseUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BFC <noreply@orangepages.bitcoinforcorporations.com>",
        to: [params.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await res.json();
    console.log("Status email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
