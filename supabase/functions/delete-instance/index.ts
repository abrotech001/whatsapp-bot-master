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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      console.error("[Delete] Auth error:", authErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;
    console.log("[Delete] Authenticated user:", userId);

    const { instance_id } = await req.json();
    if (!instance_id) {
      return new Response(JSON.stringify({ error: "Missing instance_id" }), { status: 400, headers: corsHeaders });
    }

    // Verify instance belongs to user
    const { data: instance, error: instErr } = await adminClient
      .from("instances")
      .select("*")
      .eq("id", instance_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (instErr || !instance) {
      console.error("[Delete] Instance error:", instErr);
      return new Response(JSON.stringify({ error: "Instance not found" }), { status: 404, headers: corsHeaders });
    }

    console.log("[Delete] Found instance:", instance.id, "Phone:", instance.phone_number);

    // Call WhatsApp delete API if phone is set
    if (instance.phone_number && instance.phone_number !== "pending") {
      const WHATSME_AUTH = Deno.env.get("WHATSME_AUTH_KEY");
      const WHATSME_URL = Deno.env.get("WHATSME_API_URL") || "http://mrcloverblah.seyori.name.ng:2001";
      try {
        console.log("[Delete] Calling WhatsApp API to unpair:", instance.phone_number);
        await fetch(
          `${WHATSME_URL}/delpair?jid=${encodeURIComponent(instance.phone_number)}`,
          {
            headers: { "x-whatsme-auth": WHATSME_AUTH || "" },
          }
        );
      } catch (e) {
        console.error("[Delete] Unpair API error (non-fatal):", e);
      }
    }

    // Mark instance as deleted
    const { error: updateErr } = await adminClient
      .from("instances")
      .update({ status: "deleted" })
      .eq("id", instance_id);
    
    if (updateErr) {
      console.error("[Delete] Update error:", updateErr);
      throw updateErr;
    }
    
    console.log("[Delete] Instance marked as deleted:", instance_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
