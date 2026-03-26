import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../../lib/email/gmail';

/**
 * POST handler - Send an email
 * Accepts { to, subject, body } in request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const result = await sendEmail(to, subject, emailBody);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email send endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Test email endpoint
 * Sends a test email to the configured GMAIL_RECIPIENT address
 */
export async function GET() {
  const testEmail = process.env.GMAIL_RECIPIENT;

  if (!testEmail) {
    return NextResponse.json(
      { error: 'GMAIL_RECIPIENT not configured in environment variables' },
      { status: 500 }
    );
  }

  const result = await sendEmail(
    testEmail,
    'Test Email from Job Email Automation',
    'This is a test email sent from the Job Email Automation system.\n\nIf you received this, the Gmail API integration is working correctly!\n\nTimestamp: ' + new Date().toISOString()
  );

  if (result.success) {
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email sent to ${testEmail}`,
    });
  } else {
    return NextResponse.json(
      { error: result.error || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
