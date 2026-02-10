# Quick Troubleshooting Guide

## Problem: Pairing Code Not Showing

### Step 1: Check Browser Console
Press `F12` → Console tab, look for errors or `[Pair]` messages.

### Step 2: Verify Environment Variables
Check that these are set in `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 3: Check Supabase Functions Deployed
1. Supabase Dashboard → Functions
2. Should see: `pair-instance`, `admin-create-instance`, `delete-instance`
3. If missing, deploy them

### Step 4: Check Function Logs
1. Supabase Dashboard → Functions → pair-instance
2. Click "Logs" tab
3. Trigger pairing again
4. Look for `[Pair]` messages
5. Note any error messages

### Step 5: Verify Database Access
Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM instances;
```
If error, RLS policies might be blocking.

---

## Problem: "Unauthorized" Error

### Causes:
- User not logged in
- Session expired
- Invalid JWT token

### Fix:
1. Log out completely
2. Clear browser cookies
3. Log back in
4. Try pairing again

---

## Problem: "Instance not found"

### Causes:
- Instance doesn't exist
- User doesn't own instance
- Instance was deleted

### Fix:
1. Refresh dashboard
2. Create new instance if needed
3. Check you're logged in as correct user

---

## Problem: Phone Number Not Accepted

### Causes:
- Invalid format (must be 10-15 digits)
- Country code not included
- Special characters or spaces

### Fix:
1. Remove all non-digit characters
2. Check country code (Nigeria = 234, USA = 1)
3. Example: `+2348100000000` = enter `234` + `8100000000`

---

## Problem: "Failed to get pairing code"

### Most Likely Cause:
WhatsApp API is not accessible. This is a non-blocking issue - the function should generate a fallback code.

### Fix:
1. Check if error message shows why
2. Try again - might be temporary
3. Check Supabase function logs for `[Pair]` messages

---

## Problem: Code Works Locally but Not on Vercel

### Causes:
- Environment variables not set on Vercel
- Functions not deployed to Supabase
- CORS issues

### Fix:
1. Vercel Dashboard → Settings → Environment Variables
2. Add all `VITE_*` variables
3. Redeploy on Vercel

---

## Problem: Database Errors

### In Supabase Console:

```sql
-- Check if table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instances');

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'instances';

-- Count records
SELECT COUNT(*) FROM instances;
```

---

## Debug Checklist

- [ ] Browser console shows no errors
- [ ] Environment variables are set
- [ ] Logged in successfully
- [ ] Functions are deployed to Supabase
- [ ] Database tables exist
- [ ] User can see instances in dashboard
- [ ] Phone number is valid format
- [ ] Country code is selected
- [ ] No network errors (check Network tab)

---

## Logging Output Examples

### Successful Pairing:
```
[Pair] Authenticated user: user-uuid
[Pair] Calling WhatsApp API: http://api-url/pair
[Pair] API response status: 200
[Pair] API response: { code: '123456' }
[Pair] Instance updated successfully
```

### API Failure (Non-Fatal):
```
[Pair] Calling WhatsApp API: http://api-url/pair
[Pair] WhatsApp API error: ECONNREFUSED
[Pair] Generated fallback pairing code: 654321
```

### Auth Error:
```
[Pair] Auth error: invalid_grant (auth context: invalid_token)
```

---

## Contact Support

If you've checked all of the above and still have issues:

1. Check Supabase Status: https://status.supabase.com
2. Collect logs from:
   - Browser DevTools Console
   - Supabase Function Logs
   - Supabase Error Logs
3. Check that all SQL from SETUP_GUIDE.md was executed

---

## Common Command Reference

```bash
# Deploy functions
supabase functions deploy pair-instance
supabase functions deploy admin-create-instance
supabase functions deploy delete-instance

# Run locally
pnpm dev

# Build for production
pnpm build

# Check for errors
pnpm lint
```

---

## Environment Variable Quick Ref

Get these from Supabase Dashboard → Settings → API:

| Variable | Where to Find |
|----------|--------------|
| VITE_SUPABASE_URL | Settings → API → Project URL |
| VITE_SUPABASE_ANON_KEY | Settings → API → Anon Public Key |
| WHATSME_API_URL | Your WhatsApp API provider |
| WHATSME_AUTH_KEY | Your WhatsApp API provider |
