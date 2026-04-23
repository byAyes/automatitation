import type { SendResult } from '../gmail';

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

interface ResendResponse {
  id: string;
}

export class ResendProvider {
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  async sendEmail(to: string, subject: string, body: string, from?: string): Promise<SendResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || this.config.fromEmail,
          to,
          subject,
          text: body,
        }),
      });

      if (response.ok) {
        const data: ResendResponse = await response.json();
        return {
          success: true,
          messageId: data.id,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || `Resend error: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
