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
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), { status: 400, headers: corsHeaders });
    }

    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const verifyData = await verifyRes.json();

    const adminClient = createClient(
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!verifyData.status || verifyData.data.status !== "success") {
      await adminClient.from("transactions").update({ status: "failed" }).eq("id", reference);
      return new Response(JSON.stringify({ error: "Payment not successful", details: verifyData }), { status: 400, headers: corsHeaders });
    }

    const metadata = verifyData.data.metadata;
    const planDurationMonths = metadata.plan_duration_months;
    const planType = metadata.plan_type;

    // Update transaction to success
    await adminClient
      .from("transactions")
      .update({ status: "success" })
      .eq("id", reference);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + planDurationMonths);

    // Create the instance (phone_number will be set during pairing)
    const { data: instance, error: instanceError } = await adminClient
      .from("instances")
      .insert({
        user_id: userId,
        phone_number: "pending",
        plan_type: planType,
        plan_duration_months: planDurationMonths,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (instanceError) {
      console.error("Instance creation error:", instanceError);
      return new Response(JSON.stringify({ error: "Failed to create instance" }), { status: 500, headers: corsHeaders });
    }

    // Link transaction to instance
    await adminClient
      .from("transactions")
      .update({ instance_id: instance.id })
      .eq("id", reference);

    return new Response(
      JSON.stringify({ success: true, instance_id: instance.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
