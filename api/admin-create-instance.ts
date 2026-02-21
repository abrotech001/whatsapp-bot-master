import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "abrahantemitope247@gmail.com";

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

    console.log("[Admin-Create] Authenticated user:", user.id);

    // 6. Check if user is admin
    const isAdmin = user.email === ADMIN_EMAIL;
    
    if (!isAdmin) {
      // Fallback to role check
      const { data: roleData } = await supabase.rpc("has_role", { 
        _user_id: user.id, 
        _role: "admin" 
      });
      if (!roleData) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    }

    // 7. Parse request body
    const { plan_type, plan_duration_months } = req.body;
    console.log("[Admin-Create] Creating instance with plan:", plan_type, "duration:", plan_duration_months);
    
    // 8. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan_duration_months || 12));

    // 9. Create instance
    const { data: instance, error: insertErr } = await supabase
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

    return res.status(200).json({ success: true, instance });

  } catch (error: any) {
    console.error("Admin create instance error:", error);
    return res.status(500).json({ error: error.message });
  }
}
