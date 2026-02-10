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
    const userEmail = claimsData.claims.email;

    const { amount, plan_type, plan_duration_months } = await req.json();

    if (!amount || !plan_type || !plan_duration_months) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), { status: 500, headers: corsHeaders });
    }

    // Create transaction record first
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: txn, error: txnError } = await adminClient
      .from("transactions")
      .insert({
        user_id: userId,
        amount,
        plan_type,
        status: "pending",
      })
      .select()
      .single();

    if (txnError) {
      console.error("Transaction insert error:", txnError);
      return new Response(JSON.stringify({ error: "Failed to create transaction" }), { status: 500, headers: corsHeaders });
    }

    // Initialize Paystack payment
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: amount * 100, // Paystack uses kobo
        reference: txn.id,
        callback_url: `${req.headers.get("origin") || Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/payment-callback`,
        metadata: {
          user_id: userId,
          plan_type,
          plan_duration_months,
          transaction_id: txn.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData);
      return new Response(JSON.stringify({ error: "Payment initialization failed" }), { status: 500, headers: corsHeaders });
    }

    // Update transaction with payment reference
    await adminClient
      .from("transactions")
      .update({ payment_reference: paystackData.data.reference })
      .eq("id", txn.id);

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        transaction_id: txn.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
