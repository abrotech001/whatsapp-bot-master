import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json" // Guarantees frontend won't crash on errors
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Validate Authorization Header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token format" }), { status: 401, headers: corsHeaders });
    }

    // 3. Initialize Supabase Admin Client (Matching your working email setup)
    const adminClient = createClient(
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Validate User Token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: `Auth Failed: ${authErr?.message || "No valid user session"}` }), 
        { status: 401, headers: corsHeaders }
      );
    }

    // 5. Safely Parse Request Body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON body" }), { status: 400, headers: corsHeaders });
    }

    const { amount, plan_type, plan_duration_months } = body;

    if (!amount || !plan_type || !plan_duration_months) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    // 6. Check for Paystack Secret
    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET) {
      return new Response(JSON.stringify({ error: "Payment not configured on server. Missing Paystack key." }), { status: 500, headers: corsHeaders });
    }

    // 7. Create Transaction Record
    const { data: txn, error: txnError } = await adminClient
      .from("transactions")
      .insert({
        user_id: user.id,
        amount,
        plan_type,
        status: "pending",
      })
      .select()
      .single();

    if (txnError) {
      console.error("Transaction Error:", txnError);
      return new Response(JSON.stringify({ error: "Failed to create transaction record in database" }), { status: 500, headers: corsHeaders });
    }

    // 8. Initialize Paystack Transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Paystack expects kobo
        reference: txn.id,
        callback_url: `${req.headers.get("origin") || Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/payment-callback`,
        metadata: {
          user_id: user.id,
          plan_type,
          plan_duration_months,
          transaction_id: txn.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack API Error:", paystackData);
      return new Response(JSON.stringify({ error: "Payment initialization failed via Paystack" }), { status: 500, headers: corsHeaders });
    }

    // 9. Update Transaction with Paystack Reference
    await adminClient
      .from("transactions")
      .update({ payment_reference: paystackData.data.reference })
      .eq("id", txn.id);

    // 10. Return Success URL to Frontend
    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        transaction_id: txn.id,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Fatal Server Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
