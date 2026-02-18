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

    if (!email || !code) {
      throw new Error("Missing email or code");
    }

    const adminClient = createClient(
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid OTP
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

    if (fetchErr || !verification) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    await adminClient
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", verification.id);

    // Confirm user in auth
    const { data: users } = await adminClient.auth.admin.listUsers();
    const authUser = users?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      await adminClient.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
