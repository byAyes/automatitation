import type { SendResult } from './gmail';
import { sendEmail as sendGmailEmail } from './gmail';
import { SendGridProvider } from './providers/sendgrid';
import { SMTPProvider } from './providers/smtp';
import { ResendProvider } from './providers/resend';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail';

const sendGridProvider = process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL 
  ? new SendGridProvider({
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    })
  : null;

const smtpProvider = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? new SMTPProvider({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    })
  : null;

const resendProvider = process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
  ? new ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    })
  : null;

/**
 * Send email using configured provider
 * Falls back to Gmail if specific provider is not configured
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  from?: string
): Promise<SendResult> {
  try {
    switch (EMAIL_PROVIDER) {
      case 'sendgrid':
        if (!sendGridProvider) {
          throw new Error('SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL');
        }
        return await sendGridProvider.sendEmail(to, subject, body, from);

      case 'smtp':
        if (!smtpProvider) {
          throw new Error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
        }
        return await smtpProvider.sendEmail(to, subject, body, from);

      case 'resend':
        if (!resendProvider) {
          throw new Error('Resend not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL');
        }
        return await resendProvider.sendEmail(to, subject, body, from);

      case 'gmail':
      default:
        return await sendGmailEmail(to, subject, body, from);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
