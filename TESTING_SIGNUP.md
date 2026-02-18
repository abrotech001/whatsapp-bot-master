# Testing the Signup Flow - Step by Step

## Before You Start

Make sure all these variables are set in **Vercel → Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://ynjeyivrutvzetskzwvf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ynjeyivrutvzetskzwvf
SMTP_HOST=smtp.gmail.com (or your email server)
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password (NOT regular password)
WHATSME_DATABASE_SUPABASE_URL=https://ynjeyivrutvzetskzwvf.supabase.co
WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 1: Open Browser DevTools

1. Go to your Vercel app URL
2. Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
3. Click the **Console** tab
4. Keep this open while you test

## Step 2: Try to Sign Up

1. Click "Sign Up" button
2. Fill in the form:
   - Username: `testuser123`
   - Email: `youremail+test@gmail.com` (use a real email you can check)
   - Password: `password123`
3. Click "Sign Up" button

## Step 3: Watch the Console

You should see logs like:

```
[v0] Starting signup for: youremail+test@gmail.com
[v0] Creating auth user...
[v0] Sending confirmation email...
[v0] Email function response: { data: { success: true }, error: null }
[v0] Confirmation email sent successfully
```

## Step 4: If There's an Error

**Look at the browser console for [v0] logs**

Common errors:

### ❌ Console shows: "SMTP_HOST environment variable is missing"
- Go to Vercel Settings → Environment Variables
- Add `SMTP_HOST=smtp.gmail.com`
- Redeploy or wait for changes to take effect

### ❌ Console shows: "WHATSME_DATABASE_SUPABASE_URL is not set"
- Go to Vercel Settings → Environment Variables
- Add your Supabase URL and Service Role Key
- Look at Supabase Dashboard → Settings → API

### ❌ Console shows: "SMTP Error: TLS connection failed"
- Your SMTP credentials are wrong
- If using Gmail, make sure you're using an **App Password**, not your regular password
- Check SMTP_USER and SMTP_PASS are correct

### ❌ No error in console but email doesn't arrive
- Check your spam folder
- Check that the email address is correct
- Wait a few seconds, email can be slow
- Try resending (click "Resend Code" after entering email)

## Step 5: Check Your Email

1. Go to the email inbox (or spam folder) for the email you signed up with
2. Look for email from your SMTP_USER with subject "XXXXX is your WHATMEBOT verification code"
3. Copy the **6-digit code**

## Step 6: Enter the OTP Code

1. Go back to the browser
2. You should see an OTP input screen
3. Paste the 6-digit code
4. Click "Verify Code"

## Step 7: Watch Console Again

You should see:

```
[v0] Verifying OTP...
[v0] OTP Verify - Email: youremail+test@gmail.com Code: 123456
[v0] Looking up OTP for email: youremail+test@gmail.com
[v0] OTP lookup result: { found: true, error: null }
[v0] Marking OTP as verified...
[v0] OTP marked as verified
[v0] Confirming email in auth system...
[v0] Found auth user, confirming email...
[v0] Email confirmed in auth system
[v0] OTP verification complete
[v0] OTP verified, logging in...
[v0] Logged in successfully
```

Then you should be redirected to the pricing page!

## Step 8: If OTP Fails

### ❌ "Invalid or expired code"
- The code is wrong (copy carefully)
- The code expired (only lasts 10 minutes)
- Click "Resend Code" to get a new one
- Check your spam folder for the new email

### ❌ "Database error..."
- Check WHATSME_DATABASE_SUPABASE_URL in Vercel environment variables
- Make sure email_verifications table exists in Supabase
- Check that Service Role Key is correct

## Troubleshooting Checklist

- [ ] All SMTP variables are set in Vercel
- [ ] All WHATSME_DATABASE variables are set in Vercel  
- [ ] For Gmail: Using App Password (not regular password)
- [ ] Email is being received (check inbox AND spam folder)
- [ ] OTP code is copied correctly (no spaces)
- [ ] Browser console is open and showing [v0] logs
- [ ] Waiting after clicking signup (don't reload page)
- [ ] Check Supabase dashboard → email_verifications table has data

## Quick Test Email Setup (Gmail)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate a password (16 characters)
4. Use that as `SMTP_PASS` in Vercel
5. Use `smtp.gmail.com` as `SMTP_HOST`
6. Use `587` as `SMTP_PORT`
7. Use your Gmail address as `SMTP_USER`

## Need Help?

1. Open browser console (F12)
2. Try signing up again
3. Copy all [v0] error messages
4. Share those exact error messages for help
