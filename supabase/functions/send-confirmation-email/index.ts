import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username } = await req.json();

    if (!email) {
      throw new Error("Missing required field: email");
    }

    const code = generateOTP();

    // Store OTP in database
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient.from("email_verifications").insert({
      email: email.toLowerCase(),
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6C2BD9; margin: 0; font-size: 28px;">WHATMEBOT</h1>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">Verify Your Email</h2>
          <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">
            Hi${username ? ` ${username}` : ''}, use the code below to complete your registration.
          </p>
          <div style="background: #ffffff; border: 2px dashed #6C2BD9; border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6C2BD9;">${code}</span>
          </div>
          <p style="color: #9ca3af; margin: 24px 0 0; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          If you didn't sign up for WHATMEBOT, you can safely ignore this email.
        </p>
      </div>
    `;
    
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST")!,
        port: Number(Deno.env.get("SMTP_PORT") || 465),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASS")!,
        },
      },
    });

    
    // Add this helper at the top or inside your serve function
    const messageId = `<${crypto.randomUUID()}@whatsmebot.name.ng>`; //

    await client.send({
      from: `WHATMEBOT - <${Deno.env.get("SMTP_USER")}>`,
      to: email,
      subject: `${code} is your WHATMEBOT verification code`,
      content: "auto",
      html,
      headers: {
      "Message-ID": messageId,
      "Date": new Date().toUTCString(),
      },
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
