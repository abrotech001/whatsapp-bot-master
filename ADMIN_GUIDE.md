# Admin Panel Guide

## Overview

The admin panel at `/admin` provides comprehensive platform management capabilities. Only administrators can access this panel.

## Admin Designation

An admin user is determined by:
1. **Email Match**: User email equals `ADMIN_EMAIL` environment variable (default: `abrahantemitope247@gmail.com`)
2. **Role Check**: User has admin role in the database via RLS

## Admin Capabilities

### 1. User Management
**Access**: Admin Panel > Users Tab

**Capabilities**:
- View all registered users
- View user email and registration date
- Delete users permanently (with confirmation)

**Security**:
- Deletion is permanent and cannot be undone
- Requires confirmation dialog
- All user data is deleted from auth system

---

### 2. Instance Management
**Access**: Admin Panel > Instances Tab

**Capabilities**:
- View all user instances
- Check instance status (active/expired/deleted)
- Check phone number and plan type
- Expire instances (change status to "expired")
- Delete instances (calls WhatsApp API to unpair, marks as "deleted")

**Status Meanings**:
- **active**: Instance is running and ready
- **expired**: Plan duration ended
- **deleted**: Instance was deleted by user or admin

**Important**: 
- Only "active" instances can be modified
- Deleting an instance calls WhatsApp API to unpair the phone number
- Admin instances created without payment stay "active" indefinitely

---

### 3. Transaction Monitoring
**Access**: Admin Panel > Transactions Tab

**Capabilities**:
- View all payment transactions
- Check payment status (success/pending/failed)
- View payment amounts and references
- Track which plan was purchased

**Status Meanings**:
- **success**: Payment verified, instance created
- **pending**: Payment initiated but not verified
- **failed**: Payment failed or couldn't be verified

---

### 4. Email Sending
**Access**: Admin Panel > Email Tab

**Capabilities**:
- Send custom emails to any user
- Select recipient from dropdown
- Write subject and body
- Preview email before sending
- Send emails with branded WHATMEBOT template

**Features**:
- Email template with WHATMEBOT branding
- Automatic HTML formatting
- Character limits: Subject (200 chars), Body (5000 chars)
- Live preview before sending

**Use Cases**:
- Service announcements
- Account notifications
- Important updates
- Support messages

**Important**:
- Admin SMTP credentials must be configured
- Emails are sent from `ADMIN_SMTP_USER` address
- Keep email content professional

---

## Admin Create Instance

As an admin, you have a special button in Dashboard to create free instances without payment.

**Location**: Dashboard > Create Instance button (admin only)

**What it creates**:
- Free "Admin Pro" plan
- 12 months validity
- Immediately ready for pairing
- No payment required

**Use Cases**:
- Testing features
- Providing complimentary services
- Staff instances
- Demo accounts

---

## Admin Rights and Responsibilities

### What Admins Can Do
- View all user data (email, join date)
- Create unlimited free instances
- Delete user accounts
- Send emails to users
- Manage instance lifecycles
- Monitor transactions

### What Admins Cannot Do
- Change user passwords directly (they can delete and recreate)
- Access user WhatsApp messages
- See WhatsApp instance credentials
- Modify payment history

### Best Practices
1. **Respect Privacy**: Only access data when necessary
2. **Document Actions**: Keep logs of admin actions
3. **Use Confirmation**: Always confirm destructive actions
4. **Professional Communication**: Keep emails professional
5. **Backup Critical Data**: Maintain backups before deletions
6. **Regular Reviews**: Periodically review platform activity

---

## Environment Setup for Admins

### Required Variables
```bash
ADMIN_EMAIL=abrahantemitope247@gmail.com
ADMIN_SMTP_HOST=smtp.gmail.com
ADMIN_SMTP_PORT=465
ADMIN_SMTP_USER=admin@example.com
ADMIN_SMTP_PASS=admin-app-password
```

### Email Configuration (Gmail Example)
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password (16 characters)
3. Use app password as `ADMIN_SMTP_PASS`
4. Set `ADMIN_SMTP_USER` to your Gmail address

### Alternative SMTP Providers
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.region.amazonaws.com:587

---

## Security Considerations

### Access Control
- Admin panel is protected by token authentication
- Only users with admin email or role can access
- All admin actions are logged by Vercel

### Data Protection
- User deletion is permanent
- Email sending is recorded in logs
- Instance operations trigger WhatsApp API calls
- All changes affect production immediately

### Audit Trail
- Admin emails are sent and logged
- User deletions are recorded
- Instance changes are timestamped
- Payment changes are tracked

---

## Common Admin Tasks

### Task 1: Send Announcement to User
1. Go to Admin Panel > Email Tab
2. Select user from dropdown
3. Write subject: "Important Update"
4. Write body with announcement
5. Review preview
6. Click "Send Email"

### Task 2: Delete Inactive User Account
1. Go to Admin Panel > Users Tab
2. Find user in list
3. Click trash icon
4. Confirm deletion
5. User account is permanently removed

### Task 3: Expire User's Plan
1. Go to Admin Panel > Instances Tab
2. Find instance (by phone number or user)
3. Click "Expire" button (ban icon)
4. Confirm action
5. Instance status changes to "expired"

### Task 4: Create Free Instance for Testing
1. Go to Dashboard
2. Click "Create Instance" (admin button)
3. Wait for instance to be created
4. Instance appears in instances list
5. Ready to pair with phone number

### Task 5: Monitor Transaction Failure
1. Go to Admin Panel > Transactions Tab
2. Look for failed transactions (red status)
3. Note the user and payment reference
4. Contact user about retry
5. Check Paystack dashboard for details

---

## Troubleshooting

### Can't Access Admin Panel
**Check**:
1. Are you logged in with admin email?
2. Does your email match `ADMIN_EMAIL` config?
3. Check browser console for auth errors

### Email Not Sending
**Check**:
1. ADMIN_SMTP credentials are set
2. Email address is in list (no typos)
3. Subject and body are filled
4. SMTP password is app-specific (not account password)

### Can't Delete User
**Check**:
1. User exists in database
2. Confirm dialog was accepted
3. Check Vercel logs for errors
4. User might already be deleted

### Instance Won't Delete
**Check**:
1. Instance status is active/expired
2. Phone number exists
3. WhatsApp API is accessible
4. Instance ID is correct

---

## Contact & Support

For issues with admin functions:
1. Check the logs in Vercel dashboard
2. Verify environment variables are set
3. Test endpoints with curl
4. Contact the development team

## Important Reminders

- Admin access is powerful and permanent
- Always confirm before deleting
- Keep SMTP credentials secure
- Don't share admin access
- Regular backups of critical data
- Review access logs periodically
