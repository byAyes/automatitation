/**
 * Healthcheck endpoint — reports system status for monitoring and debugging.
 *
 * GET /api/health
 *
 * Returns:
 * - Server status, uptime, Node.js version
 * - Environment variable configuration (which are set, without exposing values)
 * - Rate limiter state (active entries)
 * - Jina Reader connectivity (if JINA_READER_BASE_URL configured)
 * - Python scraper config (from scrapers.yaml, without sensitive details)
 * - ScraperRunner module import status
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ── Server start time ──

const SERVER_START_TIME = Date.now();

// ── Helpers ──

/** List of env vars relevant for the pipeline, grouped by category */
const ENV_VARS = {
  Email: ['EMAIL_PROVIDER', 'SMTP_HOST', 'SMTP_USER', 'GMAIL_RECIPIENT', 'EMAIL_CC'],
  'API Keys': ['JSEARCH_API_KEY', 'GEMINI_API_KEY', 'RESEND_API_KEY', 'SENDGRID_API_KEY'],
  'Jina Reader': ['JINA_READER_BASE_URL'],
  Computrabajo: ['COMPUTRABAJO_COUNTRY', 'COMPUTRABAJO_BASE_URL'],
  Resend: ['RESEND_FROM_EMAIL'],
} as const;

function checkEnvVars(
  group: string,
  vars: readonly string[],
): { group: string; set: string[]; missing: string[] } {
  const set: string[] = [];
  const missing: string[] = [];

  for (const v of vars) {
    if (process.env[v] && process.env[v]!.trim().length > 0) {
      set.push(v);
    } else {
      missing.push(v);
    }
  }

  return { group, set, missing };
}

async function checkJinaReader(): Promise<{
  configured: boolean;
  reachable: boolean | null;
  error?: string;
}> {
  const baseUrl = process.env.JINA_READER_BASE_URL;
  if (!baseUrl) {
    return { configured: false, reachable: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (response.ok) {
      return { configured: true, reachable: true };
    }
    return {
      configured: true,
      reachable: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

function checkPythonScrapers(): {
  configFound: boolean;
  enabledCount: number;
  scrapers: string[];
} {
  const yamlPath = path.resolve(process.cwd(), 'scrapers.yaml');

  if (!fs.existsSync(yamlPath)) {
    return { configFound: false, enabledCount: 0, scrapers: [] };
  }

  try {
    const raw = fs.readFileSync(yamlPath, 'utf-8');
    const doc = yaml.load(raw) as Record<string, unknown>;
    const scrapersSection = doc?.scrapers as Record<string, unknown> | undefined;

    if (!scrapersSection || typeof scrapersSection !== 'object') {
      return { configFound: true, enabledCount: 0, scrapers: [] };
    }

    const scraperNames = Object.keys(scrapersSection);

    return {
      configFound: true,
      enabledCount: scraperNames.length,
      scrapers: scraperNames,
    };
  } catch {
    return { configFound: false, enabledCount: 0, scrapers: [] };
  }
}

// ── Route ──

/**
 * GET /api/health
 *
 * Lightweight healthcheck — no auth required (used by Docker healthchecks, monitoring).
 * No rate limiting — healthchecks must always be available.
 */
export async function GET(_request: NextRequest) {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

  // Environment checks
  const envGroups = Object.entries(ENV_VARS).map(([group, vars]) => checkEnvVars(group, vars));

  // Jina Reader
  const jinaReader = await checkJinaReader();

  // Python scrapers
  const pythonScrapers = checkPythonScrapers();

  // ScraperRunner module check (can it be imported?)
  let scraperRunnerStatus: string;
  try {
    // Dynamic import to verify the module compiles and is accessible
    const mod = await import('@/scrapers/index');
    scraperRunnerStatus =
      typeof mod.ScraperRunner === 'function' ? 'available' : 'imported-but-no-class';
  } catch (error) {
    scraperRunnerStatus = `import-error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }

  // Load Node.js version
  const nodeVersion = process.version;

  // Compute overall status
  const isHealthy =
    scraperRunnerStatus === 'available' || scraperRunnerStatus === 'imported-but-no-class';

  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      human: formatUptime(uptimeSeconds),
    },
    server: {
      nodeVersion,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
    },
    environment: envGroups,
    jinaReader,
    pythonScrapers,
    scrapers: {
      runner: scraperRunnerStatus,
    },
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// ── Helpers ──

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}
