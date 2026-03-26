import { Job, ScraperConfig, ScraperResult } from '../types';
import { PuppeteerScraper } from './puppeteerScraper';

/**
 * LinkedIn.com job scraper
 * Uses Puppeteer with stealth to scrape LinkedIn job listings
 * Note: LinkedIn has aggressive anti-bot measures; use responsibly
 */
export class LinkedInScraper extends PuppeteerScraper {
  private baseUrl = 'https://www.linkedin.com';

  constructor(config: ScraperConfig) {
    super(config);
    this.logger = new (this as any).Logger('LinkedInScraper');
  }

  /**
   * Build LinkedIn job search URL
   * @param config - Scraper configuration
   * @returns LinkedIn job search URL
   */
  protected buildUrl(config: ScraperConfig): string {
    const query = encodeURIComponent(config.query);
    return `${this.baseUrl}/jobs/search/?keywords=${query}`;
  }

  /**
   * Wait for LinkedIn job listings to load
   * Uses specific LinkedIn selectors with timeout
   * @param page - Puppeteer page
   */
  protected async waitForJobs(page: any): Promise<void> {
    try {
      // Wait for job card items to appear
      await page.waitForSelector('.job-card-list__item', { timeout: 15000 });
      this.logger.info('Job listings found');
    } catch (error) {
      this.logger.warn('Job selector timeout - may need manual interaction or login');
      throw new Error('Failed to load LinkedIn job listings');
    }
  }

  /**
   * Extract job data from LinkedIn page
   * Extracts: title, company, location, link
   * @param page - Puppeteer page
   * @returns Array of extracted jobs
   */
  protected async extractJobs(page: any): Promise<Job[]> {
    const jobs = await page.evaluate((): Job[] => {
      const jobElements = document.querySelectorAll('.job-card-list__item');
      const results: Job[] = [];

      jobElements.forEach((el: any) => {
        try {
          const titleEl = el.querySelector('.job-card-list__title');
          const companyEl = el.querySelector('.job-card-container__company-name');
          const locationEl = el.querySelector('.job-card-container__metadata');

          if (!titleEl || !companyEl) return;

          const title = titleEl.textContent?.trim() || '';
          const company = companyEl.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const link = (titleEl as any).href || '';

          // Skip if essential fields are missing
          if (!title || !company) return;

          results.push({
            id: '',
            title,
            company,
            location,
            link,
            description: '',
            source: 'linkedin',
            scrapedAt: new Date(),
          });
        } catch (e) {
          // Skip individual job extraction errors
        }
      });

      return results;
    });

    // Generate IDs for jobs that don't have them
    return jobs.map((job: Job) => ({
      ...job,
      id: this.generateId(job.link),
    }));
  }

  /**
   * Override scrape to add LinkedIn-specific handling
   * @param config - Scraper configuration
   * @returns Promise resolving to scraper result with jobs
   */
  async scrape(config: ScraperConfig): Promise<ScraperResult> {
    this.logger.info(`Searching LinkedIn for: ${config.query}`);

    try {
      const result = await super.scrape(config);

      if (result.success && result.data) {
        this.logger.info(`Successfully extracted ${result.data.length} jobs from LinkedIn`);

        // Apply maxJobs limit if specified
        if (config.maxJobs && config.maxJobs > 0) {
          result.data = result.data.slice(0, config.maxJobs);
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`LinkedIn scraping failed: ${errorMessage}`);
      return {
        success: false,
        error: `LinkedIn scraper error: ${errorMessage}`,
      };
    }
  }
}
