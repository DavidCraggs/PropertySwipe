/**
 * Phase 8: Email Notification Service
 * Handles sending email notifications for messages and issues
 * Supports SendGrid, AWS SES, or Resend API integration
 *
 * Per user requirements: Messages "go via an internal message system but also
 * get emailed out as well for visibility"
 */

import type { EmailNotification, EmailNotificationType, Issue, Match } from '../types';

/**
 * Email service configuration
 * In production, these would come from environment variables
 */
interface EmailConfig {
  provider: 'sendgrid' | 'aws-ses' | 'resend' | 'mock';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
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
 * EmailService class - handles all email notifications
 */
export class EmailService {
  private config: EmailConfig;
  private notificationQueue: EmailNotification[] = [];

  constructor(config: EmailConfig) {
    this.config = config;
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
   * In production, this would integrate with actual email provider
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

    // In production, send via email provider
    if (this.config.provider === 'mock') {
      // Mock implementation - log to console
      console.log('[EmailService] Mock email queued:', {
        to: params.recipientEmail,
        subject: params.subject,
        type: params.type,
      });

      // Simulate successful send
      notification.status = 'sent';
      notification.sentAt = new Date();
    } else {
      // Real implementation would call email provider API here
      await this.sendViaProvider(notification);
    }

    return notification;
  }

  /**
   * Send email via configured provider (SendGrid/AWS SES/Resend)
   * Placeholder for actual integration
   */
  private async sendViaProvider(notification: EmailNotification): Promise<void> {
    // TODO: Integrate with actual email provider
    // Example for SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.config.apiKey);
    // await sgMail.send({
    //   to: notification.recipientEmail,
    //   from: { email: this.config.fromEmail, name: this.config.fromName },
    //   subject: notification.subject,
    //   html: notification.bodyHtml,
    //   text: notification.bodyText,
    // });

    console.log(`[EmailService] Would send email via ${this.config.provider}:`, {
      to: notification.recipientEmail,
      subject: notification.subject,
    });

    notification.status = 'sent';
    notification.sentAt = new Date();
  }

  /**
   * Get recipient email from match based on recipient type
   */
  private getRecipientEmail(_match: Match, recipientType: 'renter' | 'landlord' | 'agency'): string {
    // TODO: Fetch actual email from user profiles
    // For now, return placeholder
    return `${recipientType}@example.com`;
  }

  // ==================== HTML EMAIL TEMPLATES ====================

  /**
   * Render new message email template (HTML)
   */
  private renderNewMessageTemplate(data: NewMessageEmailData): string {
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
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">You have a new message from <strong>${data.senderName}</strong> regarding the property at:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Property:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600;">${data.propertyAddress}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Message Preview:</p>
      <p style="margin: 0; font-size: 14px; color: #333;">${data.messagePreview}</p>
    </div>

    <div style="text-align: center;">
      <a href="${data.viewUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Message</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      PropertySwipe - Making Renting Better<br>
      You're receiving this because messages are automatically emailed for visibility.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render new issue email template (HTML)
   */
  private renderNewIssueTemplate(data: NewIssueEmailData): string {
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
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;"><strong>${data.renterName}</strong> has reported a new issue:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <span style="display: inline-block; background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${data.issuePriority}</span>
        <span style="display: inline-block; background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">${data.issueCategory}</span>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111;">${data.issueSubject}</h2>
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">${data.issueDescription}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor}; margin-bottom: 30px;">
      <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 8px;">Property:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600;">${data.propertyAddress}</p>
    </div>

    <div style="text-align: center;">
      <a href="${data.viewUrl}" style="display: inline-block; background: ${priorityColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Respond to Issue</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      PropertySwipe Issue Management<br>
      Please respond according to your SLA commitments.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render issue status update template (HTML)
   */
  private renderIssueStatusUpdateTemplate(data: IssueStatusUpdateEmailData): string {
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
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">There's an update on your issue:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px;">${data.issueSubject}</h2>

      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <span style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-transform: capitalize;">${data.oldStatus}</span>
        <span style="font-size: 20px;">→</span>
        <span style="background: #dcfce7; color: #166534; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-transform: capitalize;">${data.newStatus}</span>
      </div>

      ${data.updateNotes ? `<p style="margin: 15px 0 0 0; font-size: 14px; color: #666; padding: 15px; background: #f9fafb; border-radius: 6px;">${data.updateNotes}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${data.viewUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Issue Details</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      PropertySwipe Issue Management
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Render SLA alert template (HTML)
   */
  private renderSLAAlertTemplate(data: SLAAlertEmailData): string {
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
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${data.isBreached
        ? '<strong style="color: #dc2626;">URGENT:</strong> An issue has exceeded its SLA deadline.'
        : 'An issue is approaching its SLA deadline and requires your attention.'}
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border: 3px solid ${alertColor}; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px;">${data.issueSubject}</h2>

      <div style="background: ${data.isBreached ? '#fef2f2' : '#fef3c7'}; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 5px;">SLA Deadline:</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${alertColor};">${data.slaDeadline.toLocaleString()}</p>
      </div>

      <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 5px;">${data.isBreached ? 'Overdue by:' : 'Time remaining:'}</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${alertColor};">${data.timeRemaining}</p>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${data.viewUrl}" style="display: inline-block; background: ${alertColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Take Action Now</a>
    </div>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
      PropertySwipe SLA Monitoring<br>
      ${data.isBreached ? 'Immediate action required to maintain service standards.' : 'Please respond within the SLA timeframe.'}
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
PropertySwipe - Making Renting Better
You're receiving this because messages are automatically emailed for visibility.
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
PropertySwipe Issue Management
Please respond according to your SLA commitments.
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
PropertySwipe Issue Management
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
PropertySwipe SLA Monitoring
${data.isBreached ? 'Immediate action required to maintain service standards.' : 'Please respond within the SLA timeframe.'}
    `.trim();
  }
}

/**
 * Create a default EmailService instance
 * Uses mock provider for development
 */
export function createEmailService(config?: Partial<EmailConfig>): EmailService {
  const defaultConfig: EmailConfig = {
    provider: 'mock',
    fromEmail: 'noreply@propertyswipe.com',
    fromName: 'PropertySwipe',
    ...config,
  };

  return new EmailService(defaultConfig);
}

// Export singleton instance
export const emailService = createEmailService();
