# Scrapling Migration Guide

## What Changed

Puppeteer-based scrapers (LinkedIn, Glassdoor, Computrabajo) have been replaced with Python scripts using the [Scrapling](https://github.com/D4V1D-123/scrapling) library. The TypeScript pipeline now calls Python scrapers via subprocess.

### Files Removed
- `src/scrapers/strategies/puppeteerScraper.ts`
- `src/scrapers/strategies/linkedin.ts`
- `src/scrapers/strategies/glassdoor.ts`
- `src/scrapers/strategies/computrabajo.ts`
- `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` from `package.json`

### Files Added
| File | Purpose |
|------|---------|
| `scrapers/shared/models.py` | `Job` and `ScraperResult` dataclasses |
| `scrapers/shared/config.py` | `ScraperConfig` dataclass with `from_dict()` |
| `scrapers/shared/base.py` | `ScraplingBaseScraper` ABC + `run_scraper_cli()` |
| `scrapers/shared/runner.py` | YAML-driven runner + CLI entrypoint |
| `scrapers/shared/__init__.py` | Lazy imports for package |
| `scrapers/requirements.txt` | Python dependencies |
| `scrapers/linkedin.py` | LinkedIn scraper |
| `scrapers/glassdoor.py` | Glassdoor scraper |
| `scrapers/computrabajo.py` | Computrabajo scraper |
| `scrapers.yaml` | Config-driven scraper definitions |
| `src/scrapers/bridge/pythonBridge.ts` | Subprocess bridge (spawn + JSON parsing) |
| `SPEC-scrapling-migration.md` | Full design spec |

### Files Modified
| File | Change |
|------|--------|
| `src/scrapers/types.ts` | Added `PythonScraperConfig`, `ScraperStats` |
| `src/scrapers/index.ts` | Rewrote as `ScraperRunner` class with parallel execution |
| `src/lib/automation/logger.ts` | Added `scraperStat()`, `scraperSummary()` |
| `src/automation/orchestrator.ts` | Uses `ScraperRunner`, `PipelineResult` includes `scraperStats` |
| `src/automation/scheduler.ts` | Calls `logger.scraperSummary()` |
| `package.json` | Removed puppeteer deps, added `js-yaml` + `@types/js-yaml` |
| `.github/workflows/weekly-job-email.yml` | Added Python 3.12 setup + pip install step |

## Architecture

```
TypeScript Pipeline                    Python Scrapers
┌─────────────────┐                   ┌──────────────────┐
│  ScraperRunner   │──spawn──>│  linkedin.py      │
│  (index.ts)      │──spawn──>│  glassdoor.py     │
│                  │──spawn──>│  computrabajo.py  │
│  pythonBridge.ts │<--JSON---│  (stdout)         │
└─────────────────┘                   └──────────────────┘
       │                                      │
       │                               ┌──────┴──────┐
       │                               │ Scrapling    │
       │                               │ Stealthy     │
       │                               │ Fetcher      │
       │                               └─────────────┘
```

- **TS → Python**: `child_process.spawn()` with JSON on stdout
- **Python → TS**: `ScraperResult` JSON printed to stdout, structured logs to stderr
- **Parallel**: `Promise.allSettled()` runs all Python scrapers concurrently
- **Retries**: 3x with exponential backoff (5s → 15s → 45s) in Python; 2x in TS bridge

## Setup

### Local Development

```bash
# 1. Install Python dependencies
pip install -r scrapers/requirements.txt

# 2. Install Playwright browsers (required by Scrapling StealthyFetcher)
playwright install chromium
patchright install chromium

# 3. Install Node dependencies (already done if you ran npm install)
npm install
```

### CI/CD (GitHub Actions)

The workflow already includes Python setup. Key steps:

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: pip
- run: pip install -r scrapers/requirements.txt
- run: playwright install chromium --with-deps
- run: patchright install chromium --with-deps
```

## Adding a New Job Board

1. **Create the Python scraper** at `scrapers/<name>.py`:

```python
from scrapers.shared import ScraplingBaseScraper, run_scraper_cli

class NewBoardScraper(ScraplingBaseScraper):
    def build_url(self) -> str:
        return f"https://newboard.com/jobs?q={self.config.query}"

    def parse_page(self, page) -> list[dict]:
        jobs = []
        for card in page.css(".job-card"):
            jobs.append(self._make_job(
                title=card.css_first(".title").text(),
                company=card.css_first(".company").text(),
                location=card.css_first(".location").text() or "",
                link=card.css_first("a").attrib.get("href", ""),
                description=card.css_first(".desc").text() or "",
                source="newboard",
            ))
        return jobs

if __name__ == "__main__":
    run_scraper_cli(NewBoardScraper)
```

2. **Add to `scrapers.yaml`**:

```yaml
scrapers:
  newboard:
    enabled: true
    module: scrapers.newboard
    class: NewBoardScraper
    max_jobs: 10
    rate_limit_ms: 5000
```

3. **Done.** No TypeScript changes needed — the runner discovers scrapers from YAML automatically.

## Configuration

### `scrapers.yaml` Reference

```yaml
scrapers:
  <name>:
    enabled: true|false          # Whether to run this scraper
    module: scrapers.<name>      # Python module path
    class: <Name>Scraper         # Python class name
    max_jobs: 10                 # Max jobs to collect
    rate_limit_ms: 5000          # Delay between requests (ms)
    # ... any board-specific keys are passed via ScraperConfig.extra
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `JSEARCH_API_KEY` | JSearch API (existing) | Yes (for JSearch) |
| `SMTP_*` | Email sending (existing) | Yes |

## Data Flow

1. **Job dataclass** (Python) has 8 fields matching the TS `Job` interface:
   - `id`, `title`, `company`, `location`, `link`, `description`, `source`, `scrapedAt`

2. **`to_dict()`** converts `scraped_at` → `scrapedAt` (snake_case → camelCase) for TS compatibility

3. **`ScraperResult`** wraps output: `{ success: bool, data: list[dict] | null, error: str | null }`

4. **`pythonBridge.ts`** parses JSON from stdout, forwards stderr logs to the TS logger

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'scrapling'` | `pip install -r scrapers/requirements.txt` |
| `ModuleNotFoundError: No module named 'msgspec'` | `pip install msgspec` (transitive dep) |
| Playwright browsers missing | `playwright install chromium && patchright install chromium` |
| Python scraper returns empty results | Site may have changed — update CSS selectors in `parse_page()` |
| Timeout in bridge | Default 60s — increase via `timeoutMs` in `PythonScraperConfig` |
| Import errors from `scrapling.fetchers` | Imports are lazy — only loaded when `StealthyFetcher.fetch()` is called |

## Unchanged Components

- **Indeed scraper** (`src/scrapers/strategies/indeed.ts`) — HTTP-based, no browser needed
- **JSearch scraper** (`src/scrapers/strategies/jsearch.ts`) — API-based
- **Email pipeline** — filter → match → send, unchanged
- **Scheduler** — same cron schedule, now calls `ScraperRunner`
