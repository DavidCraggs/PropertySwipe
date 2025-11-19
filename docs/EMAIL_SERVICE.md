# Email Service Integration Guide

## Overview

The GetOn platform includes a comprehensive email notification system that sends emails for:
- New messages between renters and landlords
- Issue/maintenance reports
- Issue status updates
- SLA alerts (approaching and breached)
- Viewing confirmations
- Rating requests

## Configuration

### Environment Variables

Add the following to your `.env` file (see `.env.example` for template):

```bash
# Email Service Configuration
VITE_EMAIL_PROVIDER=sendgrid  # Options: sendgrid, resend, aws-ses, mock
VITE_EMAIL_API_KEY=your-api-key-here
VITE_EMAIL_FROM=noreply@geton.app
VITE_EMAIL_FROM_NAME=GetOn
```

### Supported Providers

#### 1. SendGrid (Recommended)
- **Free Tier:** 100 emails/day
- **Setup:**
  1. Sign up at [sendgrid.com](https://sendgrid.com)
  2. Create an API key (Settings → API Keys)
  3. Set `VITE_EMAIL_PROVIDER=sendgrid`
  4. Set `VITE_EMAIL_API_KEY=your-sendgrid-api-key`

#### 2. Resend
- **Free Tier:** 100 emails/day, 3,000/month
- **Setup:**
  1. Sign up at [resend.com](https://resend.com)
  2. Create an API key
  3. Set `VITE_EMAIL_PROVIDER=resend`
  4. Set `VITE_EMAIL_API_KEY=your-resend-api-key`

#### 3. AWS SES
- **Note:** Implementation placeholder only
- Requires AWS SDK integration

#### 4. Mock (Development)
- **Default for development**
- Logs emails to console instead of sending
- Set `VITE_EMAIL_PROVIDER=mock`

## Features

### ✅ Production-Ready Features

1. **Retry Logic**
   - Automatic retry on failure (max 3 attempts)
   - Exponential backoff (2s, 4s, 8s)
   - Graceful error handling

2. **Rate Limiting**
   - Maximum 100 emails per hour
   - Prevents API quota exhaustion
   - Automatic tracking and enforcement

3. **Development Mode**
   - Automatically detects `import.meta.env.DEV`
   - Logs emails to console instead of sending
   - No API calls in development

4. **Error Handling**
   - All errors logged, not thrown
   - Application never crashes from email failures
   - Failed emails tracked with `failureReason`

5. **Email Templates**
   - HTML and plain text versions
   - Responsive design
   - Unsubscribe links included
   - Brand-consistent styling

### 📧 Email Types

| Type | Trigger | Recipients |
|------|---------|------------|
| New Message | Message sent in match | Renter/Landlord/Agency |
| New Issue | Issue reported | Landlord/Agency |
| Issue Update | Status changed | Renter |
| SLA Alert | Deadline approaching/breached | Agency |
| Viewing Confirmation | Viewing scheduled | Renter/Landlord |
| Rating Request | Tenancy ended | Renter/Landlord |

## Usage Examples

### Sending a New Issue Notification

```typescript
import { emailService } from './services/EmailService';

// When an issue is reported
await emailService.sendNewIssueNotification(
  issue,
  'landlord@example.com',
  'John Landlord',
  {
    recipientName: 'John Landlord',
    renterName: 'Jane Renter',
    issueSubject: 'Boiler not working',
    issueCategory: 'maintenance',
    issuePriority: 'urgent',
    issueDescription: 'The boiler has stopped working...',
    propertyAddress: '123 Main Street, Liverpool',
    viewUrl: 'https://geton.app/issues/123',
  }
);
```

### Sending a Message Notification

```typescript
await emailService.sendNewMessageNotification(
  match,
  'renter',
  {
    recipientName: 'Jane Renter',
    senderName: 'John Landlord',
    messagePreview: 'Hi Jane, regarding the viewing...',
    propertyAddress: '123 Main Street, Liverpool',
    viewUrl: 'https://geton.app/matches/456',
  }
);
```

## Testing

### Development Testing

In development mode, emails are logged to console:

```
[EmailService] Development mode - Email logged: {
  to: 'user@example.com',
  subject: 'New message from John',
  type: 'new_message_renter'
}
```

### Production Testing

1. Set up a test email provider account (SendGrid/Resend)
2. Configure environment variables
3. Send a test email:

```typescript
import { createEmailService } from './services/EmailService';

const testService = createEmailService({
  provider: 'sendgrid',
  apiKey: 'your-test-api-key',
  fromEmail: 'test@geton.app',
  fromName: 'GetOn Test',
  isDevelopment: false,
});

// Send test email
await testService.sendNewMessageNotification(/* ... */);
```

## Rate Limiting

The service enforces a limit of **100 emails per hour** to prevent:
- API quota exhaustion
- Accidental spam
- Cost overruns

When rate limit is exceeded:
- Email status set to `'failed'`
- `failureReason` set to `'Rate limit exceeded (100 emails/hour)'`
- Warning logged to console

Check remaining quota:

```typescript
const remaining = emailService.rateLimiter.getRemaining();
console.log(`Emails remaining this hour: ${remaining}`);
```

## Security Best Practices

1. **Never commit API keys**
   - Use `.env` file (gitignored)
   - Use environment variables in production

2. **Validate email addresses**
   - Ensure valid format before sending
   - Sanitize user input in email content

3. **Monitor usage**
   - Track email delivery rates
   - Set up alerts for failures
   - Monitor API quota usage

4. **Unsubscribe compliance**
   - All emails include unsubscribe link
   - Honor unsubscribe requests immediately
   - Maintain unsubscribe list

## Troubleshooting

### Emails not sending

1. Check environment variables are set correctly
2. Verify API key is valid
3. Check console for error messages
4. Ensure not in development mode
5. Check rate limit hasn't been exceeded

### SendGrid errors

- **401 Unauthorized:** Invalid API key
- **403 Forbidden:** API key doesn't have send permission
- **429 Too Many Requests:** Rate limit exceeded (SendGrid side)

### Resend errors

- **401:** Invalid API key
- **422:** Invalid email format or content

## Production Deployment

1. **Set environment variables** in your hosting platform
2. **Verify email domain** with your provider
3. **Configure SPF/DKIM** records for deliverability
4. **Set up monitoring** for email delivery
5. **Test thoroughly** before going live

## Cost Estimation

### SendGrid
- Free: 100 emails/day
- Essentials: $19.95/month (50,000 emails)
- Pro: $89.95/month (100,000 emails)

### Resend
- Free: 3,000 emails/month
- Pro: $20/month (50,000 emails)

### Recommendations
- Start with free tier
- Monitor usage
- Upgrade as needed
- Consider email batching for high volume

## Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Check provider status page
4. Contact provider support

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
