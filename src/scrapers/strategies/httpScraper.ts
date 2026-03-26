import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { Job, ScraperConfig, ScraperResult } from '../types';
import { BaseScraper } from '../base/BaseScraper';
import { rateLimiter } from '../utils/rateLimiter';

/**
 * User-Agent strings for rotation to avoid detection
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * Get a random user-agent string for rotation
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * HTTP-based scraper using Axios and Cheerio
 * Base strategy for scraping job boards via HTTP requests
 */
export abstract class HttpScraper extends BaseScraper {
  protected client: AxiosInstance;

  constructor(config: ScraperConfig, source: string) {
    super(config, source);
    this.client = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
  }

  /**
   * Abstract method to implement scraping logic
   * @param config - Scraper configuration
   * @returns Promise resolving to scraper result
   */
  abstract scrape(config: ScraperConfig): Promise<ScraperResult>;

  /**
   * Fetch HTML content from a URL
   * @param url - URL to fetch
   * @returns HTML content as string
   */
  protected async fetchHtml(url: string): Promise<string> {
    // Rate limit requests
    await rateLimiter.wait();

    // Rotate user-agent for each request
    this.client.defaults.headers.common['User-Agent'] = getRandomUserAgent();

    const config: AxiosRequestConfig = {
      url,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
    };

    const response = await this.client.get(url, config);
    return response.data;
  }

  /**
   * Parse HTML content using Cheerio
   * @param html - HTML content to parse
   * @returns Cheerio root instance
   */
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Extract text from Cheerio selector with fallback
   * @param $ - Cheerio instance
   * @param selector - CSS selector
   * @param fallback - Fallback text if selector not found
   * @returns Extracted text or fallback
   */
  protected extractText($: cheerio.CheerioAPI, selector: string, fallback: string = ''): string {
    return $(selector).first().text().trim() || fallback;
  }

  /**
   * Extract href from Cheerio selector with fallback
   * @param $ - Cheerio instance
   * @param selector - CSS selector
   * @param fallback - Fallback URL if selector not found
   * @returns Extracted href or fallback
   */
  protected extractHref($: cheerio.CheerioAPI, selector: string, fallback: string = ''): string {
    return $(selector).first().attr('href') || fallback;
  }

  /**
   * Normalize relative URLs to absolute URLs
   * @param url - URL to normalize
   * @param baseUrl - Base URL to prepend if relative
   * @returns Absolute URL
   */
  protected normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}${cleanUrl}`;
  }

  /**
   * Create a Job object from extracted data
   * @param data - Partial job data
   * @returns Complete Job object
   */
  protected createJob(data: Partial<Job>): Job {
    return this.normalizeJob(data);
  }
}
