# Database Setup - Complete Guide

## Problem
Your build was failing because the Supabase client was trying to access `localStorage` during the server-side build process, which caused the build to be canceled.

## What Was Fixed
✅ Fixed Supabase client to only use `localStorage` in the browser (client-side)
✅ Added server-side checks (`typeof window !== 'undefined'`) to prevent build errors

## Required: Execute Migrations in Supabase

Your database migrations are defined but may not have been applied to your Supabase database. Follow these steps:

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Log in with your credentials
3. Select your project (whatsapp-bot-master)

### Step 2: Go to SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"

### Step 3: Copy and Execute Each Migration

**MIGRATION 1: Create profiles, instances, and transactions tables**

Go to your project folder and open:
`supabase/migrations/20260209235603_7fbbc4e2-1698-4253-b3e6-a76961c9daf4.sql`

Copy ALL the SQL code from this file and paste it into the SQL Editor in Supabase, then click "Run".

**MIGRATION 2: Add username column**

Open:
`supabase/migrations/20260210045004_62edf96e-07b1-4e65-a88f-4c7da1154bd9.sql`

Copy and run this in Supabase.

**MIGRATION 3: Create email_verifications table**

Open:
`supabase/migrations/20260210050529_77a86c94-f81b-4980-bcb5-fa02d15e516b.sql`

Copy and run this in Supabase.

### Step 4: Verify Tables Were Created
1. Go to "Table Editor" in Supabase
2. You should see these tables:
   - `profiles`
   - `instances`
   - `transactions`
   - `email_verifications`
   - `user_roles`

If all tables exist, your database is properly set up!

## Database Tables Overview

### profiles
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users
- `email` (TEXT) - User's email
- `username` (TEXT) - Unique username
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### instances
- `id` (UUID)
- `user_id` (UUID)
- `phone_number` (TEXT)
- `pairing_code` (TEXT)
- `status` (TEXT) - active, expired, deleted
- `plan_type` (TEXT)
- `plan_duration_months` (INT)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)

### transactions
- `id` (UUID)
- `user_id` (UUID)
- `instance_id` (UUID)
- `amount` (INT)
- `currency` (TEXT) - Default: NGN
- `plan_type` (TEXT)
- `status` (TEXT) - pending, success, failed
- `payment_reference` (TEXT)
- `created_at` (TIMESTAMP)

### email_verifications
- `id` (UUID)
- `email` (TEXT)
- `code` (TEXT)
- `expires_at` (TIMESTAMP) - 10 minutes from creation
- `verified` (BOOLEAN)
- `created_at` (TIMESTAMP)

### user_roles
- `id` (UUID)
- `user_id` (UUID)
- `role` (app_role) - admin, moderator, user

## Row Level Security (RLS) Enabled
All tables have Row Level Security enabled, which means:
- Users can only see their own data
- Admin users have special access
- Edge functions use service role to bypass RLS

## Next Steps
1. Execute all three migrations in Supabase
2. Verify all tables exist
3. Deploy your app to Vercel
4. Test signup flow - it should now work!

