import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
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
    // Log all environment variables for debugging
    const envVars = {
      SMTP_HOST: !!Deno.env.get("SMTP_HOST"),
      SMTP_PORT: !!Deno.env.get("SMTP_PORT"),
      SMTP_USER: !!Deno.env.get("SMTP_USER"),
      SMTP_PASS: !!Deno.env.get("SMTP_PASS"),
      WHATSME_DATABASE_SUPABASE_URL: !!Deno.env.get("WHATSME_DATABASE_SUPABASE_URL"),
      WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY"),
    };
    console.log("[v0] Environment variables check:", JSON.stringify(envVars));

    const { email, username } = await req.json();
    console.log("[v0] Received signup request for:", email);
    
    if (!email) throw new Error("Missing required field: email");

    const code = generateOTP();

    // Store OTP in database
    const adminClient = createClient(
      Deno.env.get("WHATSME_DATABASE_SUPABASE_URL")!,
      Deno.env.get("WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY")!
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

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || 465);
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    // Validate SMTP configuration
    if (!smtpHost) {
      console.error("[v0] ERROR: SMTP_HOST is not set in Vercel environment variables");
      throw new Error("SMTP_HOST environment variable is missing. Please add it to Vercel Settings > Environment Variables");
    }
    if (!smtpUser) {
      console.error("[v0] ERROR: SMTP_USER is not set in Vercel environment variables");
      throw new Error("SMTP_USER environment variable is missing. Please add it to Vercel Settings > Environment Variables");
    }
    if (!smtpPass) {
      console.error("[v0] ERROR: SMTP_PASS is not set in Vercel environment variables");
      throw new Error("SMTP_PASS environment variable is missing. Please add it to Vercel Settings > Environment Variables");
    }

    console.log("[v0] SMTP Config - Host:", smtpHost, "Port:", smtpPort, "User:", smtpUser?.substring(0, 3) + "***");

    const client = new SmtpClient();
    console.log("[v0] Connecting to SMTP server...");
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
    });
    console.log("[v0] SMTP connected successfully");

    const messageId = `${crypto.randomUUID()}@whatsmebot.name.ng`;

    console.log("[v0] Sending email to:", email);
    await client.send({
      from: smtpUser,
      to: email,
      subject: `${code} is your WHATMEBOT verification code`,
      content: `Your WHATMEBOT verification code is: ${code}. It expires in 10 minutes.`,
      html: html,
      headers: {
        "Message-ID": `<${messageId}>`,
      },
    });
    console.log("[v0] Email sent successfully to:", email);

    await client.close();
    console.log("[v0] SMTP connection closed");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[v0] Email send error:", error.message || error);
    
    // Return detailed error message
    let errorMessage = error.message || "Failed to send email";
    
    // Check if it's an SMTP connection error
    if (error.message?.includes("SMTP") || error.message?.includes("TLS") || error.message?.includes("connection")) {
      errorMessage = `SMTP Error: ${error.message}. Check your SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) in Vercel environment variables.`;
    }
    
    // Check if it's a database error
    if (error.message?.includes("database") || error.message?.includes("WHATSME_DATABASE")) {
      errorMessage = `Database Error: ${error.message}. Check WHATSME_DATABASE_SUPABASE_URL and WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY in Vercel.`;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
