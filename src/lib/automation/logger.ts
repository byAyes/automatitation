/**
 * Logger utility optimized for GitHub Actions
 * Detects if running in GitHub Actions and uses workflow commands
 */

const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);

/**
 * Format timestamp for logs
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Log info message
 */
export function info(message: string, data?: any): void {
  const logMessage = `[${timestamp()}] INFO: ${message}`;
  
  if (isGitHubActions) {
    console.log(`::notice ::${logMessage}`);
  } else {
    console.log(logMessage);
  }
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Log error message
 */
export function error(message: string, err?: Error): void {
  const logMessage = `[${timestamp()}] ERROR: ${message}`;
  
  if (isGitHubActions) {
    console.log(`::error ::${logMessage}`);
  } else {
    console.error(logMessage);
  }
  
  if (err) {
    console.error('Stack:', err.stack);
  }
}

/**
 * Log success message
 */
export function success(message: string): void {
  const logMessage = `[${timestamp()}] ✓ ${message}`;
  
  if (isGitHubActions) {
    console.log(`::notice ::${logMessage}`);
  } else {
    console.log(logMessage);
  }
}

/**
 * Log warning message
 */
export function warning(message: string): void {
  const logMessage = `[${timestamp()}] ⚠ ${message}`;
  
  if (isGitHubActions) {
    console.log(`::warning ::${logMessage}`);
  } else {
    console.warn(logMessage);
  }
}

/**
 * Logger object with all methods
 */
export const logger = {
  info,
  error,
  success,
  warning,
};

export default logger;
