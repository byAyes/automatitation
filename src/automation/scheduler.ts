import 'dotenv/config';

import { logger } from '../lib/automation/logger';
import { executePipeline } from './orchestrator';

/**
 * Main automation entry point
 * Runs the full pipeline and handles top-level errors
 */
export async function runAutomation(): Promise<void> {
  logger.success('Starting Job Email Automation Pipeline');

  try {
    const result = await executePipeline();

    logger.success('Pipeline completed successfully');
    logger.info('Summary:', {
      scraped: result.scraped,
      matched: result.matched,
      sent: result.sent,
      cleaned: result.cleaned,
    });
  } catch (error) {
    logger.error('Pipeline failed', error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

// Main guard - run if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  runAutomation().catch(console.error);
}
