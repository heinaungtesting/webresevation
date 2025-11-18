# Email Notifications System

SportsMatch Tokyo includes a comprehensive email notification system to keep users engaged and informed.

## Features

### 1. Welcome Emails
- **Trigger:** Sent automatically when a user signs up
- **Content:** Welcome message with app overview and call-to-action
- **Template:** `sendWelcomeEmail()` in `lib/email.ts`

### 2. Session Reminder Emails
- **Trigger:** Sent 24 hours before a session starts
- **Content:** Session details including sport type, location, address, and time
- **Template:** `sendSessionReminderEmail()` in `lib/email.ts`
- **Automation:** Runs daily via Vercel Cron at 9:00 AM UTC

### 3. New Message Notifications
- **Trigger:** Sent when a user receives a new message
- **Content:** Sender name, message preview, and link to conversation
- **Template:** `sendMessageNotificationEmail()` in `lib/email.ts`
- **User Control:** Respects user's `notification_email` preference in settings

### 4. Session Update Notifications
- **Trigger:** Sent when a session is modified or cancelled
- **Content:** Update details with new date/time if applicable
- **Template:** `sendSessionUpdateEmail()` in `lib/email.ts`
- **Status:** Ready to use (manual trigger required)

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your domain or use the test domain for development

### 2. Get Your API Key

1. Navigate to API Keys in the Resend dashboard
2. Create a new API key
3. Copy the key (starts with `re_`)

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Email Service (Resend)
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="SportsMatch Tokyo <noreply@your-domain.com>"

# Cron Job Security (generate a random string)
CRON_SECRET="your-random-secret-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change to production URL when deploying
```

### 4. Verify Domain (Production Only)

For production:
1. Add and verify your domain in Resend
2. Update `EMAIL_FROM` to use your verified domain
3. Add DNS records as instructed by Resend

### 5. Set Up Cron Job

#### Option A: Vercel (Automatic)
- The `vercel.json` file is already configured
- Cron runs automatically at 9:00 AM UTC daily
- Add `CRON_SECRET` to Vercel environment variables

#### Option B: External Cron Service
Use any cron service (e.g., cron-job.org) to call:
```
POST https://your-domain.com/api/cron/session-reminders
Authorization: Bearer YOUR_CRON_SECRET
```

## User Preferences

Users can control email notifications in their settings:
- **notification_email:** Toggle for email notifications (on/off)
- **notification_push:** Reserved for future push notifications

## Email Templates

All email templates are located in `lib/email.ts`:

- `sendWelcomeEmail()` - Welcome new users
- `sendSessionReminderEmail()` - Remind users of upcoming sessions
- `sendMessageNotificationEmail()` - Notify of new messages
- `sendSessionUpdateEmail()` - Notify of session changes

Each template uses responsive HTML with inline CSS for maximum compatibility.

## Testing

### Test Welcome Email
1. Sign up with a real email address
2. Check your inbox for the welcome email

### Test Message Notification
1. Ensure `notification_email` is enabled in settings
2. Have another user send you a message
3. Check your inbox for the notification

### Test Session Reminder (Manual)
```bash
# Call the cron endpoint manually
curl -X GET "http://localhost:3000/api/cron/session-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## API Endpoints

### Session Reminders Cron
- **Endpoint:** `GET /api/cron/session-reminders`
- **Auth:** Bearer token (CRON_SECRET)
- **Schedule:** Daily at 9:00 AM UTC
- **Function:** Finds sessions 24 hours away and sends reminders

## Troubleshooting

### Emails Not Sending

1. **Check API Key:**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY
   ```

2. **Check Logs:**
   - Development: Check console for "Email sent successfully" or error messages
   - Production: Check Vercel logs

3. **Verify Domain:**
   - For production, ensure domain is verified in Resend
   - For development, use Resend's test domain

4. **Check User Preferences:**
   - Ensure user has `notification_email: true` in their profile

### Cron Job Not Running

1. **Vercel:**
   - Check Cron logs in Vercel dashboard
   - Verify `CRON_SECRET` is set in environment variables

2. **External Service:**
   - Check service logs
   - Verify endpoint URL and authorization header

## Best Practices

1. **Non-Blocking:** All emails are sent asynchronously to avoid blocking API responses
2. **Error Handling:** Email failures don't affect core functionality (signup, messaging, etc.)
3. **User Control:** Respect user's notification preferences
4. **Rate Limiting:** Resend free tier: 100 emails/day, 3,000/month
5. **Testing:** Use test email addresses during development

## Future Enhancements

- [ ] Email verification reminder (3 days after signup)
- [ ] Weekly digest of upcoming sessions
- [ ] Session participant joined notification
- [ ] Achievement/milestone emails
- [ ] Customizable email templates per language (EN/JA)
- [ ] Unsubscribe link management
- [ ] Email analytics dashboard

## Support

For issues related to:
- **Resend Service:** [Resend Documentation](https://resend.com/docs)
- **SportsMatch App:** Check application logs or contact support

---

Last Updated: 2025-11-18
