# Edge Function Configuration Guide

## Problem
The signup is failing because the Supabase Edge Functions (`send-confirmation-email` and `verify-otp`) require environment variables that haven't been configured yet.

## Required Environment Variables for Vercel

You need to add the following environment variables to your Vercel project:

### 1. SMTP Email Configuration
These are needed for sending verification emails:

```
SMTP_HOST = your_email_server_host (e.g., smtp.gmail.com)
SMTP_PORT = your_email_server_port (e.g., 587 for TLS, 465 for SSL)
SMTP_USER = your_email_address (e.g., support@whatmebot.com)
SMTP_PASS = your_email_password_or_app_password
```

### 2. Supabase Database Configuration
These allow Edge Functions to access your database:

```
WHATSME_DATABASE_SUPABASE_URL = https://ynjeyivrutvzetskzwvf.supabase.co
WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
```

## How to Add These Variables

### Option A: Via Vercel Dashboard (Recommended)
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with its value
5. Make sure they are available for **Production, Preview, and Development**
6. Redeploy your project

### Option B: Via Vercel CLI
```bash
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add WHATSME_DATABASE_SUPABASE_URL
vercel env add WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY
```

## Getting SMTP Credentials

### Gmail (Recommended for testing)
1. Enable 2-Factor Authentication on your Google account
2. Create an **App Password** (not your regular password)
3. Use these settings:
   - SMTP_HOST: `smtp.gmail.com`
   - SMTP_PORT: `587`
   - SMTP_USER: `your_email@gmail.com`
   - SMTP_PASS: `your_app_password` (16-character code)

### Other Email Providers
- **Sendgrid**: Use sendgrid's SMTP relay
- **Mailgun**: Use mailgun's SMTP settings
- **Amazon SES**: Use SES SMTP endpoint
- **Custom Server**: Use your server's SMTP details

## Getting Supabase Credentials

### WHATSME_DATABASE_SUPABASE_URL
Your project URL (already visible in your code):
`https://ynjeyivrutvzetskzwvf.supabase.co`

### WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY
1. Go to your Supabase project
2. Click **Settings** → **API**
3. Under "Your API keys", find the **Service Role** key
4. Copy it (keep it secret!)

## Testing After Configuration

1. Restart your Vercel deployment
2. Try signing up with a valid email
3. Check your email for the verification code
4. Enter the 6-digit code to complete signup

## Troubleshooting

### "Edge Function returned non-2xx status"
- Check that all environment variables are set in Vercel
- Verify SMTP credentials are correct
- Check Supabase project is accessible

### Email not arriving
- Check spam/junk folder
- Verify SMTP_USER and SMTP_PASS are correct
- Try a different email provider

### "Invalid or expired code"
- Code expires in 10 minutes
- Request a new code by clicking "Resend"
- Check that `email_verifications` table exists in Supabase

## Database Table Requirements

Your Supabase must have these tables:
- `email_verifications` - stores OTP codes and verification status
- `profiles` - stores user profile information
- `instances` - stores WhatsApp bot instances
- `transactions` - stores payment/usage transactions

These should already exist from the migrations, but verify they're created.
