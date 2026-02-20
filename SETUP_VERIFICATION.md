# Setup Verification Checklist

Use this checklist to verify your migration is complete and working correctly.

## Step 1: Dependencies

### Check nodemailer is installed
```bash
npm list nodemailer
# Should show: nodemailer@6.9.12 or similar
```

If not installed:
```bash
npm install nodemailer
```

## Step 2: Environment Variables

### Verify all required variables are set in Vercel

Go to Vercel Project Settings → Environment Variables and check:

- [ ] `WHATSME_DATABASE_SUPABASE_URL`
- [ ] `WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY`
- [ ] `PAYSTACK_SECRET_KEY`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `ADMIN_SMTP_HOST`
- [ ] `ADMIN_SMTP_PORT`
- [ ] `ADMIN_SMTP_USER`
- [ ] `ADMIN_SMTP_PASS`
- [ ] `WHATSME_API_URL`
- [ ] `WHATSME_AUTH_KEY`
- [ ] `ADMIN_EMAIL` (should be abrahantemitope247@gmail.com)

## Step 3: Test API Routes Locally

### Start dev server
```bash
npm run dev
```

Your app should be available at `http://localhost:5173` (Vite)

### Test Initialize Payment Endpoint
```bash
# First get an auth token by logging in through the UI
# Then use that token to test:

curl -X POST http://localhost:3000/api/initialize-payment \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "plan_type": "Starter",
    "plan_duration_months": 1
  }'
```

**Expected Response**:
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "txn-...",
  "transaction_id": "..."
}
```

### Test Admin Endpoint (as admin user only)
```bash
curl -X GET "http://localhost:3000/api/admin?action=users" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

**Expected Response**: Array of user objects (if not admin: 403 Forbidden)

## Step 4: Test Frontend Flows

### Test Signup Flow
1. Go to `/signup` in browser
2. Fill in email, username, password
3. Click Sign Up
4. Should receive email with OTP code
5. Enter code to verify email
6. Should be redirected to pricing

### Test Payment Flow
1. Log in as regular user
2. Go to `/pricing`
3. Click "Subscribe" on any plan
4. Should redirect to Paystack
5. Complete payment (test card: 4081 5917 6345 2013)
6. Should see success page and instance created

### Test Admin Panel
1. Log in as `abrahantemitope247@gmail.com`
2. Go to `/admin`
3. Should see admin panel (Users, Instances, Transactions, Email tabs)
4. Click Users tab → should see users list
5. Click Instances tab → should see instances list
6. Click Email tab → should see email form

### Test Instance Management
1. Log in as regular user
2. Go to `/dashboard`
3. Click "New Instance" (or "Create Instance" if admin)
4. Should show instance in list
5. Click phone icon to pair instance
6. Enter phone number (234 Nigeria format)
7. Should get pairing code

## Step 5: Verify Admin Powers

### As admin user (abrahantemitope247@gmail.com):

- [ ] Can create free instances without payment
- [ ] Can send emails to users
- [ ] Can delete users
- [ ] Can expire/delete instances
- [ ] Can view all users, instances, transactions

### Try in Admin Panel:
1. Email Tab: Send test email to a user
2. Users Tab: Try deleting a test user
3. Instances Tab: Try expiring a test instance
4. Check dashboard: New "Create Instance" button appears

## Step 6: Verify Email Sending

### Test Signup Email
1. Sign up with new account
2. Check email inbox (check spam folder)
3. Should receive verification email with OTP code
4. Code should be in format: 6 digits

### Test Admin Email
1. Log in as admin
2. Go to Admin > Email tab
3. Select a user
4. Write subject and message
5. Click "Send Email"
6. Check user's email (check spam folder)
7. Should receive branded WHATMEBOT email

## Step 7: Check Vercel Deployment

### Deploy to Vercel
```bash
git push origin main
# Vercel will auto-deploy
```

### After deployment, verify:
- [ ] All API routes are accessible
- [ ] Environment variables are set in Vercel
- [ ] HTTPS works (not HTTP)
- [ ] API calls work from deployed site
- [ ] Admin panel works on production URL

## Step 8: Monitor Logs

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Click your project
3. Go to Deployments
4. Click latest deployment
5. Check Logs tab for any errors

### Look for:
- [ ] No 500 errors from API routes
- [ ] Successful authentication checks
- [ ] Email sending confirmations
- [ ] Payment verification successes

## Common Issues During Verification

### Issue: "Cannot find module 'nodemailer'"
```bash
npm install nodemailer --save
npm run dev
```

### Issue: "SMTP authentication failed"
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail: Use app-specific password, not account password
- Check port: 465 for SSL, 587 for TLS

### Issue: "Unauthorized" when calling admin endpoint
- Ensure you're logged in as the admin email
- Check ADMIN_EMAIL environment variable is set
- Verify token is being sent correctly

### Issue: "Function invocation failed"
- Check API route file exists in `/api` folder
- Verify environment variables are set
- Check Vercel logs for detailed error
- Restart dev server if testing locally

### Issue: Payment not verifying
- Verify PAYSTACK_SECRET_KEY is correct
- Use test payment reference from Paystack
- Check transaction was created in database

### Issue: Instance not created after payment
- Check verify-payment endpoint is returning success
- Verify Supabase connection is working
- Check instances table exists
- Check RLS policies allow instance creation

## Quick Rollback (If Needed)

If you need to go back to Supabase functions:
```bash
git revert HEAD  # Revert to before migration
# Edit Admin.tsx, Dashboard.tsx, Signup.tsx, PaymentCallback.tsx
# Change back to supabase.functions.invoke() calls
# Deploy to Vercel
```

## Success Indicators

You'll know everything is working when:
- ✅ Signup/email verification works
- ✅ Payment flow completes
- ✅ Instances are created after payment
- ✅ Instance pairing works
- ✅ Admin can send emails
- ✅ Admin can delete users
- ✅ No 500 errors in Vercel logs
- ✅ All API responses are successful (200/201)

## Final Verification Call

Run this comprehensive test:

```bash
# Test all major flows
1. Sign up new account (test signup email)
2. Log in with new account
3. Go to pricing and start payment
4. Complete Paystack payment (test card)
5. Verify instance was created
6. Pair instance with phone
7. Log out and log in as admin
8. Go to admin panel
9. Send email to user
10. Check user's email for branded template
11. Delete a test user
12. Go back to users list and verify user is gone
```

If all 12 steps work, migration is complete and successful!

## Support Resources

- API Documentation: See `API_MIGRATION_GUIDE.md`
- Admin Guide: See `ADMIN_GUIDE.md`
- Migration Summary: See `MIGRATION_SUMMARY.md`
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
