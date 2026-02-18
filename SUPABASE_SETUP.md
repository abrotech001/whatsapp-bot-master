# Supabase Setup & Authentication Guide

## Environment Variables

All required environment variables are already configured in your Vercel project. The following variables must be set:

```
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

The application uses the following tables:

### 1. **profiles**
- Auto-created when a user signs up
- Stores user metadata (email, username)
- Connected to auth.users via user_id

### 2. **instances**
- WhatsApp bot instances
- Stores phone number, pairing code, plan info
- User-specific (RLS enabled)

### 3. **transactions**
- Payment transaction records
- Tracks plan purchases and status

### 4. **email_verifications**
- OTP codes for email verification
- Auto-expires after 10 minutes

### 5. **user_roles**
- Admin role management
- Contains admin, moderator, user roles

## Fixed Issues

### 1. **Supabase Client Configuration**
- ✅ Fixed environment variable names (now supports both VITE_ and NEXT_PUBLIC_ prefixes)
- ✅ Added better error logging when env vars are missing

### 2. **Authentication Flow**
- ✅ Improved signup with validation and better error handling
- ✅ Enhanced login with credential validation
- ✅ Fixed session checking in all protected pages
- ✅ Added proper async/await error handling

### 3. **Error Handling**
- ✅ Added try-catch blocks in all async operations
- ✅ Improved error messages throughout auth flows
- ✅ Added debug logging with `console.log("[v0] ...")` statements

### 4. **Database Operations**
- ✅ Fixed profile queries to handle non-existent records
- ✅ Improved instance and transaction fetching with error states
- ✅ Added proper error handling for admin role checks

## Testing the Setup

### 1. **Signup Flow**
1. Go to `/signup`
2. Fill in username, email, and password
3. Should receive OTP verification email
4. Enter OTP code to complete signup
5. Should redirect to pricing page

### 2. **Login Flow**
1. Go to `/login`
2. Enter email and password
3. Should redirect to `/dashboard` on success
4. Should show error message on failed login

### 3. **Protected Routes**
- `/dashboard` - Requires authentication
- `/profile` - Requires authentication
- `/admin` - Requires admin role

## Debug Logging

All operations now include debug logs with `[v0]` prefix. Check your browser console for:
- Auth state changes
- API call details
- Error messages
- Data fetching progress

Example:
```
[v0] Attempting login for: user@example.com
[v0] Login successful, redirecting
[v0] Session found, loading data
```

## Supabase Functions

The app uses several Edge Functions that must be deployed:

1. **send-confirmation-email** - Sends OTP via email
2. **verify-otp** - Validates OTP code
3. **pair-instance** - Pairs WhatsApp instance
4. **admin-create-instance** - Creates admin instances
5. **initialize-payment** - Initializes payment flow
6. **verify-payment** - Verifies payment status

## Common Issues & Solutions

### "Missing Supabase environment variables"
- Check Vercel project settings
- Ensure all SUPABASE_* variables are set
- Restart the dev server after updating env vars

### "Email verification failed"
- Check that send-confirmation-email function is deployed
- Verify SMTP settings in Supabase
- Check function logs in Supabase dashboard

### "Profile not created automatically"
- Ensure the trigger on auth.users is active
- Check database logs for trigger errors
- Manually insert profile if needed

### "RLS policy blocking access"
- Verify user is authenticated
- Check RLS policies in Supabase for each table
- Ensure user_id matches in policies

## Next Steps

1. Deploy all Supabase Edge Functions
2. Test complete signup → verification → login flow
3. Set up payment integration
4. Configure email service
5. Test admin dashboard functionality
