# API Routes Migration Guide

## Overview

This document explains the migration from Supabase Edge Functions to Vercel API Routes. All serverless functions are now running on Vercel's Node.js runtime instead of Deno.

## Migrated Endpoints

### 1. Payment Functions

#### `/api/initialize-payment` (POST)
**Purpose**: Initialize Paystack payment for plan purchases

**Request**:
```json
{
  "amount": 1500,
  "plan_type": "Starter",
  "plan_duration_months": 1
}
```

**Response**:
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "transaction-ref-123",
  "transaction_id": "txn-id-123"
}
```

**Authentication**: Bearer token (required)

---

#### `/api/verify-payment` (POST)
**Purpose**: Verify Paystack payment and create WhatsApp instance

**Request**:
```json
{
  "reference": "transaction-reference"
}
```

**Response**:
```json
{
  "success": true,
  "instance_id": "instance-id-123"
}
```

**Authentication**: Bearer token (required)

---

### 2. Admin Functions

#### `/api/admin` (GET/POST)
**Purpose**: Admin operations (fetch users, instances, transactions, delete users, update instances)

**Query Parameters**:
- `action` - Required. One of: `users`, `all-instances`, `all-transactions`, `delete-user`, `update-instance`

**GET Examples**:
```bash
# Fetch all users
GET /api/admin?action=users

# Fetch all instances
GET /api/admin?action=all-instances

# Fetch all transactions
GET /api/admin?action=all-transactions
```

**POST Examples**:
```bash
# Delete user
POST /api/admin?action=delete-user
Body: { "user_id": "uuid" }

# Update instance status
POST /api/admin?action=update-instance
Body: { "instance_id": "uuid", "status": "deleted" | "expired" | "active" }
```

**Authentication**: Bearer token (required) + Admin role check
- User email must equal `ADMIN_EMAIL` environment variable OR
- User must have admin role via RLS

---

#### `/api/send-admin-email` (POST)
**Purpose**: Send emails to users (admin only)

**Request**:
```json
{
  "to": "user@example.com",
  "subject": "Important Update",
  "body": "Your message here"
}
```

**Response**:
```json
{
  "success": true
}
```

**Authentication**: Bearer token (required) + Admin role check

---

### 3. Instance Management Functions

#### `/api/pair-instance` (POST)
**Purpose**: Pair WhatsApp instance with phone number

**Request**:
```json
{
  "instance_id": "instance-id-123",
  "phone_number": "2341234567890"
}
```

**Response**:
```json
{
  "success": true,
  "pairing_code": "123456"
}
```

**Authentication**: Bearer token (required)
**Authorization**: User must own the instance

---

#### `/api/delete-instance` (POST)
**Purpose**: Delete/unpair WhatsApp instance

**Request**:
```json
{
  "instance_id": "instance-id-123"
}
```

**Response**:
```json
{
  "success": true
}
```

**Authentication**: Bearer token (required)
**Authorization**: User must own the instance

---

#### `/api/admin-create-instance` (POST)
**Purpose**: Admin creates free instance (admin only)

**Request**:
```json
{
  "plan_type": "Admin Pro",
  "plan_duration_months": 12
}
```

**Response**:
```json
{
  "success": true,
  "instance": {
    "id": "instance-id",
    "user_id": "user-id",
    "plan_type": "Admin Pro",
    "status": "active"
  }
}
```

**Authentication**: Bearer token (required) + Admin role check

---

### 4. Email Verification Functions

#### `/api/send-confirmation-email` (POST)
**Purpose**: Send OTP verification email during signup

**Request**:
```json
{
  "email": "user@example.com",
  "username": "john_doe"
}
```

**Response**:
```json
{
  "success": true
}
```

**Authentication**: None (public endpoint for signup flow)

---

#### `/api/verify-otp` (POST)
**Purpose**: Verify OTP code and confirm email

**Request**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true
}
```

**Authentication**: None (public endpoint for signup flow)

---

## Environment Variables Required

```bash
# Supabase
WHATSME_DATABASE_SUPABASE_URL=https://your-project.supabase.co
WHATSME_DATABASE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment (Paystack)
PAYSTACK_SECRET_KEY=your-paystack-secret-key

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin SMTP (for admin emails)
ADMIN_SMTP_HOST=smtp.gmail.com
ADMIN_SMTP_PORT=465
ADMIN_SMTP_USER=admin-email@gmail.com
ADMIN_SMTP_PASS=admin-app-password

# WhatsApp Integration
WHATSME_API_URL=http://mrcloverblah.seyori.name.ng:2001
WHATSME_AUTH_KEY=your-whatsme-auth-key

# Admin Configuration
ADMIN_EMAIL=abrahantemitope247@gmail.com
```

## Security Features

### 1. Authentication
- All endpoints (except public signup endpoints) require Bearer token authentication
- Tokens are validated against Supabase Auth

### 2. Authorization
- **Admin endpoints**: Check user email or admin role
- **User endpoints**: Verify user owns the resource
- **Public endpoints**: Only signup/verification endpoints are public

### 3. Data Protection
- All responses go through Supabase RLS (Row Level Security)
- Sensitive operations (delete, update) have ownership checks
- Email addresses are case-insensitive for privacy

### 4. Rate Limiting
- Implement rate limiting on `/api/send-confirmation-email` to prevent spam
- Consider rate limiting on payment endpoints

## Migration Checklist

- [x] Create all API routes in `/api` folder
- [x] Update Admin.tsx to call `/api/admin` instead of `supabase.functions.invoke`
- [x] Update Dashboard.tsx to call new API routes
- [x] Update Signup.tsx to call new API routes
- [x] Update PaymentCallback.tsx to call `/api/verify-payment`
- [x] Add nodemailer dependency
- [x] Configure environment variables
- [ ] Test all endpoints
- [ ] Deploy to Vercel

## Testing

### Test Admin Email Sending
```bash
curl -X POST http://localhost:3000/api/send-admin-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test",
    "body": "Test message"
  }'
```

### Test Payment Verification
```bash
curl -X POST http://localhost:3000/api/verify-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference": "paystack-reference"}'
```

## Troubleshooting

### Issue: "Unauthorized" on admin endpoints
**Solution**: Ensure user email matches `ADMIN_EMAIL` environment variable or has admin role in database

### Issue: Email not sending
**Solution**: Verify SMTP credentials, check app password (not regular password for Gmail)

### Issue: Paystack integration failing
**Solution**: Verify `PAYSTACK_SECRET_KEY` is set and correct

## Benefits of Migration

1. **Reliability**: Node.js runtime is more stable than Deno
2. **Debugging**: Better error logging and monitoring
3. **Performance**: Faster startup times
4. **Integration**: Easier to use npm packages like nodemailer
5. **Deployment**: No separate edge function deployments needed
