# Error Diagnosis Guide - Signup Issues

## Current Setup
Your project has been updated with **DETAILED ERROR LOGGING**. Every error now shows the exact problem.

## How to Find the Specific Error

### Step 1: Open Browser Console
When you try to sign up and get an error, do this:
1. Open your browser (Chrome/Firefox/Safari)
2. Press **F12** or **Cmd+Option+I** (Mac) to open DevTools
3. Go to the **Console** tab
4. Try signing up again
5. Look for messages starting with **[v0]**

### Step 2: Read the Error Message in Your Toast
The error toast at the top of the page now shows the EXACT error from the Edge Function.

### Step 3: Common Errors and Solutions

---

## Error Messages You Might See

### ❌ "SMTP_HOST environment variable is missing"
**Problem:** Your SMTP email configuration is not set in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `SMTP_HOST` → Your email server (e.g., smtp.gmail.com)
   - `SMTP_PORT` → Usually 587 or 465
   - `SMTP_USER` → Your email address
   - `SMTP_PASS` → Your email password or app-specific password

### ❌ "SMTP_USER environment variable is missing"
Same as above - add the SMTP_USER variable to Vercel.

### ❌ "SMTP_PASS environment variable is missing"
Same as above - add the SMTP_PASS variable to Vercel.

### ❌ "WHATSME_DATABASE_SUPABASE_URL environment variable is missing"
**Problem:** Database connection info is missing.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `WHATSME_DATABASE_SUPABASE_URL` → Your Supabase project URL
   - `WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY` → Your Supabase service role key

To get these values:
1. Go to Supabase Dashboard
2. Click on your project
3. Settings → API
4. Copy the **Project URL** and **Service Role** key (with "service_role" prefix)

### ❌ "SMTP Error: TLS connection failed"
**Problem:** Your SMTP credentials are wrong or the server is unreachable.

**Check:**
- Verify SMTP_HOST is correct (e.g., smtp.gmail.com for Gmail)
- Verify SMTP_PORT is correct (usually 587 or 465)
- Verify SMTP_USER and SMTP_PASS are correct
- If using Gmail, you need an **App Password**, not your regular password

### ❌ "Invalid or expired code"
**Problem:** The OTP code is wrong or expired (it only lasts 10 minutes).

**Solution:**
- Check the code in your email (should be 6 digits)
- The code was sent to your email inbox or spam folder
- If it expired, go back and click "Resend Code"

---

## How to Check if Email Was Sent

1. Check your email inbox and spam folder for the verification code
2. The email should say "WHATMEBOT" and have a 6-digit code
3. If you don't see it:
   - Open browser console (F12) and look for error messages starting with [v0]
   - Check that SMTP variables are set in Vercel
   - Try "Resend Code" button

---

## Debug Logging - What You'll See in Console

When you sign up, you should see logs like:

```
[v0] Environment variables check: {SMTP_HOST: true, SMTP_USER: true, ...}
[v0] Received signup request for: yourtestemail@gmail.com
[v0] Starting signup for: yourtestemail@gmail.com
[v0] Creating auth user...
[v0] Sending confirmation email...
[v0] SMTP Config - Host: smtp.gmail.com Port: 587 User: you***
[v0] Connecting to SMTP server...
[v0] SMTP connected successfully
[v0] Sending email to: yourtestemail@gmail.com
[v0] Email sent successfully to: yourtestemail@gmail.com
```

**If you see an error**, it will show like:
```
[v0] ERROR: SMTP_HOST is not set in Vercel environment variables
[v0] Email send error: SMTP_HOST environment variable is missing...
```

---

## Verifying Your Vercel Environment Variables

To make sure variables are set correctly:

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** tab
4. Click **Environment Variables**
5. Look for these variables (they should all be there):
   - ✅ VITE_SUPABASE_URL
   - ✅ VITE_SUPABASE_PUBLISHABLE_KEY
   - ✅ SMTP_HOST
   - ✅ SMTP_PORT
   - ✅ SMTP_USER
   - ✅ SMTP_PASS
   - ✅ WHATSME_DATABASE_SUPABASE_URL
   - ✅ WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY

**If any are missing**, add them!

---

## Quick SMTP Setup for Gmail

### Using Gmail (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Create an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail and Windows Computer
   - Copy the 16-character password
3. In Vercel add:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = Your Gmail address
   - `SMTP_PASS` = The 16-character app password (not your regular password!)

### Using Other Email Services
- **Outlook**: smtp.office365.com:587
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **Custom Server**: Ask your email provider

---

## Still Having Issues?

1. **Check the browser console** (F12) for [v0] error messages
2. **Copy the exact error message** from the toast notification
3. **Share both the console error AND the toast error** for better help

The system is now set up to show you EXACTLY what's wrong. No more guessing!
