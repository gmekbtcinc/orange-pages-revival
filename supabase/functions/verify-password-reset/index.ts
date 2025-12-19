import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ALLOWED_ORIGINS = ['https://orangepages.bitcoinforcorporations.com', 'https://bitcoinforcorporations.com', 'http://localhost:5173', 'http://localhost:8080'];

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, ''))) ||
    origin.endsWith('.lovableproject.com')
  );
  return { 'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "verify";
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === "verify") {
      const { token } = await req.json();
      if (!token) return new Response(JSON.stringify({ valid: false, error: "Token required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      if (!/^[a-f0-9]{64}$/i.test(token)) return new Response(JSON.stringify({ valid: false, error: "Invalid token format" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

      const { data: tokenData } = await supabase.from("password_reset_tokens").select("email, expires_at, used_at").eq("token", token).maybeSingle();
      if (!tokenData) return new Response(JSON.stringify({ valid: false, error: "Invalid reset link" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
      if (tokenData.used_at) return new Response(JSON.stringify({ valid: false, error: "Link already used" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
      if (new Date(tokenData.expires_at) < new Date()) return new Response(JSON.stringify({ valid: false, error: "Link expired" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

      return new Response(JSON.stringify({ valid: true, email: tokenData.email }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } else if (action === "reset") {
      const { token, newPassword } = await req.json();
      if (!token || !newPassword) return new Response(JSON.stringify({ success: false, error: "Token and password required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      if (!/^[a-f0-9]{64}$/i.test(token)) return new Response(JSON.stringify({ success: false, error: "Invalid token format" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      if (newPassword.length < 6) return new Response(JSON.stringify({ success: false, error: "Password too short" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

      const { data: tokenData } = await supabase.from("password_reset_tokens").select("id, email, expires_at, used_at").eq("token", token).maybeSingle();
      if (!tokenData || tokenData.used_at || new Date(tokenData.expires_at) < new Date()) return new Response(JSON.stringify({ success: false, error: "Invalid or expired link" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users.find((u) => u.email?.toLowerCase() === tokenData.email.toLowerCase());
      if (!user) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

      await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
      await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", tokenData.id);

      return new Response(JSON.stringify({ success: true, message: "Password updated" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
