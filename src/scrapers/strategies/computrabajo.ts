import { Job, ScraperConfig, ScraperResult } from '../types';
import { PuppeteerScraper } from './puppeteerScraper';

/**
 * Computrabajo.com job scraper
 * Uses Puppeteer with stealth for headless Chrome automation
 * Popular in Latin America and Spain
 */
export class ComputrabajoScraper extends PuppeteerScraper {
  private readonly baseUrl = 'https://www.computrabajo.com';

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Build Computrabajo job search URL
   * @param config - Scraper configuration
   * @returns Encoded search URL
   */
  protected buildUrl(config: ScraperConfig): string {
    const query = encodeURIComponent(config.query || '');
    // Search for jobs from last 3 days
    return `${this.baseUrl}/td/ofertas?q=${query}&asignar=1&f_date=3`;
  }

  /**
   * Wait for job listings to appear
   * Computrabajo-specific selectors
   * @param page - Puppeteer page
   */
  protected async waitForJobs(page: any): Promise<void> {
    try {
      // Wait for job listing containers
      await Promise.race([
        page.waitForSelector('.offer-box', { timeout: 10000 }),
        page.waitForSelector('.oferta', { timeout: 10000 }),
        page.waitForSelector('[data-tn-element="jobCard"]', { timeout: 10000 }),
      ]);
      (this as any).logger.info('Job listings found on Computrabajo');
    } catch (error) {
      (this as any).logger.warn('Job selector timeout - Computrabajo may have anti-bot measures');
    }
  }

  /**
   * Extract job data from the page
   * Computrabajo-specific extraction logic
   * @param page - Puppeteer page
   * @returns Array of extracted jobs
   */
  protected async extractJobs(page: any): Promise<Job[]> {
    return await page.evaluate((): Job[] => {
      const jobs: Job[] = [];

      // Try multiple selector strategies
      const jobSelectors = [
        '.offer-box',
        '.oferta',
        '[data-tn-element="jobCard"]',
        '.job-card',
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
          const titleEl = el.querySelector('.offer-title a, .oferta-titulo a, h2 a');
          const companyEl = el.querySelector('.offer-company, .empresa, .company-name');
          const locationEl = el.querySelector('.offer-branch, .lugar, .location');
          const linkEl = el.querySelector('a[href*="/trabajo-"]') || el.querySelector('a');
          const dateEl = el.querySelector('.offer-date, .fecha, [data-date]');

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          const location = locationEl?.textContent?.trim() || '';
          const link = linkEl?.getAttribute('href') || '';
          const dateText = dateEl?.textContent?.trim() || '';

          // Skip if essential fields are missing
          if (!title || !company) return;

          // Normalize URL
          const fullLink = link?.startsWith('http') 
            ? link 
            : `https://www.computrabajo.com${link?.startsWith('/') ? link : '/' + link}`;

          jobs.push({
            id: '',
            title,
            company,
            location,
            link: fullLink,
            description: '',
            source: 'computrabajo',
            scrapedAt: new Date(),
          });
        } catch (error) {
          console.warn('Error parsing Computrabajo job card:', error);
        }
      });

      return jobs;
    });
  }
}
