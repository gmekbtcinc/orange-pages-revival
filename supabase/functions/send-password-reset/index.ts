import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

const ALLOWED_ORIGINS = ['https://orangepages.bitcoinforcorporations.com', 'https://bitcoinforcorporations.com', 'http://localhost:5173', 'http://localhost:8080'];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, ''))) ||
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app')
  );
  return { 'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
};

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, origin: requestOrigin } = await req.json();
    if (!email || !requestOrigin) return new Response(JSON.stringify({ error: "Email and origin required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: users } = await supabase.auth.admin.listUsers();
    const userExists = users?.users.some((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!userExists) return new Response(JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const token = generateToken();
    await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("email", email.toLowerCase()).is("used_at", null);
    await supabase.from("password_reset_tokens").insert({ email: email.toLowerCase(), token, expires_at: new Date(Date.now() + 3600000).toISOString() });

    // Use production URL for reset links to ensure consistent user experience
    const baseUrl = requestOrigin.includes("lovable") || requestOrigin.includes("localhost") 
      ? PRODUCTION_URL 
      : requestOrigin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Bitcoin for Corporations <noreply@orangepages.bitcoinforcorporations.com>", to: [email], subject: "Reset Your Password", html: `<h1>Reset Your Password</h1><a href="${resetUrl}">Reset Password</a>` }),
    });

    return new Response(JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
