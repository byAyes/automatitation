import { Job, ScraperConfig, ScraperResult } from '../types';
import { HttpScraper } from './httpScraper';

/**
 * Indeed.com job scraper
 * Uses HTTP requests with Cheerio for HTML parsing
 */
export class IndeedScraper extends HttpScraper {
  private readonly baseUrl = 'https://indeed.com';

  constructor(config: ScraperConfig) {
    super(config, 'IndeedScraper');
  }

  /**
   * Scrape job listings from Indeed.com
   * @param config - Scraper configuration
   * @returns Promise resolving to scraper result with jobs
   */
  async scrape(config: ScraperConfig): Promise<ScraperResult> {
    try {
      const url = this.buildUrl(config);
      this.logger.info(`Scraping Indeed with query: ${config.query}`);

      const html = await this.fetchHtml(url);
      const $ = this.parseHtml(html);
      const jobs: Job[] = [];

      // Indeed job card selector
      const jobCards = $('.jobsearch-List-item');

      this.logger.info(`Found ${jobCards.length} job cards`);

      jobCards.each((_, element) => {
        try {
          const title = $(element).find('h2 a span').first().text().trim();
          const company = $(element).find('[data-testid="company-name"]').text().trim();
          const location = $(element).find('[data-testid="text-location"]').text().trim();
          const linkElem = $(element).find('h2 a');
          const link = linkElem.attr('href') || '';
          const description = $(element).find('.job-snippet').first().text().trim();

          // Normalize the URL
          const fullLink = link ? this.normalizeUrl(link, this.baseUrl) : '';

          const job: Partial<Job> = {
            title,
            company,
            location,
            link: fullLink,
            description,
            source: 'indeed',
          };

          if (this.validateJob(job)) {
            jobs.push(this.createJob(job));
          }
        } catch (error) {
          this.logger.warn(`Error parsing job card: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      });

      this.logger.info(`Successfully extracted ${jobs.length} jobs from Indeed`);

      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Indeed scraping failed: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Build Indeed search URL
   * @param config - Scraper configuration
   * @returns Encoded search URL
   */
  private buildUrl(config: ScraperConfig): string {
    const query = encodeURIComponent(config.query || '');
    return `${this.baseUrl}/jobs?q=${query}&sort=date`;
  }
}
