import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 2. Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 3. Get Auth Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    // 4. Initialize Database connection
    const supabase = createClient(
      process.env.WHATSME_DATABASE_SUPABASE_URL || "",
      process.env.WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 5. Get User from Token
    const token = authHeader.split(" ")[1];
    // @ts-expect-error
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return res.status(401).json({ error: `Auth Failed: ${authErr?.message}` });
    }

    // 6. Get Data from Request Body
    const { amount, plan_type, plan_duration_months } = req.body;

    // 7. Check Paystack Key
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: "Server missing Paystack key" });
    }

    // 8. Insert Transaction into Database
    const { data: txn, error: txnError } = await supabase
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
      console.error("Txn Error:", txnError);
      return res.status(500).json({ error: "Database error" });
    }

    // 9. Call Paystack API
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Paystack uses kobo
        reference: txn.id,
        callback_url: `${req.headers.origin}/payment-callback`,
        metadata: {
          user_id: user.id,
          plan_type,
          transaction_id: txn.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return res.status(500).json({ error: "Paystack initialization failed" });
    }

    // 10. Update transaction and return URL
    await supabase
      .from("transactions")
      .update({ payment_reference: paystackData.data.reference })
      .eq("id", txn.id);

    return res.status(200).json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
