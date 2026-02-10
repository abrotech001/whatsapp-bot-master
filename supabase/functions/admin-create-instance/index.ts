import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized: Missing authorization header");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized: Invalid token");

    console.log("[Admin-Create] Authenticated user:", user.id);

    // Check admin role
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin access required: User does not have admin role");

    const { plan_type, plan_duration_months } = await req.json();
    console.log("[Admin-Create] Creating instance with plan:", plan_type, "duration:", plan_duration_months);
    
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan_duration_months || 12));

    const { data: instance, error: insertErr } = await adminClient
      .from("instances")
      .insert({
        user_id: user.id,
        plan_type: plan_type || "Admin Pro",
        plan_duration_months: plan_duration_months || 12,
        phone_number: "pending",
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[Admin-Create] Insert error:", insertErr);
      throw insertErr;
    }
    
    console.log("[Admin-Create] Instance created successfully:", instance.id);

    return new Response(JSON.stringify({ success: true, instance }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Admin create instance error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
