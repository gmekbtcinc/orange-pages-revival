import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

// Production URL - always use this for invitation links to avoid Lovable preview redirects
const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

interface InvitationEmailRequest {
  email: string;
  displayName?: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteToken: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, inviterName, companyName, role, inviteToken, origin: requestOrigin }: InvitationEmailRequest =
      await req.json();

    console.log("Sending invitation email to:", email);

    const baseUrl = requestOrigin.includes("lovable.app") || requestOrigin.includes("lovable.dev") || requestOrigin.includes("lovableproject.com") || requestOrigin.includes("localhost") 
      ? PRODUCTION_URL 
      : requestOrigin;
    
    const acceptUrl = `${baseUrl}/invite/accept?token=${inviteToken}`;
    
    const roleDisplayMap: Record<string, string> = {
      owner: "Owner",
      admin: "Admin",
      member: "Team Member",
    };
    const roleDisplay = roleDisplayMap[role] || "Team Member";
    const recipientName = displayName || email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BFC <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: `You've been invited to join ${companyName} on BFC`,
        html: `<!DOCTYPE html><html><body style="font-family: sans-serif;"><h1>Hi ${recipientName},</h1><p><strong>${inviterName}</strong> invited you to join <strong>${companyName}</strong> as a <strong>${roleDisplay}</strong>.</p><a href="${acceptUrl}" style="background:#f7931a;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;">Accept Invitation</a><p style="margin-top:20px;color:#666;">Link: ${acceptUrl}</p></body></html>`,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await res.json();
    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
