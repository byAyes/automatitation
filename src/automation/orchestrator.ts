import { logger } from '../lib/automation/logger';
import { filterNewJobs, markJobsAsEmailed, cleanupOldJobs } from '../lib/automation/job-history';
import { formatJobDigest } from '../lib/email/template';
import { sendEmail } from '../lib/email/gmail';
import type { Job } from '../types/job';

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
    const allJobs: Job[] = [];
    
    // TODO: Import and run scrapers from src/scrapers/index.ts
    // For now, placeholder
    logger.info(`Scraped ${allJobs.length} jobs from all boards`);
    result.scraped = allJobs.length;

    // Step 2: Filter for new jobs (not already emailed)
    logger.info('Filtering for new jobs...');
    const newJobs = await filterNewJobs(allJobs);
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
