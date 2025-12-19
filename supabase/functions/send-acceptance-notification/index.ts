import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptanceNotificationRequest {
  inviterEmail: string;
  inviterName: string;
  acceptedUserName: string;
  acceptedUserEmail: string;
  companyName: string;
}

serve(async (req) => {
  console.log("=== send-acceptance-notification function called ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      inviterEmail,
      inviterName,
      acceptedUserName,
      acceptedUserEmail,
      companyName,
    }: AcceptanceNotificationRequest = await req.json();

    console.log("Sending acceptance notification:", {
      inviterEmail,
      acceptedUserName,
      acceptedUserEmail,
      companyName,
    });

    if (!inviterEmail) {
      console.log("No inviter email provided, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Skipped - no inviter email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const acceptedAt = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Member Joined</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Team Member Joined!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${inviterName || "there"},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! <strong>${acceptedUserName}</strong> has accepted your invitation to join <strong>${companyName}</strong> on the Bitcoin For Corporations platform.
          </p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">New Team Member Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${acceptedUserName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${acceptedUserEmail}</p>
            <p style="margin: 5px 0;"><strong>Joined:</strong> ${acceptedAt}</p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            They now have access to your company's member benefits and can start using the platform right away.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bitcoinforcorporations.com/dashboard/team" 
               style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Team Members
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Bitcoin For Corporations Member Portal</p>
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
        from: "Bitcoin For Corporations <directory@bitcoinmagazine.com>",
        to: [inviterEmail],
        subject: `${acceptedUserName} has joined ${companyName}`,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();

    console.log("Acceptance notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-acceptance-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
