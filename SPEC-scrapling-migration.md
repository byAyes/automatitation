# Spec: Scrapling Migration + Workflow Improvements

## Objective

Replace Puppeteer-based scrapers (LinkedIn, Glassdoor, Computrabajo) with Python scripts using the Scrapling library, and improve the automation pipeline with better error handling, parallel scraping, structured logging, and config-driven scraper definitions.

**User stories:**
- As a user, I want scrapers that reliably bypass anti-bot protections so I get results every run
- As a user, I want scrapers that run in parallel so the pipeline completes faster
- As a user, I want structured logs so I can diagnose failures quickly
- As a user, I want to add new job boards by editing a YAML file instead of writing TypeScript classes

**Success criteria:**
1. LinkedIn, Glassdoor, Computrabajo scrapers work via Scrapling StealthyFetcher with anti-bot bypass
2. Scrapers run in parallel (not sequentially) with per-scraper failure isolation
3. Each scraper retries up to 3 times with exponential backoff before reporting failure
4. Structured JSON logs from Python scrapers are captured and forwarded to the TS logger
5. `scrapers.yaml` defines which scrapers to run and their config — adding a board requires only YAML + minimal Python parser
6. Puppeteer and related deps are removed from package.json
7. JSearch API and Indeed scrapers continue working unchanged
8. Pipeline still works end-to-end: scrape → filter → match → email

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Pipeline orchestrator | TypeScript / Node.js | Existing (Next.js 16) |
| Scraping (Puppeteer scrapers) | Python + Scrapling | Scrapling latest |
| Stealthy fetching | Scrapling `StealthyFetcher` | Built-in |
| Adaptive parsing | Scrapling `Selector` | Built-in |
| Config format | YAML | PyYAML |
| Subprocess bridge | Node.js `child_process.spawn` | Built-in |
| Static HTTP scraping | Axios + Cheerio (Indeed) | Existing |
| API scraping | JSearch / RapidAPI | Existing |

## Commands

```bash
# Run full pipeline (existing, unchanged)
npm run automate

# Run Python scraper standalone (for debugging)
python scrapers/linkedin.py --query "software engineer" --max-jobs 10

# Run all Python scrapers directly (no TS pipeline)
python scrapers/shared/runner.py --query "software engineer" --max-jobs 10

# Install Python dependencies
pip install -r scrapers/requirements.txt

# Run TypeScript tests
npm test

# Lint TypeScript
npx tsc --noEmit
```

## Project Structure

```
automatitation/
├── scrapers.yaml                    # Config-driven scraper definitions (NEW)
├── scrapers/                        # Python scraping layer (NEW)
│   ├── requirements.txt             # Python deps: scrapling, pyyaml
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── base.py                  # ScraplingBaseScraper abstract class
│   │   ├── config.py                # YAML config loader
│   │   ├── models.py                # Job dataclass + JSON serialization
│   │   └── runner.py                # Run all Python scrapers (standalone CLI)
│   ├── linkedin.py                  # LinkedIn scraper (StealthyFetcher)
│   ├── glassdoor.py                 # Glassdoor scraper (StealthyFetcher)
│   └── computrabajo.py              # Computrabajo scraper (StealthyFetcher)
├── src/
│   ├── scrapers/
│   │   ├── bridge/
│   │   │   └── pythonBridge.ts      # Subprocess bridge (NEW)
│   │   ├── index.ts                 # UPDATED: parallel execution + Python bridge
│   │   ├── types.ts                 # UPDATED: add PythonScraperConfig, extend ScraperResult
│   │   └── strategies/
│   │   ├── jsearch.ts           # KEPT as-is
│   │   ├── indeed.ts            # KEPT as-is
│   │   └── httpScraper.ts       # KEPT (Indeed still uses it)
│   │       # DELETED: linkedin.ts, glassdoor.ts, computrabajo.ts, puppeteerScraper.ts
│   ├── automation/
│   │   ├── orchestrator.ts          # UPDATED: per-scraper stats, structured logging
│   │   └── scheduler.ts             # UPDATED: summary table output
│   ├── lib/automation/
│   │   ├── logger.ts                # UPDATED: support forwarded Python logs
│   │   └── job-history.ts           # KEPT as-is
│   ├── matching/                    # KEPT as-is
│   └── lib/email/                   # KEPT as-is
```

## Code Style

### Python (Scrapling scrapers)

```python
from scrapling.fetchers import StealthyFetcher
from scrapers.shared.base import ScraplingBaseScraper
from scrapers.shared.models import Job

class LinkedInScraper(ScraplingBaseScraper):
    name = "linkedin"

    def build_url(self, query: str, location: str = "") -> str:
        base = self.config.get("base_url", "https://www.linkedin.com/jobs/search")
        return f"{base}?keywords={query}&location={location}"

    def parse_page(self, page) -> list[Job]:
        jobs = []
        for card in page.css(".base-card"):
            title_el = card.css(".base-search-card__title::text").get()
            company_el = card.css(".base-search-card__subtitle::text").get()
            link_el = card.css(".base-card__full-link")
            jobs.append(Job(
                id=self._generate_id(title_el, company_el),
                title=title_el or "",
                company=company_el or "",
                location=card.css(".job-search-card__location::text").get() or "",
                description="",
                link=link_el.attrib.get("href", "") if link_el else "",
                scrapedAt=datetime.utcnow().isoformat(),
                source="linkedin",
            ))
        return jobs
```

### TypeScript (subprocess bridge)

```typescript
import { spawn } from 'child_process';
import type { Job, ScraperResult } from '../types';

interface PythonBridgeOptions {
  scriptName: string;
  query: string;
  maxJobs: number;
  timeout?: number;
}

export async function spawnPythonScraper(
  options: PythonBridgeOptions
): Promise<ScraperResult & { scraper: string; jobCount: number; duration: number }> {
  const scriptPath = `scrapers/${options.scriptName}.py`;
  const args = ["--query", options.query, "--max-jobs", String(options.maxJobs)];
  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn("python", [scriptPath, ...args], { timeout: options.timeout ?? 60000 });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      forwardPythonLogs(data.toString());
    });

    proc.on("close", (code) => {
      const duration = Date.now() - startTime;
      if (code === 0) {
        const jobs: Job[] = JSON.parse(stdout.trim());
        resolve({ scraper: options.scriptName, success: true, jobCount: jobs.length, data: jobs, duration, error: undefined });
      } else {
        resolve({ scraper: options.scriptName, success: false, jobCount: 0, data: undefined, duration, error: stderr.trim() });
      }
    });
  });
}
```

### Key conventions

- Python scripts output **JSON array to stdout**, logs to stderr
- **Python `Job` dataclass fields must match TS `Job` interface exactly**: `id`, `title`, `company`, `location`, `link`, `description`, `source`, `scrapedAt` (8 fields, no extras)
- Python scrapers extend `ScraplingBaseScraper` — override `build_url()` and `parse_page()`
- TS bridge extends existing `ScraperResult` type (adds `scraper`, `jobCount`, `duration`) — does not introduce a competing `ScrapeResult` type
- TS bridge always uses `Promise.allSettled()` for parallel execution
- Config keys in `scrapers.yaml` use `snake_case`; TS code uses `camelCase`

## Testing Strategy

| Level | What | Framework | Location |
|-------|------|-----------|----------|
| Python unit | `models.py`, `config.py` | pytest | `scrapers/tests/` |
| Python integration | Run each scraper against live site | pytest | `scrapers/tests/` |
| TS unit | `pythonBridge.ts` parsing | jest | `src/scrapers/bridge/__tests__/` |
| TS integration | Full pipeline with mocked Python | jest | `src/automation/__tests__/` |
| E2E | `python scrapers/shared/runner.py` → verify JSON output | Manual | CLI |

**Coverage expectations:**
- Python: `models.py` and `config.py` must have 90%+ coverage
- TS: `pythonBridge.ts` must have 80%+ coverage
- Integration: at least one test per scraper mocking the subprocess call

## Boundaries

- **Always:** Run `npx tsc --noEmit` after TS changes; run `pytest` after Python changes; keep Job interface fields synchronized between Python and TS; update `scrapers.yaml` when adding/removing boards
- **Ask first:** Adding new Python dependencies (beyond Scrapling/PyYAML); changing the Job interface fields; modifying the orchestrator pipeline steps; changing `scrapers.yaml` schema
- **Never:** Commit `.env` or API keys; remove JSearch or Indeed scrapers; run Python scrapers without timeout; ignore Python stderr output

## Success Criteria

1. `python scrapers/linkedin.py --query "test"` returns valid JSON with Job objects
2. `python scrapers/glassdoor.py --query "test"` returns valid JSON with Job objects
3. `python scrapers/computrabajo.py --query "test"` returns valid JSON with Job objects
4. `npm run automate` runs the full pipeline using Python scrapers via subprocess bridge
5. If one Python scraper fails, the pipeline still returns results from other scrapers
6. Each Python scraper retries up to 3 times before reporting failure
7. Scrapers run in parallel — total scraping time is bounded by the slowest scraper, not the sum
8. Structured logs from Python appear in the TS logger output
9. `scrapers.yaml` controls which scrapers are enabled and their per-board config
10. No Puppeteer dependencies remain in `package.json`
11. `npx tsc --noEmit` passes with zero errors

## Open Questions

1. **Proxy configuration**: Should `scrapers.yaml` support per-scraper proxy URLs, or use a single global proxy env var?
   → Assumption: Support per-scraper proxy in YAML, fallback to `PROXY_URL` env var. Correct me if wrong.
2. **Python version**: Target Python 3.10+ (matches Scrapling minimum)?
   → Assumption: Yes. Correct me if wrong.
3. **GitHub Actions**: Should we add Python setup steps to the existing workflow, or defer to a separate PR?
   → Assumption: Include in this change (update workflow to install Python + Scrapling).
