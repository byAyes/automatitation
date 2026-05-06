import type { SendResult } from '../gmail';

// Debug logger for API calls
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[ResendProvider] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ResendProvider] ${message}`, error || '');
  }
};

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

interface ResendResponse {
  id: string;
}

interface ResendDomain {
  readonly id: string;
  readonly name: string;
  readonly status: 'pending' | 'verified';
  readonly created_at: string;
  readonly dns_records?: {
    readonly spf?: {
      readonly name: string;
      readonly value: string;
    };
    readonly dkim?: {
      readonly name: string;
      readonly value: string;
    };
  };
}

interface CreateDomainRequest {
  readonly name: string;
  readonly customReturnPath?: string;
}

// Rate limiter configuration
class RateLimiter {
  private tokensPerMinute: number;
  private lastRefill: number;
  private tokens: number;

  constructor(tokensPerMinute: number) {
    this.tokensPerMinute = tokensPerMinute;
    this.lastRefill = Date.now();
    this.tokens = tokensPerMinute;
  }

  async removeTokens(count: number): Promise<void> {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return;
    }

    // Wait for tokens to refill
    const waitTime = ((count - this.tokens) / this.tokensPerMinute) * 60 * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = Math.max(0, this.tokens - count);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000 / 60; // minutes
    const newTokens = Math.floor(timePassed * this.tokensPerMinute);
    this.tokens = Math.min(this.tokensPerMinute, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// Network utilities
class NetworkUtil {
  private static limiter = new RateLimiter(10); // 10 requests per minute

  static async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    timeoutMs: number = 30000
  ): Promise<Response> {
    await this.limiter.removeTokens(1);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, { ...options, signal: controller.signal });

        clearTimeout(timeout);
        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(`Failed after ${maxRetries} attempts`, error);
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        logger.debug(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// Domain name validator
const DomainValidator = {
  validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Domain name is required' };
    }

    // Basic domain validation
    // Must start/end with alphanumeric, contain only letters/numbers/hyphens/dots
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

    if (!domainRegex.test(name)) {
      return {
        valid: false,
        error: 'Invalid domain format. Must be a valid domain (e.g., updates.example.com)'
      };
    }

    // Max length check (Resend limit: 253 chars per domain)
    if (name.length > 253) {
      return { valid: false, error: 'Domain name exceeds maximum length of 253 characters' };
    }

    return { valid: true };
  },

  validateCustomReturnPath(path: string | undefined): { valid: boolean; error?: string } {
    if (!path) return { valid: true };

    // Must be ≤63 characters
    if (path.length > 63) {
      return { valid: false, error: 'Custom return path must be ≤63 characters' };
    }

    // Must start/end with alphanumeric, contain only letters/numbers/hyphens
    const pathRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;

    if (!pathRegex.test(path)) {
      return {
        valid: false,
        error: 'Invalid custom return path. Must start/end with alphanumeric, contain only letters/numbers/hyphens'
      };
    }

    return { valid: true };
  }
};

export class ResendProvider {
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  async sendEmail(to: string, subject: string, body: string, from?: string): Promise<SendResult> {
    logger.debug('sendEmail: Sending email', { to, subject, from: from || this.config.fromEmail });

    try {
      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/emails',
        {
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
        },
        3, // maxRetries
        30000 // 30 second timeout
      );

      if (response.ok) {
        const data: ResendResponse = await response.json();
        logger.debug('sendEmail: Successfully sent', { messageId: data.id });
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

  async createDomain(domain: CreateDomainRequest): Promise<{ success: boolean; domain?: ResendDomain; error?: string }> {
    logger.debug('createDomain: Creating domain', { domain: domain.name });

    // Validate domain name
    const domainValidation = DomainValidator.validateName(domain.name);
    if (!domainValidation.valid) {
      logger.error('createDomain: Domain validation failed', { error: domainValidation.error });
      return {
        success: false,
        error: domainValidation.error || 'Invalid domain name',
      };
    }

    // Validate custom return path if provided
    if (domain.customReturnPath) {
      const pathValidation = DomainValidator.validateCustomReturnPath(domain.customReturnPath);
      if (!pathValidation.valid) {
        logger.error('createDomain: Return path validation failed', { error: pathValidation.error });
        return {
          success: false,
          error: pathValidation.error || 'Invalid return path',
        };
      }
    }

    try {
      logger.debug('createDomain: Sending API request');
      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/domains',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(domain),
        },
        3, // maxRetries
        30000 // 30 second timeout
      );

      if (response.ok) {
        const data: ResendDomain = await response.json();
        logger.debug('createDomain: Successfully created', { domainId: data.id });
        return {
          success: true,
          domain: data,
        };
      } else {
        const error = await response.json();

        // Enhanced error handling for specific status codes
        if (response.status === 400) {
          logger.error('createDomain: Bad request (400)', { domain: domain.name });
          return {
            success: false,
            error: error.message || 'Invalid domain name format',
          };
        }

        if (response.status === 403) {
          logger.error('createDomain: Forbidden (403) - Invalid API key');
          return {
            success: false,
            error: 'Invalid API key. Please check RESEND_API_KEY.',
          };
        }

        if (response.status === 422) {
          logger.error('createDomain: Unprocessable entity (422)', { domain: domain.name });
          return {
            success: false,
            error: error.message || 'Domain already exists or invalid format',
          };
        }

        const errorMessage = error.message || `Resend error: ${response.status}`;
        logger.error('createDomain: API error', { status: response.status, error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      logger.error('createDomain: Network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listDomains(): Promise<{ success: boolean; domains?: ResendDomain[]; error?: string }> {
    logger.debug('listDomains: Fetching domains list');

    try {
      const response = await NetworkUtil.fetchWithRetry(
        'https://api.resend.com/domains',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        },
        2, // Fewer retries for GET requests
        20000 // 20 second timeout
      );

      if (response.ok) {
        const data = await response.json();
        const domains = Array.isArray(data) ? data : [];
        logger.debug('listDomains: Successfully fetched', { count: domains.length });
        return {
          success: true,
          domains,
        };
      } else {
        const error = await response.json();

        // Enhanced error handling for specific status codes
        if (response.status === 401) {
          logger.error('listDomains: Unauthorized (401) - Invalid API key');
          return {
            success: false,
            error: 'Invalid API key. Please check RESEND_API_KEY.',
          };
        }

        if (response.status === 403) {
          logger.error('listDomains: Forbidden (403) - Insufficient permissions');
          return {
            success: false,
            error: 'Insufficient permissions to list domains',
          };
        }

        const errorMessage = error.message || `Resend error: ${response.status}`;
        logger.error('listDomains: API error', { status: response.status, error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      logger.error('listDomains: Network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDomain(domainId: string): Promise<{ success: boolean; domain?: ResendDomain; error?: string }> {
    logger.debug('getDomain: Fetching domain', { domainId });

    try {
      const response = await NetworkUtil.fetchWithRetry(
        `https://api.resend.com/domains/${encodeURIComponent(domainId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        },
        2, // Fewer retries for GET requests
        20000 // 20 second timeout
      );

      if (response.ok) {
        const data: ResendDomain = await response.json();
        logger.debug('getDomain: Successfully fetched domain', { status: data.status });
        return {
          success: true,
          domain: data,
        };
      } else {
        const error = await response.json();

        // Enhanced error handling for specific status codes
        if (response.status === 400) {
          logger.error('getDomain: Bad request (400) - Invalid domain ID');
          return {
            success: false,
            error: 'Invalid domain ID format. Domain ID must be a valid UUID.',
          };
        }

        if (response.status === 401) {
          logger.error('getDomain: Unauthorized (401) - Invalid API key');
          return {
            success: false,
            error: 'Invalid API key. Please check RESEND_API_KEY.',
          };
        }

        if (response.status === 404) {
          logger.error('getDomain: Not found (404) - Domain does not exist', { domainId });
          return {
            success: false,
            error: 'Domain not found. Please check the domain ID and try again.',
          };
        }

        const errorMessage = error.message || `Resend error: ${response.status}`;
        logger.error('getDomain: API error', { status: response.status, error: errorMessage });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      logger.error('getDomain: Network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
