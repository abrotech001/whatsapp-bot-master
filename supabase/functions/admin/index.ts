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
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    // Check admin role

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Admin actions
    if (action === "users") {
      const { data, error } = await adminClient.from("profiles").select("*").order("created_at", { ascending: false });
      return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (action === "all-instances") {
      const { data, error } = await adminClient.from("instances").select("*").order("created_at", { ascending: false });
      return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (action === "all-transactions") {
      const { data, error } = await adminClient.from("transactions").select("*").order("created_at", { ascending: false });
      return new Response(JSON.stringify(data || []), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (action === "delete-user" && req.method === "POST") {
      const { user_id } = await req.json();
      await adminClient.auth.admin.deleteUser(user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (action === "update-instance" && req.method === "POST") {
      const { instance_id, status } = await req.json();
      
      // If deleting, call WhatsApp API
      if (status === "deleted") {
        const { data: inst } = await adminClient.from("instances").select("phone_number").eq("id", instance_id).maybeSingle();
        if (inst?.phone_number && inst.phone_number !== "pending") {
          const WHATSME_AUTH = Deno.env.get("WHATSME_AUTH_KEY");
          try {
            await fetch(`http://mrcloverblah.seyori.name.ng:2001/delpair?jid=${encodeURIComponent(inst.phone_number)}`, {
              headers: { "x-whatsme-auth": WHATSME_AUTH || "" },
            });
          } catch (e) { console.error("Admin delpair error:", e); }
        }
      }
      
      await adminClient.from("instances").update({ status }).eq("id", instance_id);
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error("Admin error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
