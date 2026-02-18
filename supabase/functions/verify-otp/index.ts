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
    const { email, code } = await req.json();
    console.log("[v0] OTP Verify - Email:", email, "Code:", code);

    if (!email || !code) {
      throw new Error("Missing email or code");
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get("WHATSME_DATABASE_SUPABASE_URL");
    const supabaseKey = Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl) {
      throw new Error("WHATSME_DATABASE_SUPABASE_URL is not set. Check Vercel environment variables.");
    }
    if (!supabaseKey) {
      throw new Error("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY is not set. Check Vercel environment variables.");
    }

    console.log("[v0] Creating admin client with Supabase");
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Find valid OTP
    console.log("[v0] Looking up OTP for email:", email.toLowerCase());
    const { data: verification, error: fetchErr } = await adminClient
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
      const errorMsg = "Could not verify code. Please try again or request a new code.";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verification) {
      console.log("[v0] OTP not found or expired for:", email.toLowerCase());
      const errorMsg = "Invalid or expired code. Codes expire after 10 minutes.";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    console.log("[v0] Marking OTP as verified for:", email.toLowerCase());
    const { error: updateErr } = await adminClient
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    if (updateErr) {
      console.error("[v0] Error updating verification status:", updateErr);
      throw new Error("Failed to mark email as verified: " + updateErr.message);
    }
    console.log("[v0] OTP marked as verified");

    // Confirm user in auth
    console.log("[v0] Confirming email in auth system...");
    const { data: users, error: listErr } = await adminClient.auth.admin.listUsers();
    
    if (listErr) {
      console.error("[v0] Error listing users:", listErr);
      throw new Error("Failed to find user: " + listErr.message);
    }

    const authUser = users?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      console.log("[v0] Found auth user, confirming email...");
      const { error: confirmErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      });
      
      if (confirmErr) {
        console.error("[v0] Error confirming email in auth:", confirmErr);
        throw new Error("Failed to confirm email: " + confirmErr.message);
      }
      console.log("[v0] Email confirmed in auth system");
    } else {
      console.warn("[v0] Auth user not found for email:", email.toLowerCase());
    }

    console.log("[v0] OTP verification complete");
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[v0] OTP verification error:", error.message || error);
    
    let errorMessage = error.message || "Failed to verify code. Please try again.";
    
    // Make error messages user-friendly
    if (errorMessage.includes("not set")) {
      errorMessage = "Server configuration error. Please contact support.";
    } else if (errorMessage.includes("database")) {
      errorMessage = "Database error. Please try again.";
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
