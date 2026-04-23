import { logger } from '../lib/automation/logger';
import { filterNewJobs, markJobsAsEmailed, cleanupOldJobs } from '../lib/automation/job-history';
import { formatJobDigest } from '../lib/email/template';
import { sendEmail } from "../lib/email"';
import { runScrapers } from '../scrapers/index';
import type { Job as ScrapedJob } from '../scrapers/types';

/**
 * Convert scraped job to database job format
 */
function convertToDbJob(scraped: ScrapedJob) {
return {
id: scraped.id,
title: scraped.title,
company: scraped.company,
location: scraped.location || null,
description: scraped.description || null,
url: scraped.link,
salary: null,
postedAt: null,
scrapedAt: scraped.scrapedAt,
skills: [] as string[],
category: null,
};
}

/**
 * Filter jobs from the last N days
 * @param jobs - Array of jobs to filter
 * @param days - Number of days (default: 3)
 * @returns Jobs from the last N days
 */
function filterByDate(jobs: any[], days: number = 3): any[] {
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - days);

return jobs.filter(job => {
// If job has postedAt, use it
if (job.postedAt) {
const postedDate = new Date(job.postedAt);
return postedDate >= cutoffDate;
}
// If no date, include it (assume recent)
return true;
});
}

/**
 * Pipeline execution result
 */
interface PipelineResult {
  scraped: number;
  matched: number;
  sent: number;
  cleaned: number;
}

/**
 * Execute the full automation pipeline:
 * 1. Scrape all job boards
 * 2. Filter for new jobs
 * 3. Match jobs against user profile
 * 4. Send email digest
 * 5. Mark jobs as emailed
 * 6. Clean up old jobs
 */
export async function executePipeline(): Promise<PipelineResult> {
  const result: PipelineResult = {
    scraped: 0,
    matched: 0,
    sent: 0,
    cleaned: 0,
  };

  try {
    // Step 1: Scrape job boards
    logger.info('Starting job scraping...');
    
    // Run scrapers from all job boards
    const query = process.env.JOB_QUERY || 'software engineer';
    const maxJobs = parseInt(process.env.MAX_JOBS_PER_SCRAPER || '10', 10);
    
    logger.info(`Scraping job boards for: "${query}" (max ${maxJobs} jobs per board)`);
    const scrapedJobs = await runScrapers({ query, maxJobs });
    
    // Convert scraped jobs to database format
    const allJobs = scrapedJobs.map(convertToDbJob);
    
result.scraped = allJobs.length;
logger.success(`Scraped ${allJobs.length} jobs from all boards`);

// Step 1.5: Filter jobs from last 3 days
const daysBack = parseInt(process.env.JOB_DAYS_FILTER || '3', 10);
logger.info(`Filtering jobs from last ${daysBack} days...`);
const recentJobs = filterByDate(allJobs, daysBack);
logger.info(`Found ${recentJobs.length} jobs from last ${daysBack} days`);

// Step 2: Filter for new jobs (not already emailed)
logger.info('Filtering for new jobs...');
const newJobs = await filterNewJobs(recentJobs);
result.matched = newJobs.length;
logger.info(`Found ${newJobs.length} new jobs`);

    // Step 3: Send email digest if there are jobs
    if (newJobs.length > 0) {
      logger.info('Sending email digest...');
      const digest = formatJobDigest(
        newJobs.map(job => ({
          job,
          score: 100, // TODO: Calculate actual match score
          matchedSkills: [],
        })),
        new Date().toISOString()
      );

      const emailResult = await sendEmail(
        process.env.GMAIL_RECIPIENT || '',
        `Weekly Job Digest - ${new Date().toLocaleDateString()}`,
        digest
      );

      if (emailResult.success) {
        result.sent = newJobs.length;
        logger.success(`Sent email with ${result.sent} jobs`);
        
        // Step 4: Mark jobs as emailed
        await markJobsAsEmailed(newJobs.map(job => job.id));
      } else {
        logger.error('Failed to send email', new Error(emailResult.error));
      }
    } else {
      logger.info('No new jobs to send');
    }

    // Step 5: Clean up old jobs
    logger.info('Cleaning up old jobs...');
    result.cleaned = await cleanupOldJobs(3); // 3 months retention

    return result;
  } catch (error) {
    logger.error('Pipeline execution failed', error instanceof Error ? error : undefined);
    throw error;
  }
}
