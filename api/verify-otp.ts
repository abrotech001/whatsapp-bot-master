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
    // 3. Parse request body
    const { email, code } = req.body;
    console.log("[v0] OTP Verify - Email:", email, "Code:", code);

    if (!email || !code) {
      return res.status(400).json({ error: "Missing email or code" });
    }

    // 4. Initialize Database connection
    const supabase = createClient(
      process.env.WHATSME_DATABASE_SUPABASE_URL || "",
      process.env.WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 5. Find valid OTP
    console.log("[v0] Looking up OTP for email:", email.toLowerCase());
    const { data: verification, error: fetchErr } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("[v0] OTP lookup result:", { found: !!verification, error: fetchErr });

    if (fetchErr) {
      console.error("[v0] Database error looking up OTP:", fetchErr);
      return res.status(500).json({ error: "Could not verify code. Please try again or request a new code." });
    }

    if (!verification) {
      console.log("[v0] OTP not found or expired for:", email.toLowerCase());
      return res.status(400).json({ error: "Invalid or expired code. Codes expire after 10 minutes." });
    }

    // 6. Mark as verified
    console.log("[v0] Marking OTP as verified for:", email.toLowerCase());
    const { error: updateErr } = await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateErr) {
      console.error("[v0] Error updating verification status:", updateErr);
      return res.status(500).json({ error: "Failed to mark email as verified: " + updateErr.message });
    }
    console.log("[v0] OTP marked as verified");

    // 7. Confirm user in auth
    console.log("[v0] Confirming email in auth system...");
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    
    if (listErr) {
      console.error("[v0] Error listing users:", listErr);
      return res.status(500).json({ error: "Failed to find user: " + listErr.message });
    }

    const authUser = users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      console.log("[v0] Found auth user, confirming email...");
      const { error: confirmErr } = await supabase.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      });
      
      if (confirmErr) {
        console.error("[v0] Error confirming email in auth:", confirmErr);
        return res.status(500).json({ error: "Failed to confirm email: " + confirmErr.message });
      }
      console.log("[v0] Email confirmed in auth system");
    } else {
      console.warn("[v0] Auth user not found for email:", email.toLowerCase());
    }

    console.log("[v0] OTP verification complete");
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("[v0] OTP verification error:", error.message || error);
    return res.status(500).json({ error: error.message || "Failed to verify code. Please try again." });
  }
}
