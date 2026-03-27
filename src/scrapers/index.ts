import { Job, ScraperConfig, ScraperResult } from './types';
import { rateLimiter } from './utils/rateLimiter';
import { JSearchScraper } from './strategies/jsearch';
import { IndeedScraper } from './strategies/indeed';
import { LinkedInScraper } from './strategies/linkedin';
import { GlassdoorScraper } from './strategies/glassdoor';
import { ComputrabajoScraper } from './strategies/computrabajo';

/**
 * Scraper runner that orchestrates all job board scrapers
 * Uses JSearch API as primary source, falls back to direct scraping
 */
export class ScraperRunner {
  private config: ScraperConfig;
  private allJobs: Job[] = [];

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Run all scrapers with JSearch API as primary source
   * Falls back to direct scraping if API fails
   * @returns Promise resolving to array of all scraped jobs
   */
  async runAllScrapers(): Promise<Job[]> {
    this.allJobs = [];

    console.log('[ScraperRunner] Starting job search with JSearch API...');
    console.log(`[ScraperRunner] Query: ${this.config.query}`);
    console.log(`[ScraperRunner] Max jobs: ${this.config.maxJobs || 'unlimited'}`);

    // Try JSearch API first (recommended - more reliable)
    try {
      const jsearch = new JSearchScraper(this.config);
      const result = await jsearch.search(this.config);
      
      if (result.success && result.data) {
        this.allJobs = result.data;
        console.log(`[ScraperRunner] ✅ JSearch API: Found ${result.data.length} jobs`);
        
        // If we got jobs from API, no need to scrape
        if (result.data.length > 0) {
          console.log(`[ScraperRunner] Completed. Total jobs: ${this.allJobs.length}`);
          return this.allJobs;
        }
      }
    } catch (error) {
      console.warn('[ScraperRunner] ⚠️ JSearch API failed, falling back to direct scraping');
    }

    // Fallback: Direct scraping (if API fails or returns no results)
    if (this.allJobs.length === 0) {
      console.log('\n[ScraperRunner] Switching to direct scraping mode...');
      
      const scrapers = [
        { name: 'Indeed', scraper: new IndeedScraper(this.config) },
        { name: 'LinkedIn', scraper: new LinkedInScraper(this.config) },
        { name: 'Glassdoor', scraper: new GlassdoorScraper(this.config) },
        { name: 'Computrabajo', scraper: new ComputrabajoScraper(this.config) },
      ];

      for (const { name, scraper } of scrapers) {
        try {
          console.log(`\n[ScraperRunner] Starting ${name} scraper...`);
          await rateLimiter.wait();
          
          const result = await scraper.scrape(this.config);
          
          if (result.success && result.data) {
            this.allJobs.push(...result.data);
            console.log(`[ScraperRunner] ${name}: Found ${result.data.length} jobs`);
          } else {
            console.warn(`[ScraperRunner] ${name}: Failed - ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[ScraperRunner] ${name}: Error - ${errorMessage}`);
        }
      }

      console.log(`\n[ScraperRunner] Direct scraping completed. Total jobs: ${this.allJobs.length}`);
    }

    return this.allJobs;
  }

  /**
   * Save jobs to JSON file
   */
  async saveToJSON(outputPath: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonData = JSON.stringify(this.allJobs, null, 2);
    fs.writeFileSync(outputPath, jsonData, 'utf-8');
    console.log(`[ScraperRunner] Jobs saved to ${outputPath}`);
  }

  getJobs(): Job[] {
    return this.allJobs;
  }

  clearJobs(): void {
    this.allJobs = [];
  }
}

/**
 * Main entry point
 */
export async function runScrapers(
  config: ScraperConfig,
  outputPath?: string
): Promise<Job[]> {
  const runner = new ScraperRunner(config);
  const jobs = await runner.runAllScrapers();

  if (outputPath) {
    await runner.saveToJSON(outputPath);
  }

  return jobs;
}

// CLI execution
if (require.main === module) {
  const query = process.argv[2] || 'software engineer';
  const maxJobs = parseInt(process.argv[3] || '10', 10);
  const output = process.argv[4] || 'data/jobs.json';

  console.log('[ScraperRunner] CLI mode detected');
  console.log(`[ScraperRunner] Query: ${query}`);
  console.log(`[ScraperRunner] Max jobs: ${maxJobs}`);
  console.log(`[ScraperRunner] Output: ${output}`);

  runScrapers({ query, maxJobs }, output)
    .then((jobs) => {
      console.log(`\n[ScraperRunner] Done! Collected ${jobs.length} jobs total.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[ScraperRunner] Fatal error:', error);
      process.exit(1);
    });
}
