import { Job, ScraperConfig, ScraperResult } from './types';
import { rateLimiter } from './utils/rateLimiter';
import { IndeedScraper } from './strategies/indeed';
import { LinkedInScraper } from './strategies/linkedin';
import { GlassdoorScraper } from './strategies/glassdoor';
import { ComputrabajoScraper } from './strategies/computrabajo';

/**
 * Scraper runner that orchestrates all job board scrapers
 * Executes scrapers sequentially with rate limiting
 */
export class ScraperRunner {
  private config: ScraperConfig;
  private allJobs: Job[] = [];

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Run all scrapers sequentially
   * Each scraper failure is isolated and doesn't stop other scrapers
   * @returns Promise resolving to array of all scraped jobs
   */
  async runAllScrapers(): Promise<Job[]> {
    this.allJobs = [];
    
    console.log('[ScraperRunner] Starting job scraping process...');
    console.log(`[ScraperRunner] Query: ${this.config.query}`);
    console.log(`[ScraperRunner] Max jobs per scraper: ${this.config.maxJobs || 'unlimited'}`);

// Define scrapers in order of execution
const scrapers = [
{ name: 'Indeed', scraper: new IndeedScraper(this.config) },
{ name: 'LinkedIn', scraper: new LinkedInScraper(this.config) },
{ name: 'Glassdoor', scraper: new GlassdoorScraper(this.config) },
{ name: 'Computrabajo', scraper: new ComputrabajoScraper(this.config) },
];

    // Execute each scraper sequentially
    for (const { name, scraper } of scrapers) {
      try {
        console.log(`\n[ScraperRunner] Starting ${name} scraper...`);
        
        // Rate limit before each scraper
        await rateLimiter.wait();
        
        // Run the scraper
        const result = await scraper.scrape(this.config);
        
        if (result.success && result.data) {
          this.allJobs.push(...result.data);
          console.log(`[ScraperRunner] ${name}: Successfully scraped ${result.data.length} jobs`);
        } else {
          console.warn(`[ScraperRunner] ${name}: Failed - ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ScraperRunner] ${name}: Unhandled error - ${errorMessage}`);
        // Continue to next scraper - don't let one failure stop all
      }
    }

    console.log(`\n[ScraperRunner] Completed. Total jobs collected: ${this.allJobs.length}`);
    return this.allJobs;
  }

  /**
   * Save jobs to JSON file
   * @param outputPath - Path to save JSON file
   */
  async saveToJSON(outputPath: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonData = JSON.stringify(this.allJobs, null, 2);
    fs.writeFileSync(outputPath, jsonData, 'utf-8');
    console.log(`[ScraperRunner] Jobs saved to ${outputPath}`);
  }

  /**
   * Get all collected jobs
   * @returns Array of all scraped jobs
   */
  getJobs(): Job[] {
    return this.allJobs;
  }

  /**
   * Clear all collected jobs
   */
  clearJobs(): void {
    this.allJobs = [];
  }
}

/**
 * Main entry point for running all scrapers
 * @param config - Scraper configuration
 * @param outputPath - Optional path to save results
 * @returns Promise resolving to array of all scraped jobs
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
