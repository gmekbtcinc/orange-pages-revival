import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ALLOWED_ORIGINS = ['https://orangepages.bitcoinforcorporations.com', 'https://bitcoinforcorporations.com', 'http://localhost:5173', 'http://localhost:8080'];
const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')));
  return { 'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
};

interface OnboardingEmailRequest { email: string; displayName: string; companyName: string; role: string; origin: string; }

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, displayName, companyName, role, origin: requestOrigin }: OnboardingEmailRequest = await req.json();
    const baseUrl = requestOrigin.includes("lovable") || requestOrigin.includes("localhost") ? PRODUCTION_URL : requestOrigin;
    const roleDisplay = role === "company_admin" ? "Admin" : "Team Member";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "BFC <noreply@orangepages.bitcoinforcorporations.com>",
        to: [email],
        subject: `Welcome to ${companyName} on BFC!`,
        html: `<h1>Welcome ${displayName}!</h1><p>You've joined <strong>${companyName}</strong> as a <strong>${roleDisplay}</strong>.</p><a href="${baseUrl}/dashboard">Go to Dashboard</a>`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
