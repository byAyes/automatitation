import { Job, ScraperConfig, ScraperResult } from '../types';
import { PuppeteerScraper } from './puppeteerScraper';

/**
 * Glassdoor.com job scraper
 * Uses Puppeteer with stealth for headless Chrome automation
 * Glassdoor has heavy JavaScript rendering and may require login
 */
export class GlassdoorScraper extends PuppeteerScraper {
  private readonly baseUrl = 'https://www.glassdoor.com';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Build Glassdoor job search URL
   * @param config - Scraper configuration
   * @returns Encoded search URL
   */
  protected buildUrl(config: ScraperConfig): string {
    const query = encodeURIComponent(config.query || '');
    return `${this.baseUrl}/Job/jobs.htm?sc.keyword=${query}`;
  }

  /**
   * Wait for job listings to appear
   * Glassdoor-specific selectors
   * @param page - Puppeteer page
   */
  protected async waitForJobs(page: any): Promise<void> {
    try {
      // Wait for job listing cards - Glassdoor uses multiple possible selectors
      await Promise.race([
        page.waitForSelector('[data-test="jobListing"]', { timeout: 10000 }),
        page.waitForSelector('.job-listing', { timeout: 10000 }),
        page.waitForSelector('[data-tn-element="jobCard"]', { timeout: 10000 }),
      ]);
      (this as any).logger.info('Job listings found on Glassdoor');
    } catch (error) {
      (this as any).logger.warn('Job selector timeout - Glassdoor may have login wall or anti-bot measures');
      // Don't throw - allow extraction to attempt anyway
    }
  }

  /**
   * Extract job data from the page
   * Glassdoor-specific extraction logic
   * @param page - Puppeteer page
   * @returns Array of extracted jobs
   */
  protected async extractJobs(page: any): Promise<Job[]> {
    return await page.evaluate((): Job[] => {
      const jobs: Job[] = [];

      // Try multiple selector strategies for Glassdoor
      const jobSelectors = [
        '[data-test="jobListing"]',
        '.job-listing',
        '[data-tn-element="jobCard"]',
        '.jobCard',
      ];

      let jobElements: Element[] = [];
      for (const selector of jobSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          jobElements = Array.from(elements);
          break;
        }
      }

      jobElements.forEach((el: Element) => {
        try {
          const titleEl = el.querySelector('[data-test="jobTitle"]') ||
            el.querySelector('.jobTitle') ||
            el.querySelector('h2 a');
          const companyEl = el.querySelector('[data-test="companyName"]') ||
            el.querySelector('.companyName') ||
            el.querySelector('[data-tn-element="companyName"]');
          const locationEl = el.querySelector('[data-test="location"]') ||
            el.querySelector('.location') ||
            el.querySelector('[data-tn-element="location"]');
          const linkEl = el.querySelector('a[href*="/Job/"]') || el.querySelector('a');

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const link = linkEl?.getAttribute('href') || '';

          // Skip if essential fields are missing
          if (!title || !company) return;

          jobs.push({
            id: '',
            title,
            company,
            location,
            link: link.startsWith('http') ? link : `https://www.glassdoor.com${link}`,
            description: '',
            source: 'glassdoor',
            scrapedAt: new Date(),
          });
        } catch (error) {
          console.warn('Error parsing Glassdoor job card:', error);
        }
      });

      return jobs;
    });
  }
}
