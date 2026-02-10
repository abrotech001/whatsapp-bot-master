import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { instance_id, phone_number } = await req.json();

    if (!instance_id || !phone_number) {
      return new Response(JSON.stringify({ error: "Missing instance_id or phone_number" }), { status: 400, headers: corsHeaders });
    }

    // Validate phone number format (digits only, 10-15 chars)
    const cleanPhone = phone_number.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify instance belongs to user and is active
    const { data: instance, error: instErr } = await adminClient
      .from("instances")
      .select("*")
      .eq("id", instance_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (instErr || !instance) {
      return new Response(JSON.stringify({ error: "Instance not found or not active" }), { status: 404, headers: corsHeaders });
    }

    // Call WhatsApp pairing API
    const WHATSME_AUTH = Deno.env.get("WHATSME_AUTH_KEY");
    const pairRes = await fetch(
      `http://mrcloverblah.seyori.name.ng:2001/pair?jid=${encodeURIComponent(cleanPhone)}`,
      {
        headers: { "x-whatsme-auth": WHATSME_AUTH || "" },
      }
    );

    const pairData = await pairRes.json();
    const pairingCode = pairData.code;

    if (!pairingCode) {
      console.error("Pairing API response:", pairData);
      return new Response(JSON.stringify({ error: "Failed to get pairing code", details: pairData }), { status: 500, headers: corsHeaders });
    }

    // Update instance with phone number and pairing code
    await adminClient
      .from("instances")
      .update({ phone_number: cleanPhone, pairing_code: pairingCode })
      .eq("id", instance_id);

    return new Response(
      JSON.stringify({ success: true, pairing_code: pairingCode }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
