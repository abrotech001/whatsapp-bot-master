# Quick Error Reference Card

## Find Your Error Below

### Step 1: Open Browser Console (F12)
### Step 2: Look for errors with `[v0]`
### Step 3: Find the error below

---

## Email Sending Errors

### ❌ "SMTP_HOST environment variable is missing"
```
Where: Browser console shows [v0] ERROR
Fix: Add SMTP_HOST to Vercel Settings > Environment Variables
Value: smtp.gmail.com (for Gmail) or your email server
```

### ❌ "SMTP_PORT environment variable is missing"
```
Where: Browser console shows [v0] ERROR
Fix: Add SMTP_PORT to Vercel Settings > Environment Variables
Value: 587 (usually) or 465 for SSL
```

### ❌ "SMTP_USER environment variable is missing"
```
Where: Browser console shows [v0] ERROR
Fix: Add SMTP_USER to Vercel Settings > Environment Variables
Value: your-email@gmail.com
```

### ❌ "SMTP_PASS environment variable is missing"
```
Where: Browser console shows [v0] ERROR
Fix: Add SMTP_PASS to Vercel Settings > Environment Variables
Value: For Gmail, get 16-char App Password from myaccount.google.com/apppasswords
```

### ❌ "SMTP Error: TLS connection failed" or "connection refused"
```
Where: Error toast at top of page
Problem: SMTP credentials are wrong or server unreachable
Fix: 
  1. Verify SMTP_HOST is correct
  2. Verify SMTP_PORT is correct (587 or 465)
  3. Verify SMTP_USER and SMTP_PASS are correct
  4. For Gmail: Make sure you're using App Password, NOT regular password
  5. Check the email server is online
```

---

## Database Errors

### ❌ "WHATSME_DATABASE_SUPABASE_URL is not set"
```
Where: Browser console shows [v0] ERROR
Fix: Add WHATSME_DATABASE_SUPABASE_URL to Vercel Settings > Environment Variables
Get from: Supabase Dashboard > Settings > API > Project URL
```

### ❌ "WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY is not set"
```
Where: Browser console shows [v0] ERROR
Fix: Add WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY to Vercel Settings > Environment Variables
Get from: Supabase Dashboard > Settings > API > Service Role Secret
Copy the FULL key starting with "eyJ..."
```

### ❌ "Database Error: ..."
```
Where: Browser console shows error
Problem: Database connection failed
Fix:
  1. Check WHATSME_DATABASE_SUPABASE_URL is correct (copy from Supabase)
  2. Check WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY is complete and correct
  3. Verify Supabase project is still active
```

---

## Email Verification Errors

### ❌ "Invalid or expired code"
```
Where: Error message on OTP screen
Problem: 
  - Code is wrong (typo?)
  - Code expired (10 minute limit)
  - Email never arrived
Fix:
  1. Check email inbox AND spam folder for verification email
  2. Copy code exactly (6 digits, no spaces)
  3. If expired, click "Resend Code"
  4. If no email received, check SMTP setup is correct
```

### ❌ No email received
```
Where: Nothing in inbox or spam
Problem: Email wasn't sent
Fix:
  1. Check browser console for [v0] SMTP errors
  2. Check SMTP variables are all set correctly
  3. Check SMTP credentials are correct
  4. For Gmail: Using App Password? (not regular password)
  5. Try "Resend Code" button
```

---

## Sign Up Not Working

### Checklist Before Trying Signup:
- [ ] SMTP_HOST is set in Vercel
- [ ] SMTP_PORT is set in Vercel (587)
- [ ] SMTP_USER is set in Vercel (your email)
- [ ] SMTP_PASS is set in Vercel (App Password for Gmail)
- [ ] WHATSME_DATABASE_SUPABASE_URL is set in Vercel
- [ ] WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY is set in Vercel
- [ ] Changes deployed (check Vercel deployments)
- [ ] Browser F12 console is open
- [ ] Email inbox and spam folder accessible

---

## How to Get Missing Values

### SMTP (Email) Values:

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character password
4. Set:
   - SMTP_HOST = `smtp.gmail.com`
   - SMTP_PORT = `587`
   - SMTP_USER = `your-email@gmail.com`
   - SMTP_PASS = `the 16-char password`

**For Other Services:**
- Outlook: smtp.office365.com:587
- SendGrid: smtp.sendgrid.net:587
- Custom: Ask your email provider

### Supabase (Database) Values:

1. Go to Supabase Dashboard
2. Click your project
3. Click "Settings" (bottom left)
4. Click "API"
5. Copy:
   - Project URL → `WHATSME_DATABASE_SUPABASE_URL`
   - Service Role Secret → `WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY`

---

## Still Need Help?

1. **Take a screenshot** of the error toast at top of page
2. **Copy the console errors** (right-click > Save as)
3. **Share both** with your error message

Include exact [v0] error messages you see in console!
