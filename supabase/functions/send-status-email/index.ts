import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ALLOWED_ORIGINS = ['https://orangepages.bitcoinforcorporations.com', 'https://bitcoinforcorporations.com', 'http://localhost:5173', 'http://localhost:8080'];
const PRODUCTION_URL = "https://orangepages.bitcoinforcorporations.com";

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')));
  return { 'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
};

type EmailType = "submission_approved" | "submission_rejected" | "claim_approved" | "claim_rejected" | "submission_received" | "claim_received";

interface StatusEmailRequest { type: EmailType; email: string; recipientName: string; businessName: string; businessId?: string; rejectionReason?: string; origin: string; }

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, email, recipientName, businessName, businessId, rejectionReason, origin: requestOrigin }: StatusEmailRequest = await req.json();
    const baseUrl = requestOrigin.includes("lovable") || requestOrigin.includes("localhost") ? PRODUCTION_URL : requestOrigin;

    const subjects: Record<EmailType, string> = {
      submission_approved: `Your business "${businessName}" has been approved!`,
      submission_rejected: `Update on your submission "${businessName}"`,
      claim_approved: `Your claim for "${businessName}" has been approved!`,
      claim_rejected: `Update on your claim for "${businessName}"`,
      submission_received: `We received your submission for "${businessName}"`,
      claim_received: `We received your claim for "${businessName}"`,
    };

    const bodies: Record<EmailType, string> = {
      submission_approved: `<h1>Approved!</h1><p>Hi ${recipientName}, <strong>${businessName}</strong> is now live on Orange Pages.</p><a href="${baseUrl}/dashboard/company-profile">Edit Profile</a>`,
      submission_rejected: `<h1>Update</h1><p>Hi ${recipientName}, we couldn't approve <strong>${businessName}</strong>.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}</p>`,
      claim_approved: `<h1>Claim Approved!</h1><p>Hi ${recipientName}, your claim for <strong>${businessName}</strong> has been verified.</p><a href="${baseUrl}/dashboard/company-profile">Manage Profile</a>`,
      claim_rejected: `<h1>Update</h1><p>Hi ${recipientName}, we couldn't verify your claim for <strong>${businessName}</strong>.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}</p>`,
      submission_received: `<h1>Received!</h1><p>Hi ${recipientName}, thanks for submitting <strong>${businessName}</strong>. We'll review it soon.</p>`,
      claim_received: `<h1>Received!</h1><p>Hi ${recipientName}, we've received your claim for <strong>${businessName}</strong>. We'll verify it soon.</p>`,
    };

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "BFC <noreply@orangepages.bitcoinforcorporations.com>", to: [email], subject: subjects[type], html: bodies[type] }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
