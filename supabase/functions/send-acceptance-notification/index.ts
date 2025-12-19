import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = ['https://orangepages.bitcoinforcorporations.com', 'https://bitcoinforcorporations.com', 'http://localhost:5173', 'http://localhost:8080'];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, ''))) ||
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app')
  );
  return { 'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
};

interface AcceptanceNotificationRequest { inviterEmail: string; inviterName: string; acceptedUserName: string; acceptedUserEmail: string; companyName: string; }

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { inviterEmail, inviterName, acceptedUserName, acceptedUserEmail, companyName }: AcceptanceNotificationRequest = await req.json();
    if (!inviterEmail) return new Response(JSON.stringify({ success: true, message: "Skipped" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Bitcoin For Corporations <directory@bitcoinmagazine.com>",
        to: [inviterEmail],
        subject: `${acceptedUserName} has joined ${companyName}`,
        html: `<h1>Team Member Joined!</h1><p>Hi ${inviterName}, <strong>${acceptedUserName}</strong> (${acceptedUserEmail}) has accepted your invitation to join <strong>${companyName}</strong>.</p>`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
