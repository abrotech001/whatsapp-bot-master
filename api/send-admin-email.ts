import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

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
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return res.status(401).json({ error: `Auth Failed: ${authErr?.message}` });
    }

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
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Missing to, subject, or body" });
    }

    // 8. Check SMTP configuration
    const smtpHost = process.env.ADMIN_SMTP_HOST;
    const smtpPort = parseInt(process.env.ADMIN_SMTP_PORT || "465");
    const smtpUser = process.env.ADMIN_SMTP_USER;
    const smtpPass = process.env.ADMIN_SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ error: "Email service not configured on server" });
    }

    // 9. Create email HTML
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
    await transporter.sendMail({
      from: smtpUser,
      to: to,
      subject: subject,
      text: body,
      html: html,
    });

    console.log("Admin email sent to:", to);

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Admin email error:", error);
    return res.status(500).json({ error: error.message });
  }
}
