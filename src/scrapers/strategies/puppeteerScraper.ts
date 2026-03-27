import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Job, ScraperConfig, ScraperResult } from '../types';
import { BaseScraper } from '../base/BaseScraper';

// Apply stealth plugin globally
puppeteer.use(StealthPlugin());

/**
 * Puppeteer-based scraper for JavaScript-heavy job boards
 * Uses headless Chrome with stealth to avoid detection
 */
export class PuppeteerScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config, 'PuppeteerScraper');
  }

  /**
   * Scrape jobs using Puppeteer with headless Chrome
   * @param config - Scraper configuration
   * @returns Promise resolving to scraper result with jobs
   */
async scrape(config: ScraperConfig): Promise<ScraperResult> {
const browser = await puppeteer.launch({
headless: true,
args: [
'--no-sandbox',
'--disable-setuid-sandbox',
'--disable-dev-shm-usage',
'--disable-accelerated-2d-canvas',
'--disable-gpu',
'--window-size=1920,1080',
'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
],
});

try {
const page = await browser.newPage();

// Set realistic viewport and user agent
await page.setViewport({ width: 1920, height: 1080 });

// Add extra headers to appear more legitimate
await page.setExtraHTTPHeaders({
'Accept-Language': 'en-US,en;q=0.9',
'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
'Connection': 'keep-alive',
'Upgrade-Insecure-Requests': '1',
});

      const url = this.buildUrl(config);
      this.logger.info(`Navigating to ${url}`);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for job listings to load
      await this.waitForJobs(page);

    // Extract jobs using the extractJobs method
    const jobs = await this.extractJobs(page);

      this.logger.info(`Extracted ${jobs.length} jobs`);

      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Scraping failed: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Always close browser to prevent memory leaks
      await browser.close();
    }
  }

  /**
   * Build the URL for the job search
   * @param config - Scraper configuration
   * @returns URL string
   */
  protected buildUrl(config: ScraperConfig): string {
    return `https://example.com/jobs?q=${encodeURIComponent(config.query)}`;
  }

  /**
   * Wait for job listings to appear
   * @param page - Puppeteer page
   */
  protected async waitForJobs(page: any): Promise<void> {
    try {
      await page.waitForSelector('.job-listing', { timeout: 10000 });
    } catch (error) {
      this.logger.warn('Job selector timeout, proceeding anyway');
    }
  }

  /**
   * Extract job data from the page
   * @param page - Puppeteer page
   * @returns Array of extracted jobs
   */
  protected async extractJobs(page: any): Promise<Job[]> {
    return await page.evaluate(() => {
      return [];
    });
  }
}
