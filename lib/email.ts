import { Resend } from 'resend';

// Lazy initialization of Resend to avoid errors during build
let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Escapes HTML special characters to prevent XSS attacks in email templates.
 * This should be used for all user-provided content inserted into HTML emails.
 */
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

// Default sender email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'SportsMatch Tokyo <noreply@sportsmatch.tokyo>';

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, html, from = DEFAULT_FROM } = options;

    const client = getResendClient();
    const result = await client.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(to: string, userName: string) {
  const subject = 'Welcome to SportsMatch Tokyo!';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SportsMatch Tokyo!</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(userName)},</p>

            <p>Thank you for joining SportsMatch Tokyo! We're excited to have you as part of our sports community.</p>

            <p>With SportsMatch, you can:</p>
            <ul>
              <li>Browse and join sports sessions across Tokyo</li>
              <li>Create your own sessions and invite others</li>
              <li>Connect with players of similar skill levels</li>
              <li>Chat with session participants</li>
            </ul>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://webresevation-gbvm9a1l4-heinaungtestings-projects.vercel.app'}/sessions" class="button">Browse Sessions</a>
            </p>

            <p>If you have any questions, feel free to reach out to our support team.</p>

            <p>Let's play!</p>
            <p><strong>The SportsMatch Tokyo Team</strong></p>
          </div>
          <div class="footer">
            <p>SportsMatch Tokyo - Find Your Sports Partner in Tokyo</p>
            <p>This email was sent to ${escapeHtml(Array.isArray(to) ? to[0] : to)}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send session reminder email (24 hours before session)
 */
export async function sendSessionReminderEmail(
  to: string,
  userName: string,
  sessionDetails: {
    sportType: string;
    sportCenter: string;
    dateTime: string;
    address: string;
  }
) {
  const subject = `Reminder: ${sessionDetails.sportType} session tomorrow`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .session-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .session-info h3 { margin-top: 0; color: #1f2937; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { font-weight: 600; min-width: 120px; color: #4b5563; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Session Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(userName)},</p>

            <p>This is a friendly reminder that you have a ${escapeHtml(sessionDetails.sportType)} session coming up tomorrow!</p>

            <div class="session-info">
              <h3>Session Details</h3>
              <div class="info-row">
                <span class="info-label">Sport:</span>
                <span>${escapeHtml(sessionDetails.sportType)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span>${escapeHtml(sessionDetails.sportCenter)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span>${escapeHtml(sessionDetails.address)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time:</span>
                <span>${escapeHtml(sessionDetails.dateTime)}</span>
              </div>
            </div>

            <p><strong>Things to remember:</strong></p>
            <ul>
              <li>Arrive on time</li>
              <li>Bring your own equipment</li>
              <li>Be respectful to all players</li>
            </ul>

            <p>Looking forward to seeing you there!</p>

            <p><strong>The SportsMatch Tokyo Team</strong></p>
          </div>
          <div class="footer">
            <p>SportsMatch Tokyo - Find Your Sports Partner in Tokyo</p>
            <p>This email was sent to ${escapeHtml(Array.isArray(to) ? to[0] : to)}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send new message notification email
 */
export async function sendMessageNotificationEmail(
  to: string,
  userName: string,
  messageDetails: {
    senderName: string;
    messagePreview: string;
    conversationId: string;
  }
) {
  const subject = `New message from ${escapeHtml(messageDetails.senderName)}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .message-preview { background: #f9fafb; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; font-style: italic; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(userName)},</p>

            <p>You have a new message from <strong>${escapeHtml(messageDetails.senderName)}</strong>:</p>

            <div class="message-preview">
              ${escapeHtml(messageDetails.messagePreview)}
            </div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://webresevation-gbvm9a1l4-heinaungtestings-projects.vercel.app'}/messages/${messageDetails.conversationId}" class="button">View Message</a>
            </p>

            <p><strong>The SportsMatch Tokyo Team</strong></p>
          </div>
          <div class="footer">
            <p>SportsMatch Tokyo - Find Your Sports Partner in Tokyo</p>
            <p>This email was sent to ${escapeHtml(Array.isArray(to) ? to[0] : to)}</p>
            <p><a href="#">Unsubscribe from message notifications</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send session update notification email
 */
export async function sendSessionUpdateEmail(
  to: string,
  userName: string,
  updateDetails: {
    sportType: string;
    updateType: 'cancelled' | 'modified';
    sportCenter?: string;
    newDateTime?: string;
  }
) {
  const isCancelled = updateDetails.updateType === 'cancelled';
  const escapedSportType = escapeHtml(updateDetails.sportType);
  const subject = isCancelled
    ? `Session Cancelled: ${escapedSportType}`
    : `Session Updated: ${escapedSportType}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isCancelled ? '#ef4444' : '#f59e0b'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert { background: ${isCancelled ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${isCancelled ? '#fecaca' : '#fde68a'}; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isCancelled ? 'Session Cancelled' : 'Session Updated'}</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(userName)},</p>

            <div class="alert">
              <p><strong>${isCancelled ? 'Important:' : 'Update:'}</strong> ${
                isCancelled
                  ? `The ${escapedSportType} session you were planning to attend has been cancelled.`
                  : `The ${escapedSportType} session has been updated with new details.`
              }</p>
            </div>

            ${!isCancelled && updateDetails.newDateTime ? `
              <p><strong>New Date & Time:</strong> ${escapeHtml(updateDetails.newDateTime)}</p>
              ${updateDetails.sportCenter ? `<p><strong>Location:</strong> ${escapeHtml(updateDetails.sportCenter)}</p>` : ''}
            ` : ''}

            <p>${isCancelled ? 'We apologize for any inconvenience. Please check out other available sessions.' : 'Please make note of these changes.'}</p>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://webresevation-gbvm9a1l4-heinaungtestings-projects.vercel.app'}/sessions" class="button">Browse Sessions</a>
            </p>

            <p><strong>The SportsMatch Tokyo Team</strong></p>
          </div>
          <div class="footer">
            <p>SportsMatch Tokyo - Find Your Sports Partner in Tokyo</p>
            <p>This email was sent to ${escapeHtml(Array.isArray(to) ? to[0] : to)}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
