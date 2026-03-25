import { Job, ScraperConfig, ScraperResult } from '../types';

/**
 * Logger utility for consistent logging across scrapers
 */
class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(message: string): void {
    console.log(`[${this.prefix}] INFO: ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.prefix}] ERROR: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.prefix}] WARN: ${message}`);
  }
}

/**
 * Abstract base class for all job scrapers
 * Provides common validation, normalization, and logging functionality
 */
export abstract class BaseScraper {
  protected logger: Logger;
  protected config: ScraperConfig;

  constructor(config: ScraperConfig, source: string) {
    this.config = config;
    this.logger = new Logger(source);
  }

  /**
   * Abstract method that subclasses must implement
   * @param config - Scraper configuration
   * @returns Promise resolving to scraper result
   */
  abstract scrape(config: ScraperConfig): Promise<ScraperResult>;

  /**
   * Validate that a job has all required fields
   * @param job - Partial job object to validate
   * @returns true if job is valid
   */
  protected validateJob(job: Partial<Job>): boolean {
    const required = ['title', 'company', 'location', 'link', 'description', 'source'];
    for (const field of required) {
      if (!job[field as keyof Job]) {
        this.logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Normalize job data to standard format
   * @param job - Raw job data
   * @returns Normalized job object
   */
  protected normalizeJob(job: Partial<Job>): Job {
    return {
      id: job.id || this.generateId(job.link || ''),
      title: job.title?.trim() || '',
      company: job.company?.trim() || '',
      location: job.location?.trim() || '',
      link: job.link?.trim() || '',
      description: job.description?.trim() || '',
      source: job.source || 'unknown',
      scrapedAt: job.scrapedAt || new Date(),
    };
  }

  /**
   * Generate a unique ID for a job based on its link
   * @param link - Job link URL
   * @returns Unique identifier string
   */
  protected generateId(link: string): string {
    const hash = Buffer.from(link).toString('base64').slice(0, 12);
    return `job-${hash}`;
  }
}
