# WHATMEBOT - Complete Setup Guide

## Overview
This guide walks you through setting up WHATMEBOT with Supabase integration and troubleshooting the pairing flow.

## Prerequisites
- Supabase project (free tier OK)
- WhatsApp number for testing
- Node.js 18+ and pnpm

## Step 1: Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional: WhatsApp API Integration
WHATSME_API_URL=http://mrcloverblah.seyori.name.ng:2001
WHATSME_AUTH_KEY=your_whatsme_auth_key
```

### Finding Your Supabase Credentials:
1. Go to [supabase.com](https://supabase.com)
2. Create a project or select existing one
3. Go to Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon Key → `VITE_SUPABASE_ANON_KEY`

## Step 2: Database Schema

Run these SQL queries in Supabase SQL Editor:

```sql
-- Create instances table
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT DEFAULT 'pending',
  pairing_code TEXT,
  plan_type TEXT NOT NULL,
  plan_duration_months INT DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'connecting', 'paused', 'deleted')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Create RPC function for checking roles
CREATE OR REPLACE FUNCTION has_role(
  _user_id UUID,
  _role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instances
CREATE POLICY "Users can view their own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);
```

## Step 3: Deploy Supabase Functions

The following functions must be deployed to Supabase:

### Files to Deploy:
- `supabase/functions/pair-instance/index.ts` - Handles WhatsApp pairing
- `supabase/functions/admin-create-instance/index.ts` - Admin instance creation
- `supabase/functions/delete-instance/index.ts` - Instance deletion

### Deploy with CLI:
```bash
supabase functions deploy pair-instance
supabase functions deploy admin-create-instance
supabase functions deploy delete-instance
```

Or use Supabase Dashboard:
1. Go to Functions → Create Function
2. Copy the code from the corresponding file
3. Deploy

## Step 4: Running the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

The app will be available at `http://localhost:8080`

## Step 5: Testing the Pairing Flow

### User Registration:
1. Go to landing page
2. Click "Sign Up"
3. Enter email and password
4. Verify email (check spam folder)

### Dashboard Access:
1. Log in with your credentials
2. You should see the Dashboard page

### Creating an Instance (Admin Only):
1. Make sure your user has admin role:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('your-user-id', 'admin');
   ```
2. Click "Create Instance" button
3. Instance should appear in the list with "Awaiting Pairing" status

### Pairing Process:
1. Click "Pair" button on an instance
2. Select country code (Nigeria = 234)
3. Enter 10-digit phone number
4. Click "Get Pairing Code"
5. **You should see the pairing code displayed**
6. Copy the code and enter it in WhatsApp

## Troubleshooting

### Issue: Pairing code not showing

**Check these in browser console (F12 → Console tab):**

Look for `[v0]` debug messages:
- `[v0] Starting pairing...` - Request started
- `[v0] Pairing response:` - Response from function
- `[v0] Pairing code received:` - Success!
- `[v0] Pairing error:` - Error occurred

**Common Issues:**

1. **"Unauthorized" error**
   - Check if auth token is valid
   - Try logging out and back in
   - Check browser DevTools → Application → Cookies → Session

2. **"Instance not found" error**
   - Make sure you created an instance first
   - Check that you're the owner (user_id matches)

3. **"Failed to get pairing code" error**
   - WhatsApp API is unreachable
   - Check `WHATSME_API_URL` is set correctly
   - API server might be down

4. **No function response**
   - Check if functions are deployed to Supabase
   - Check function logs: Supabase Dashboard → Functions → function name → Logs
   - Look for error messages like "Module not found" or "Syntax error"

5. **Pairing code appears but doesn't work**
   - WhatsApp might require specific code format
   - Check WhatsApp documentation for pairing requirements
   - Ensure phone number format is correct

### Debugging in Supabase

**View Function Logs:**
1. Supabase Dashboard → Functions
2. Click on function name (e.g., pair-instance)
3. Go to Logs tab
4. Look for `[Pair]` debug messages

**Check Database:**
1. Supabase Dashboard → SQL Editor
2. Run queries to inspect data:
```sql
-- Check instances
SELECT id, user_id, phone_number, pairing_code, status FROM instances;

-- Check if user exists
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check user roles
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
```

### Enable Debug Logging

The app already has debug logging enabled. Check browser console for:
- Network tab: XHR/Fetch requests to functions
- Console tab: `[v0]` prefixed messages

## Pairing Flow Diagram

```
User Input (Phone Number)
    ↓
Dashboard.handlePair()
    ↓
supabase.functions.invoke("pair-instance")
    ↓
pair-instance Function (Deno)
    ├─ Authenticate user
    ├─ Verify instance ownership
    ├─ Call WhatsApp API (optional)
    ├─ Update instance with pairing_code
    └─ Return pairing_code
    ↓
Dashboard receives pairing_code
    ↓
Dialog shows code to user
    ↓
User enters code in WhatsApp
```

## Production Deployment

### Vercel Deployment:
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel project settings
4. Deploy!

### Environment Variables in Vercel:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PUBLISHABLE_KEY=... (same as ANON_KEY)
```

## Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
