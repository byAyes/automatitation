import type { SendResult } from '../gmail';
import { logger } from '../../automation/logger';

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

interface ResendResponse {
  id: string;
  message?: string;
}

class NetworkUtil {
  static async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    timeout: number = 30000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

export class ResendProvider {
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    from?: string,
    html?: string,
    cc?: string | string[]
  ): Promise<SendResult> {
    logger.info('sendEmail: Sending email', { to, cc, subject, from: from || this.config.fromEmail });

    try {
      const payload: Record<string, any> = {
        from: from || this.config.fromEmail,
        to,
        subject,
        text: body,
      };

      // Include HTML version if provided
      if (html) {
        payload.html = html;
      }

      // Include CC recipients if provided
      if (cc) {
        payload.cc = Array.isArray(cc) ? cc : [cc];
      }

      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        3, // maxRetries
        30000 // 30 second timeout
      );

      if (response.ok) {
        const data: ResendResponse = await response.json();
        logger.info('sendEmail: Successfully sent', { messageId: data.id });
        logger.success('sendEmail: Successfully sent', { messageId: data.id });
        return {
          success: true,
          messageId: data.id,
        };
      } else {
        const error = await response.json();
        const errorMessage = error.message || `Resend error: ${response.status}`;
        logger.error('sendEmail: API error', { status: response.status, error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      logger.error('sendEmail: Network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export class ResendDomainManager {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listDomains(): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/domains',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
        3,
        30000
      );

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      } else {
        throw new Error(`Failed to list domains: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async addDomain(name: string): Promise<{ id: string; name: string; status: string; records: Array<{ type: string; host: string; value: string; priority?: number }> }> {
    try {
      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/domains',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        },
        3,
        30000
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          name: data.name,
          status: data.status,
          records: data.records || [],
        };
      } else {
        const error = await response.json();
        throw new Error(error.message || `Failed to add domain: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyDomain(domainId: string): Promise<{ id: string; status: string }> {
    try {
      const response = await NetworkUtil.fetchWithRetry(
        `https://api.resend.com/domains/${domainId}/verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
        3,
        30000
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          status: data.status,
        };
      } else {
        const error = await response.json();
        throw new Error(error.message || `Failed to verify domain: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }
}
