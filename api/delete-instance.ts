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
    console.log("[Delete] Authenticated user:", userId);

    // 6. Parse request body
    const { instance_id } = req.body;
    if (!instance_id) {
      return res.status(400).json({ error: "Missing instance_id" });
    }

    // 7. Verify instance belongs to user
    const { data: instance, error: instErr } = await supabase
      .from("instances")
      .select("*")
      .eq("id", instance_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (instErr || !instance) {
      console.error("[Delete] Instance error:", instErr);
      return res.status(404).json({ error: "Instance not found" });
    }

    console.log("[Delete] Found instance:", instance.id, "Phone:", instance.phone_number);

    // 8. Call WhatsApp delete API if phone is set
    if (instance.phone_number && instance.phone_number !== "pending") {
      const WHATSME_AUTH = process.env.WHATSME_AUTH_KEY;
      const WHATSME_URL = process.env.WHATSME_API_URL || "http://mrcloverblah.seyori.name.ng:2001";
      
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

    // 9. Mark instance as deleted
    const { error: updateErr } = await supabase
      .from("instances")
      .update({ status: "deleted" })
      .eq("id", instance_id);
    
    if (updateErr) {
      console.error("[Delete] Update error:", updateErr);
      throw updateErr;
    }
    
    console.log("[Delete] Instance marked as deleted:", instance_id);

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
