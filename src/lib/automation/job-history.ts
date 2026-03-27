import type { Job } from '../../types/job';

/**
 * Filter jobs to only include new jobs (not already in database or already emailed)
 * @param jobs Array of jobs to filter
 * @returns Array of new jobs that haven't been emailed
 */
export async function filterNewJobs(jobs: Job[]): Promise<Job[]> {
  try {
    // TODO: Implement with Prisma when database is configured
    // For now, return all jobs (no filtering)
    console.log('filterNewJobs: Database not configured, returning all jobs');
    return jobs;
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
    // TODO: Implement with Prisma when database is configured
    console.log('markJobsAsEmailed: Database not configured, skipping');
    return 0;
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
    // TODO: Implement with Prisma when database is configured
    console.log(`cleanupOldJobs: Database not configured, skipping cleanup`);
    return 0;
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    return 0;
  }
}
