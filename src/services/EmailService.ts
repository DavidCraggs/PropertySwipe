/**
 * Phase 8: Email Notification Service
 * Handles sending email notifications for messages and issues
 * Integrated with SendGrid for production email delivery
 *
 * Per user requirements: Messages "go via an internal message system but also
 * get emailed out as well for visibility"
 */

import type { EmailNotification, EmailNotificationType, Issue, Match } from '../types';

/**
 * Email service configuration
 * Configuration comes from environment variables
 */
interface EmailConfig {
  provider: 'sendgrid' | 'aws-ses' | 'resend' | 'mock';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  isDevelopment: boolean;
}

/**
 * Email template data structures
 */
interface NewMessageEmailData {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  propertyAddress: string;
  viewUrl: string;
}

interface NewIssueEmailData {
  recipientName: string;
  renterName: string;
  issueSubject: string;
  issueCategory: string;
  issuePriority: string;
  issueDescription: string;
  propertyAddress: string;
  viewUrl: string;
}

interface IssueStatusUpdateEmailData {
  recipientName: string;
  issueSubject: string;
  oldStatus: string;
  newStatus: string;
  updateNotes?: string;
  viewUrl: string;
}

interface SLAAlertEmailData {
  recipientName: string;
  issueSubject: string;
  slaDeadline: Date;
  timeRemaining: string;
  isBreached: boolean;
  viewUrl: string;
}

/**
 * Rate limiter for email sending
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 3600000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canSend(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * EmailService class - handles all email notifications
 */
export class EmailService {
  private config: EmailConfig;
  private notificationQueue: EmailNotification[] = [];
  private rateLimiter: RateLimiter;

  constructor(config: EmailConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(100, 3600000); // 100 emails per hour
  }

  /**
   * Send a new message notification email
   * Triggered when a message is sent in a match conversation
   */
  async sendNewMessageNotification(
    match: Match,
    recipientType: 'renter' | 'landlord' | 'agency',
    data: NewMessageEmailData
  ): Promise<EmailNotification> {
    const type: EmailNotificationType =
      recipientType === 'renter'
        ? 'new_message_renter'
        : recipientType === 'landlord'
          ? 'new_message_landlord'
          : 'new_message_agency';

    const subject = `New message from ${data.senderName} - ${data.propertyAddress}`;

    const bodyHtml = this.renderNewMessageTemplate(data);
    const bodyText = this.renderNewMessageTemplateText(data);

    return this.queueEmail({
      type,
      recipientEmail: this.getRecipientEmail(match, recipientType),
      recipientName: data.recipientName,
      subject,
      bodyHtml,
      bodyText,
      matchId: match.id,
      propertyId: match.propertyId,
    });
  }

  /**
   * Send a conversation message notification email
   * Routes to correct recipient based on conversation type
   */
  async sendConversationMessageNotification(
    match: Match,
    conversationType: 'landlord' | 'agency',
    senderType: 'renter' | 'landlord' | 'management_agency',
    data: Omit<NewMessageEmailData, 'recipientName'>
  ): Promise<EmailNotification> {
    // Determine recipient based on conversation type and sender
    let recipientType: 'renter' | 'landlord' | 'agency';
    let recipientName: string;

    if (conversationType === 'landlord') {
      // Landlord conversation
      if (senderType === 'renter') {
        recipientType = 'landlord';
        recipientName = match.landlordName || 'Landlord';
      } else {
        recipientType = 'renter';
        recipientName = match.renterName || 'Renter';
      }
    } else {
      // Agency conversation
      if (senderType === 'renter') {
        recipientType = 'agency';
        recipientName = 'Management Agency'; // TODO: Fetch actual agency name
      } else {
        recipientType = 'renter';
        recipientName = match.renterName || 'Renter';
      }
    }

    const emailData: NewMessageEmailData = {
      ...data,
      recipientName
    };

    return this.sendNewMessageNotification(match, recipientType, emailData);
  }


  /**
   * Send a new issue notification email
   * Triggered when a tenant reports an issue
   */
  async sendNewIssueNotification(
    issue: Issue,
    recipientEmail: string,
    recipientName: string,
    data: NewIssueEmailData
  ): Promise<EmailNotification> {
    const subject = `🚨 New ${data.issuePriority} Issue: ${data.issueSubject}`;

    const bodyHtml = this.renderNewIssueTemplate(data);
    const bodyText = this.renderNewIssueTemplateText(data);

    return this.queueEmail({
      type: 'new_issue_raised',
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      bodyText,
      issueId: issue.id,
      propertyId: issue.propertyId,
    });
  }

  /**
   * Send issue status update notification
   * Triggered when issue status changes
   */
  async sendIssueStatusUpdate(
    issue: Issue,
    recipientEmail: string,
    recipientName: string,
    data: IssueStatusUpdateEmailData
  ): Promise<EmailNotification> {
    const subject = `Issue Update: ${data.issueSubject}`;

    const bodyHtml = this.renderIssueStatusUpdateTemplate(data);
    const bodyText = this.renderIssueStatusUpdateTemplateText(data);

    return this.queueEmail({
      type: 'issue_status_update',
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      bodyText,
      issueId: issue.id,
    });
  }

  /**
   * Send SLA approaching/breached alert
   * Triggered when issue is close to or past SLA deadline
   */
  async sendSLAAlert(
    issue: Issue,
    recipientEmail: string,
    recipientName: string,
    data: SLAAlertEmailData
  ): Promise<EmailNotification> {
    const type: EmailNotificationType = data.isBreached ? 'sla_breached' : 'sla_approaching';
    const subject = data.isBreached
      ? `⚠️ SLA BREACHED: ${data.issueSubject}`
      : `⏰ SLA Approaching: ${data.issueSubject}`;

    const bodyHtml = this.renderSLAAlertTemplate(data);
    const bodyText = this.renderSLAAlertTemplateText(data);

    return this.queueEmail({
      type,
      recipientEmail,
      recipientName,
      subject,
      bodyHtml,
      bodyText,
      issueId: issue.id,
    });
  }

  /**
   * Queue an email for sending
   * Handles rate limiting and provider selection
   */
  private async queueEmail(params: {
    type: EmailNotificationType;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    issueId?: string;
    matchId?: string;
    propertyId?: string;
  }): Promise<EmailNotification> {
    const notification: EmailNotification = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      status: 'pending',
      createdAt: new Date(),
    };

    // Add to queue
    this.notificationQueue.push(notification);

    // Check rate limit
    if (!this.rateLimiter.canSend()) {
      console.warn('[EmailService] Rate limit exceeded. Remaining:', this.rateLimiter.getRemaining());
      notification.status = 'failed';
      notification.failureReason = 'Rate limit exceeded (100 emails/hour)';
      return notification;
    }

    // Development mode - log instead of sending
    if (this.config.isDevelopment || this.config.provider === 'mock') {
      console.log('[EmailService] Development mode - Email logged:', {
        to: params.recipientEmail,
        subject: params.subject,
        type: params.type,
      });
      notification.status = 'sent';
      notification.sentAt = new Date();
      return notification;
    }

    // Production - send via provider
    try {
      await this.sendViaProvider(notification);
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      notification.status = 'failed';
      notification.failureReason = error instanceof Error ? error.message : 'Unknown error';
    }

    return notification;
  }

  /**
   * Send email via configured provider with retry logic
   */
  private async sendViaProvider(notification: EmailNotification): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.config.provider === 'sendgrid') {
          await this.sendViaSendGrid(notification);
        } else if (this.config.provider === 'aws-ses') {
          await this.sendViaAWSSES(notification);
        } else if (this.config.provider === 'resend') {
          await this.sendViaResend(notification);
        } else {
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
        }

        // Success
        notification.status = 'sent';
        notification.sentAt = new Date();
        console.log(`[EmailService] Email sent successfully via ${this.config.provider}:`, {
          to: notification.recipientEmail,
          subject: notification.subject,
          attempt,
        });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[EmailService] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Failed to send email after retries');
  }

  /**
   * Send email via SendGrid API
   */
  private async sendViaSendGrid(notification: EmailNotification): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: notification.recipientEmail, name: notification.recipientName }],
            subject: notification.subject,
          },
        ],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: notification.bodyText,
          },
          {
            type: 'text/html',
            value: notification.bodyHtml,
          },
        ],
        // Add unsubscribe link
        tracking_settings: {
          subscription_tracking: {
            enable: true,
            substitution_tag: '[unsubscribe]',
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${error}`);
    }
  }

  /**
   * Send email via AWS SES API
   */
  private async sendViaAWSSES(_notification: EmailNotification): Promise<void> {
    // Placeholder for AWS SES implementation
    // Would require AWS SDK and proper authentication
    throw new Error('AWS SES integration not yet implemented');
  }

  /**
   * Send email via Resend API
   */
  private async sendViaResend(notification: EmailNotification): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [notification.recipientEmail],
        subject: notification.subject,
        html: notification.bodyHtml,
        text: notification.bodyText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }
  }

  /**
   * Get recipient email from match based on recipient type
   *
   * IMPORTANT: In production, this should fetch the actual email from user profiles
   * via Supabase or your user management system.
   */
  private getRecipientEmail(match: Match, recipientType: 'renter' | 'landlord' | 'agency'): string {
    // Try to get email from match's renterProfile or use stored email
    if (recipientType === 'renter') {
      const renterEmail = match.renterProfile?.email;
      if (renterEmail) {
        return renterEmail;
      }
      // Fallback: In development, throw error to catch missing email configuration
      if (this.config.isDevelopment) {
        console.warn('[EmailService] No renter email found in match, using fallback');
      }
    }

    // For landlord/agency, we need to look up from profiles
    // In production, this would query Supabase for the user's email
    if (recipientType === 'landlord' || recipientType === 'agency') {
      // TODO: Implement proper email lookup from landlord/agency profiles
      // For now, log warning and use placeholder in development mode only
      if (this.config.isDevelopment) {
        console.warn(`[EmailService] Email lookup not implemented for ${recipientType}, using development placeholder`);
        return `${recipientType}-${match.id}@development.local`;
      }
    }

    // In production without proper email, throw error rather than send to wrong address
    throw new Error(`Cannot send email: No email address found for ${recipientType} in match ${match.id}`);
  }

  /**
   * Escape HTML special characters to prevent XSS in email templates
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
  }

  // ==================== HTML EMAIL TEMPLATES ====================

  /**
   * Render new message email template (HTML)
   * All user-provided data is escaped to prevent XSS
   */
  private renderNewMessageTemplate(data: NewMessageEmailData): string {
    // Escape all user-provided content to prevent XSS
    const safeRecipientName = this.escapeHtml(data.recipientName);
    const safeSenderName = this.escapeHtml(data.senderName);
    const safePropertyAddress = this.escapeHtml(data.propertyAddress);
    const safeMessagePreview = this.escapeHtml(data.messagePreview);
    const safeViewUrl = this.escapeHtml(data.viewUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💬 New Message</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeRecipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">You have a new message from <strong>${safeSenderName}</strong> regarding the property at:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Property:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600;">${safePropertyAddress}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Message Preview:</p>
      <p style="margin: 0; font-size: 14px; color: #333;">${safeMessagePreview}</p>
    </div>

    <div style="text-align: center;">
      <a href="${safeViewUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Message</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      GetOn - Making Renting Better<br>
      You're receiving this because messages are automatically emailed for visibility.<br>
      <a href="[unsubscribe]" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render new issue email template (HTML)
   * All user-provided data is escaped to prevent XSS
   */
  private renderNewIssueTemplate(data: NewIssueEmailData): string {
    // Escape all user-provided content to prevent XSS
    const safeRecipientName = this.escapeHtml(data.recipientName);
    const safeRenterName = this.escapeHtml(data.renterName);
    const safeIssueSubject = this.escapeHtml(data.issueSubject);
    const safeIssueCategory = this.escapeHtml(data.issueCategory);
    const safeIssuePriority = this.escapeHtml(data.issuePriority);
    const safeIssueDescription = this.escapeHtml(data.issueDescription);
    const safePropertyAddress = this.escapeHtml(data.propertyAddress);
    const safeViewUrl = this.escapeHtml(data.viewUrl);

    const priorityColors: Record<string, string> = {
      emergency: '#EF4444',
      urgent: '#F59E0B',
      routine: '#10B981',
      low: '#6B7280',
    };
    const priorityColor = priorityColors[data.issuePriority.toLowerCase()] || '#6B7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Issue Reported</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${priorityColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚨 New Issue Reported</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeRecipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;"><strong>${safeRenterName}</strong> has reported a new issue:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <span style="display: inline-block; background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${safeIssuePriority}</span>
        <span style="display: inline-block; background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">${safeIssueCategory}</span>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111;">${safeIssueSubject}</h2>
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">${safeIssueDescription}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor}; margin-bottom: 30px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Property:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600;">${safePropertyAddress}</p>
    </div>

    <div style="text-align: center;">
      <a href="${safeViewUrl}" style="display: inline-block; background: ${priorityColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Respond to Issue</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      GetOn Issue Management<br>
      Please respond according to your SLA commitments.<br>
      <a href="[unsubscribe]" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render issue status update template (HTML)
   * All user-provided data is escaped to prevent XSS
   */
  private renderIssueStatusUpdateTemplate(data: IssueStatusUpdateEmailData): string {
    // Escape all user-provided content to prevent XSS
    const safeRecipientName = this.escapeHtml(data.recipientName);
    const safeIssueSubject = this.escapeHtml(data.issueSubject);
    const safeOldStatus = this.escapeHtml(data.oldStatus);
    const safeNewStatus = this.escapeHtml(data.newStatus);
    const safeUpdateNotes = data.updateNotes ? this.escapeHtml(data.updateNotes) : '';
    const safeViewUrl = this.escapeHtml(data.viewUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Issue Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Issue Update</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeRecipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">There's an update on your issue:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px;">${safeIssueSubject}</h2>

      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <span style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-transform: capitalize;">${safeOldStatus}</span>
        <span style="font-size: 20px;">→</span>
        <span style="background: #dcfce7; color: #166534; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-transform: capitalize;">${safeNewStatus}</span>
      </div>

      ${safeUpdateNotes ? `<p style="margin: 15px 0 0 0; font-size: 14px; color: #666; padding: 15px; background: #f9fafb; border-radius: 6px;">${safeUpdateNotes}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${safeViewUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Issue Details</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      GetOn Issue Management<br>
      <a href="[unsubscribe]" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render SLA alert template (HTML)
   * All user-provided data is escaped to prevent XSS
   */
  private renderSLAAlertTemplate(data: SLAAlertEmailData): string {
    // Escape all user-provided content to prevent XSS
    const safeRecipientName = this.escapeHtml(data.recipientName);
    const safeIssueSubject = this.escapeHtml(data.issueSubject);
    const safeTimeRemaining = this.escapeHtml(data.timeRemaining);
    const safeViewUrl = this.escapeHtml(data.viewUrl);

    const alertColor = data.isBreached ? '#EF4444' : '#F59E0B';
    const alertIcon = data.isBreached ? '⚠️' : '⏰';
    const alertTitle = data.isBreached ? 'SLA BREACHED' : 'SLA Approaching';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SLA Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${alertColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${alertIcon} ${alertTitle}</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeRecipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${data.isBreached
        ? '<strong style="color: #dc2626;">URGENT:</strong> An issue has exceeded its SLA deadline.'
        : 'An issue is approaching its SLA deadline and requires your attention.'}
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border: 3px solid ${alertColor}; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px;">${safeIssueSubject}</h2>

      <div style="background: ${data.isBreached ? '#fef2f2' : '#fef3c7'}; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 5px;">SLA Deadline:</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${alertColor};">${data.slaDeadline.toLocaleString()}</p>
      </div>

      <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 5px;">${data.isBreached ? 'Overdue by:' : 'Time remaining:'}</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${alertColor};">${safeTimeRemaining}</p>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${safeViewUrl}" style="display: inline-block; background: ${alertColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Take Action Now</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      GetOn SLA Monitoring<br>
      ${data.isBreached ? 'Immediate action required to maintain service standards.' : 'Please respond within the SLA timeframe.'}<br>
      <a href="[unsubscribe]" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  // ==================== PLAIN TEXT EMAIL TEMPLATES ====================

  private renderNewMessageTemplateText(data: NewMessageEmailData): string {
    return `
New Message

Hi ${data.recipientName},

You have a new message from ${data.senderName} regarding the property at:

Property: ${data.propertyAddress}

Message Preview:
${data.messagePreview}

View full message: ${data.viewUrl}

---
GetOn - Making Renting Better
You're receiving this because messages are automatically emailed for visibility.
To unsubscribe, visit: [unsubscribe]
    `.trim();
  }

  private renderNewIssueTemplateText(data: NewIssueEmailData): string {
    return `
New Issue Reported

Hi ${data.recipientName},

${data.renterName} has reported a new issue:

Priority: ${data.issuePriority}
Category: ${data.issueCategory}
Subject: ${data.issueSubject}

Description:
${data.issueDescription}

Property: ${data.propertyAddress}

View and respond: ${data.viewUrl}

---
GetOn Issue Management
Please respond according to your SLA commitments.
To unsubscribe, visit: [unsubscribe]
    `.trim();
  }

  private renderIssueStatusUpdateTemplateText(data: IssueStatusUpdateEmailData): string {
    return `
Issue Update

Hi ${data.recipientName},

There's an update on your issue:

Subject: ${data.issueSubject}
Status: ${data.oldStatus} → ${data.newStatus}

${data.updateNotes ? `Notes: ${data.updateNotes}` : ''}

View issue details: ${data.viewUrl}

---
GetOn Issue Management
To unsubscribe, visit: [unsubscribe]
    `.trim();
  }

  private renderSLAAlertTemplateText(data: SLAAlertEmailData): string {
    return `
${data.isBreached ? 'SLA BREACHED' : 'SLA Approaching'}

Hi ${data.recipientName},

${data.isBreached
        ? 'URGENT: An issue has exceeded its SLA deadline.'
        : 'An issue is approaching its SLA deadline and requires your attention.'}

Subject: ${data.issueSubject}
SLA Deadline: ${data.slaDeadline.toLocaleString()}
${data.isBreached ? 'Overdue by:' : 'Time remaining:'} ${data.timeRemaining}

Take action now: ${data.viewUrl}

---
GetOn SLA Monitoring
${data.isBreached ? 'Immediate action required to maintain service standards.' : 'Please respond within the SLA timeframe.'}
To unsubscribe, visit: [unsubscribe]
    `.trim();
  }
}

/**
 * Create a default EmailService instance
 * Configuration from environment variables
 */
export function createEmailService(config?: Partial<EmailConfig>): EmailService {
  const defaultConfig: EmailConfig = {
    provider: (import.meta.env.VITE_EMAIL_PROVIDER as EmailConfig['provider']) || 'mock',
    apiKey: import.meta.env.VITE_EMAIL_API_KEY,
    fromEmail: import.meta.env.VITE_EMAIL_FROM || 'noreply@geton.app',
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'GetOn',
    isDevelopment: import.meta.env.DEV || false,
    ...config,
  };

  return new EmailService(defaultConfig);
}

// Export singleton instance
export const emailService = createEmailService();
