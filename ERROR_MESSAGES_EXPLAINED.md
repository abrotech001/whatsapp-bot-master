# What Error Messages You'll See Now

## On Mobile (Toast Popups)

When something goes wrong, you'll now see **specific, actionable error messages** in the toast popup at the top of your screen.

### Signup Form Errors

| Error Message | What It Means | What To Do |
|---|---|---|
| `Missing fields` | You didn't fill in username, email, or password | Fill in all three fields |
| `Username must be at least 3 characters` | Username is too short | Use 3+ characters |
| `Password must be at least 6 characters` | Password is too weak | Use 6+ characters |
| `Account exists` | This email is already registered | Sign in instead |
| `Username taken` | Someone is already using this username | Choose a different username |
| `Signup failed` | Auth system error | Try again with a different email |

### Email Sending Errors

| Error Message | What It Means | What To Do |
|---|---|---|
| `Email service error: Check SMTP configuration` | SMTP settings are wrong in Vercel | Check Vercel > Settings > Environment Variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS |
| `Connection error: Could not connect to email server` | Can't reach the email server | Check if SMTP_HOST and SMTP_PORT are correct |
| `Database error: Could not store verification code` | Database connection failed | Check WHATSME_DATABASE_SUPABASE_URL in Vercel |
| `Failed to send email. Please try again.` | Generic email error | Try again in a few moments |

### OTP Code Verification Errors

| Error Message | What It Means | What To Do |
|---|---|---|
| `Invalid code` | You entered wrong number of digits | Enter exactly 6 digits |
| `Invalid or expired code. Codes expire after 10 minutes.` | Code is wrong or too old | Check email again or request new code |
| `Could not verify code. Please try again or request a new code.` | Database error | Click "Resend Code" button |
| `Failed to verify code. Please try again.` | Generic verification error | Try again or resend code |

### Resend Code Errors

| Error Message | What It Means | What To Do |
|---|---|---|
| `Code Resent!` | ✅ Success! | Check your email |
| `Resend Failed - [specific error]` | Same as email sending errors | See email error section above |

## What Was Fixed

✅ **Before**: You saw generic "Edge Function returned a non-2xx status code"  
✅ **Now**: You see specific errors like "Email service error: Check SMTP configuration"

✅ **Before**: Errors only showed in browser console  
✅ **Now**: All errors show in toast popups on your mobile screen

✅ **Before**: No way to know what actually went wrong  
✅ **Now**: Each error tells you exactly what to check or do

## Quick Troubleshooting

**If you keep getting "Email service error":**
1. Go to Vercel dashboard
2. Click your project
3. Go to Settings > Environment Variables
4. Check that these are set (not empty):
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASS

**If you keep getting "Database error":**
1. Go to Vercel Settings > Environment Variables
2. Check that these are set:
   - WHATSME_DATABASE_SUPABASE_URL
   - WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY

**If code doesn't arrive in email:**
1. Check spam/junk folder
2. Wait a few moments
3. Click "Resend Code"

**If you keep getting "Invalid or expired code":**
1. Copy the exact code from your email (with no spaces)
2. Paste it into the input field
3. Make sure you enter it within 10 minutes of receiving it
