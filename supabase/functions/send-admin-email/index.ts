import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.12";

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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const adminClient = createClient(
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin access required");

    const { to, subject, body } = await req.json();
    if (!to || !subject || !body) throw new Error("Missing to, subject, or body");

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6C2BD9; margin: 0; font-size: 28px;">WHATMEBOT</h1>
          <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0;">Official Communication</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; border-left: 4px solid #6C2BD9;">
          <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px;">${subject}</h2>
          <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
          This email was sent by WHATMEBOT Administration. Do not reply to this email.
        </p>
      </div>
    `;

    const smtpHost = Deno.env.get("ADMIN_SMTP_HOST")!;
    const smtpPort = Number(Deno.env.get("ADMIN_SMTP_PORT") || 465);
    const smtpUser = Deno.env.get("ADMIN_SMTP_USER")!;
    const smtpPass = Deno.env.get("ADMIN_SMTP_PASS")!;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: to,
      subject: subject,
      text: body,
      html: html,
    });

    console.log("Admin email sent to:", to);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Admin email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
