import type { Job } from '../../types/job';
import { PrismaClient } from '../../generated/prisma/client';

// Lazy initialization to avoid immediate Prisma client creation
let _prisma: ReturnType<typeof PrismaClient> | null = null;

function getPrisma() {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

/**
 * Filter jobs to only include new jobs (not already in database or already emailed)
 * @param jobs Array of jobs to filter
 * @returns Array of new jobs that haven't been emailed
 */
export async function filterNewJobs(jobs: Job[]): Promise<Job[]> {
  try {
    const prisma = getPrisma();
    
    // Get all URLs from input jobs
    const jobUrls = jobs.map(job => job.url);

    // Query database for existing jobs
    const existingJobs = await prisma.job.findMany({
      where: {
        url: {
          in: jobUrls,
        },
      },
      select: {
        url: true,
        emailedAt: true,
      },
    });

    // Create set of URLs that have been emailed
    const emailedUrls = new Set(
      existingJobs.filter((job: any) => job.emailedAt).map((job: any) => job.url)
    );

    // Filter to only new jobs (not emailed yet)
    const newJobs = jobs.filter(job => {
      // If job URL was already emailed, skip it
      if (emailedUrls.has(job.url)) {
        return false;
      }
      return true;
    });

    return newJobs;
  } catch (error) {
    console.error('Error filtering jobs:', error);
    // On error, return all jobs (fail-open)
    return jobs;
  }
}

/**
 * Mark jobs as emailed by setting emailedAt timestamp
 * @param jobIds Array of job IDs to mark as emailed
 * @returns Number of jobs updated
 */
export async function markJobsAsEmailed(jobIds: string[]): Promise<number> {
  try {
    const prisma = getPrisma();
    
    if (jobIds.length === 0) {
      return 0;
    }

    const result = await prisma.job.updateMany({
      where: {
        id: {
          in: jobIds,
        },
      },
      data: {
        emailedAt: new Date(),
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error marking jobs as emailed:', error);
    return 0;
  }
}

/**
 * Clean up old jobs beyond retention period
 * @param retentionMonths Number of months to retain jobs (default: 3)
 * @returns Number of jobs deleted
 */
export async function cleanupOldJobs(retentionMonths: number = 3): Promise<number> {
  try {
    const prisma = getPrisma();
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

    const result = await prisma.job.deleteMany({
      where: {
        scrapedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} jobs older than ${retentionMonths} months`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    return 0;
  }
}
