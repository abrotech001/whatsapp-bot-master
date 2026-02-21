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

    const userId = user.id;

    // 6. Parse Request Body
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: "Missing reference" });
    }

    // 7. Check Paystack Key
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({ error: "Server missing Paystack key" });
    }

    // 8. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      await supabase.from("transactions").update({ status: "failed" }).eq("id", reference);
      return res.status(400).json({ error: "Payment not successful", details: verifyData });
    }

    const metadata = verifyData.data.metadata;
    const planDurationMonths = metadata.plan_duration_months;
    const planType = metadata.plan_type;

    // 9. Update transaction to success
    await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", reference);

    // 10. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + planDurationMonths);

    // 11. Create the instance
    const { data: instance, error: instanceError } = await supabase
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
      return res.status(500).json({ error: "Failed to create instance" });
    }

    // 12. Link transaction to instance
    await supabase
      .from("transactions")
      .update({ instance_id: instance.id })
      .eq("id", reference);

    return res.status(200).json({ success: true, instance_id: instance.id });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
