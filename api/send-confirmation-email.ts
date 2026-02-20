import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // 2. Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 3. Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("[v0] send-confirmation-email: Received request");
    
    // 4. Check environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("[v0] SMTP config missing:", { smtpHost: !!smtpHost, smtpUser: !!smtpUser, smtpPass: !!smtpPass });
      return res.status(500).json({ error: "Email service not configured on server" });
    }

    // 5. Initialize Database connection
    const supabaseUrl = process.env.WHATSME_DATABASE_SUPABASE_URL;
    const supabaseKey = process.env.WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Supabase config missing");
      return res.status(500).json({ error: "Database not configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 6. Parse request body
    const { email, username } = req.body;
    console.log("[v0] Received signup request for:", email);
    
    if (!email) {
      return res.status(400).json({ error: "Missing required field: email" });
    }

    // 7. Generate OTP
    const code = generateOTP();

    // 8. Store OTP in database
    const { error: insertErr } = await supabase.from("email_verifications").insert({
      email: email.toLowerCase(),
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (insertErr) {
      console.error("[v0] Database insert error:", insertErr);
      return res.status(500).json({ error: "Failed to store verification code: " + insertErr.message });
    }

    // 9. Create email HTML
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

    // 10. Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // 11. Send email
    console.log("[v0] Sending email to:", email, "via", smtpHost);
    const mailResult = await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject: `${code} is your WHATMEBOT verification code`,
      text: `Your WHATMEBOT verification code is: ${code}. It expires in 10 minutes.`,
      html: html,
    });
    console.log("[v0] Email sent successfully to:", email, "MessageID:", mailResult.messageId);

    return res.status(200).json({ success: true, messageId: mailResult.messageId });

  } catch (error: any) {
    console.error("[v0] Email send error:", error);
    
    let errorMessage = error.message || error.toString() || "Failed to send verification email";
    
    if (errorMessage.includes("SMTP")) {
      errorMessage = "Email service error: Check SMTP configuration";
    } else if (errorMessage.includes("database") || errorMessage.includes("WHATSME_DATABASE")) {
      errorMessage = "Database error: Could not store verification code";
    } else if (errorMessage.includes("TLS") || errorMessage.includes("connection")) {
      errorMessage = "Connection error: Could not connect to email server";
    }
    
    console.error("[v0] Returning error:", errorMessage);
    
    return res.status(500).json({ error: errorMessage });
  }
}
