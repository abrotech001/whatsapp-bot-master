import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "abrahantemitope247@gmail.com";

export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. Get Auth Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    // 3. Initialize Database connection
    const supabase = createClient(
      process.env.WHATSME_DATABASE_SUPABASE_URL || "",
      process.env.WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 4. Get User from Token
    const token = authHeader.split(" ")[1];
    // @ts-expect-error
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return res.status(401).json({ error: `Auth Failed: ${authErr?.message}` });
    }

    // 5. Check if user is admin (by email or by role)
    const isAdmin = user.email === ADMIN_EMAIL;
    
    if (!isAdmin) {
      // Fallback to role check if needed
      const { data: roleData } = await supabase.rpc("has_role", { 
        _user_id: user.id, 
        _role: "admin" 
      });
      if (!roleData) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    }

    // 6. Get query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get("action");

    // 7. Admin Actions
    if (action === "users" && req.method === "GET") {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (action === "all-instances" && req.method === "GET") {
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (action === "all-transactions" && req.method === "GET") {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (action === "delete-user" && req.method === "POST") {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" });
      }

      // @ts-expect-error
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }

    if (action === "update-instance" && req.method === "POST") {
      const { instance_id, status } = req.body;
      if (!instance_id || !status) {
        return res.status(400).json({ error: "Missing instance_id or status" });
      }

      // If deleting, call WhatsApp API
      if (status === "deleted") {
        const { data: inst } = await supabase
          .from("instances")
          .select("phone_number")
          .eq("id", instance_id)
          .maybeSingle();

        if (inst?.phone_number && inst.phone_number !== "pending") {
          const WHATSME_AUTH = process.env.WHATSME_AUTH_KEY;
          const WHATSME_URL = process.env.WHATSME_API_URL || "http://mrcloverblah.seyori.name.ng:2001";
          
          try {
            await fetch(
              `${WHATSME_URL}/delpair?jid=${encodeURIComponent(inst.phone_number)}`,
              {
                headers: { "x-whatsme-auth": WHATSME_AUTH || "" },
              }
            );
          } catch (e) {
            console.error("Admin delpair error:", e);
          }
        }
      }

      const { error } = await supabase
        .from("instances")
        .update({ status })
        .eq("id", instance_id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
