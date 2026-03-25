# Phase 1 Research: Job Board Scraper

**Researched:** 2026-03-25  
**Mode:** Ecosystem  
**Phase Goal:** Scrape job listings from major job boards (LinkedIn, Indeed, Glassdoor)

---

## Standard Stack

### Core Libraries

**Puppeteer** (`/puppeteer/puppeteer`)
- **Purpose:** Headless Chrome automation for JavaScript-heavy sites
- **Use for:** LinkedIn, Glassdoor (both are SPAs with dynamic content)
- **Version:** Latest (v24.x as of 2026)
- **Why:** Official Puppeteer maintained by Chrome team
- **Code snippets available:** 2409+

**Puppeteer Extra** (`/berstend/puppeteer-extra`)
- **Purpose:** Modular plugin framework for Puppeteer
- **Use for:** Stealth plugin to avoid detection
- **Why:** Industry standard for anti-detection
- **Key plugin:** `puppeteer-extra-plugin-stealth`

**Cheerio** (`/cheeriojs/cheerio`)
- **Purpose:** Fast HTML/XML parsing and manipulation
- **Use for:** Indeed and simpler job boards
- **Why:** jQuery-like API, 3-5x faster than jsdom, lightweight
- **Benchmark score:** 91.25

**Axios** (`/axios/axios`)
- **Purpose:** HTTP requests
- **Use for:** Fetching pages before parsing with Cheerio
- **Why:** Promise-based, interceptors, better error handling than fetch

### Supporting Libraries

**node-cron** or **node-schedule**
- **Purpose:** Scheduling (if not using GitHub Actions)
- **Recommendation:** Skip for now, use GitHub Actions scheduler

**winston** or **pino**
- **Purpose:** Logging
- **Why:** Track scraping runs, failures, rate limits

**dotenv**
- **Purpose:** Environment variable management
- **Why:** Store API keys, credentials securely

---

## Architecture Patterns

### Recommended Pattern: Module-per-Scraper

```
/src
  /scrapers
    /base
      BaseScraper.ts      # Abstract base class
      types.ts            # Job interface, scraper config
    /strategies
      PuppeteerScraper.ts # For JS-heavy sites
      HttpScraper.ts      # For static HTML sites
    linkedin.ts           # LinkedIn implementation
    indeed.ts             # Indeed implementation  
    glassdoor.ts          # Glassdoor implementation
  /utils
    rateLimiter.ts        # Delays, jitter, backoff
    userAgentRotator.ts   # User-agent pool
    jobNormalizer.ts      # Normalize extracted data
```

### Data Flow

```
┌─────────────────┐
│  Scraper Runner │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Rate    │◄── 5-10s base + random jitter
    │ Limiter │
    └────┬────┘
         │
    ┌────▼──────────┐
    │ Scraper       │
    │ Strategy      │
    └────┬──────────┘
         │
    ┌────▼─────────┐
    │ Extract Job  │
    └────┬─────────┘
         │
    ┌────▼──────────┐
    │ Normalize     │◄── Standardize location, fields
    └────┬──────────┘
         │
    ┌────▼─────────┐
    │ JSON Output  │
    └──────────────┘
```

### Execution Model

**Sequential with Delays:**
```typescript
for (const jobBoard of jobBoards) {
  await rateLimiter.wait(); // 5-10s + jitter
  const jobs = await scraper.scrape(jobBoard);
  await saveJobs(jobs);
}
```

**Why Sequential:**
- Respect rate limits
- Avoid concurrent requests triggering blocks
- Easier debugging and error handling

---

## Don't Hand-Roll

### 1. Anti-Detection (Use puppeteer-extra-plugin-stealth)

**DON'T build:**
- Custom user-agent rotation
- Custom fingerprinting evasion
- Custom navigator overrides

**DO use:**
```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: 'shell', // or 'new' for full Chrome
  args: ['--enable-gpu'] // GPU acceleration
});
```

**Why:** Detection is a cat-and-mouse game. Stealth plugin is maintained actively.

### 2. HTML Parsing (Use Cheerio)

**DON'T build:**
- Custom HTML parsers
- Regex-based extraction (fragile)

**DO use:**
```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
const jobs = [];

$('.job-card').each((_, el) => {
  jobs.push({
    title: $(el).find('.job-title').text().trim(),
    company: $(el).find('.company').text().trim(),
    location: $(el).find('.location').text().trim(),
    link: $(el).find('a').attr('href'),
  });
});
```

**Why:** Cheerio handles malformed HTML, encoding issues, edge cases.

### 3. HTTP Requests (Use Axios)

**DON'T build:**
- Raw HTTP client
- Manual retry logic

**DO use:**
```typescript
import axios from 'axios';

const response = await axios.get(url, {
  headers: { 'User-Agent': randomUserAgent },
  timeout: 10000,
  validateStatus: (status) => status < 500
});
```

---

## Common Pitfalls

### 1. Getting Blocked Immediately

**Problem:** No delays, default user-agent, suspicious patterns

**Prevention:**
- Start with 10s delays between requests
- Rotate user-agents from pool of 20+ real browser strings
- Use `puppeteer-extra-plugin-stealth`
- Respect `robots.txt`

**Detection Signs:**
- CAPTCHA pages
- 429 Too Many Requests
- 403 Forbidden
- Empty results

### 2. Selector Fragility

**Problem:** Job boards change HTML structure frequently

**Prevention:**
- Use multiple selectors per field (fallbacks)
- Add validation: "does this look like a job title?"
- Log when selectors fail
- Monitor extraction success rate

**Example:**
```typescript
const title = 
  $('.job-title')?.text() || 
  $('[data-test="job-title"]')?.text() ||
  $('h1')?.text() ||
  '';

// Validate
if (!title || title.length > 200) {
  logger.warn('Invalid title extracted:', { title, url });
  return null;
}
```

### 3. Location Normalization

**Problem:** "NYC", "New York, NY", "New York City" are same location

**Prevention:**
- Use library like `node-geocoder` or `city-state-country`
- Or build simple mapping table for top 50 cities
- Store both original and normalized

**Example:**
```typescript
function normalizeLocation(raw: string): string {
  // Simple approach: extract city, state
  const match = raw.match(/([^,]+),\s*([A-Z]{2})/);
  if (match) {
    return `${match[1].trim()}, ${match[2]}`;
  }
  return raw;
}
```

### 4. Memory Leaks with Puppeteer

**Problem:** Browser instances not closed, pages accumulating

**Prevention:**
```typescript
let browser;
try {
  browser = await puppeteer.launch();
  const page = await browser.newPage();
  // ... scraping
} finally {
  if (browser) {
    await browser.close();
  }
}
```

**Or use page pool:**
```typescript
const page = await browser.newPage();
try {
  // scrape
} finally {
  await page.close(); // Always close pages
}
```

### 5. JavaScript Rendering Issues

**Problem:** Content loaded dynamically, Cheerio sees empty page

**Solution:**
- Use Puppeteer for JS-heavy sites (LinkedIn, Glassdoor)
- Wait for network idle: `await page.waitForNetworkIdle()`
- Wait for specific selectors: `await page.waitForSelector('.job-card')`

---

## Code Examples

### Basic Puppeteer Scraper

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function scrapeLinkedIn() {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--enable-gpu']
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate
    await page.goto('https://linkedin.com/jobs/search?q=developer', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for jobs to load
    await page.waitForSelector('.job-card-list__item', { timeout: 10000 });

    // Extract jobs
    const jobs = await page.evaluate(() => {
      const cards = document.querySelectorAll('.job-card-list__item');
      return Array.from(cards).map(card => ({
        title: card.querySelector('.job-card-list__title')?.textContent || '',
        company: card.querySelector('.job-card-container__company-name')?.textContent || '',
        location: card.querySelector('.job-card-container__metadata-item')?.textContent || '',
        link: card.querySelector('a')?.href || ''
      }));
    });

    return jobs;
  } finally {
    await browser.close();
  }
}
```

### Basic Cheerio + Axios Scraper

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeIndeed(query: string) {
  const url = `https://indeed.com/jobs?q=${encodeURIComponent(query)}`;
  
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent()
    }
  });

  const $ = cheerio.load(data);
  const jobs: Job[] = [];

  $('div[data-testid="result"]').each((_, el) => {
    const title = $(el).find('h2 a span').text().trim();
    const company = $(el).find('span[data-testid="company-name"]').text().trim();
    const location = $(el).find('div[data-testid="text-location"]').text().trim();
    const link = $(el).find('h2 a').attr('href');
    
    if (title && company) {
      jobs.push({
        title,
        company,
        location: normalizeLocation(location),
        link: link?.startsWith('http') ? link : `https://indeed.com${link}`,
        source: 'indeed',
        scrapedAt: new Date().toISOString()
      });
    }
  });

  return jobs;
}
```

### Rate Limiter with Jitter

```typescript
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class RateLimiter {
  private baseDelay: number;
  private jitter: number;

  constructor(baseDelay = 5000, jitter = 2000) {
    this.baseDelay = baseDelay;
    this.jitter = jitter;
  }

  async wait(): Promise<void> {
    const delay = this.baseDelay + Math.random() * this.jitter;
    console.log(`Rate limiter: waiting ${Math.round(delay)}ms`);
    await sleep(delay);
  }
}

// Usage
const rateLimiter = new RateLimiter(5000, 5000); // 5-10s

for (const scraper of scrapers) {
  await rateLimiter.wait();
  const jobs = await scraper.scrape();
  await saveJobs(jobs);
}
```

---

## Job Board Specifics

### LinkedIn

- **Difficulty:** High (aggressive anti-bot)
- **Approach:** Puppeteer + stealth required
- **Challenges:**
  - Requires login for full job details
  - Aggressive rate limiting
  - Frequent HTML structure changes
- **Recommendation:** Start with Indeed/Glassdoor, add LinkedIn last

### Indeed

- **Difficulty:** Medium
- **Approach:** Axios + Cheerio may work
- **Challenges:**
  - Some anti-bot detection
  - CAPTCHA on suspicious activity
- **Recommendation:** Good starting point

### Glassdoor

- **Difficulty:** High
- **Approach:** Puppeteer required
- **Challenges:**
  - Heavy JavaScript
  - Login wall for some content
  - Anti-bot measures
- **Recommendation:** Add after Indeed is working

---

## Confidence Levels

| Claim | Confidence | Source |
|-------|------------|--------|
| Puppeteer is standard for JS-heavy sites | High | Official docs, 2409+ snippets |
| Cheerio is 3-5x faster than jsdom | High | Cheerio docs, benchmarks |
| Stealth plugin avoids basic detection | Medium-High | Community consensus |
| 5-10s delays are safe | Medium | Industry practice |
| LinkedIn requires Puppeteer | High | Technical analysis |
| Indeed may work with HTTP scraping | Medium | Community reports |

---

## Next Steps for Planning

1. **Decide on abstraction level:**
   - Option A: One scraper class per job board
   - Option B: Strategy pattern with shared base

2. **Define Job interface:**
   - Standardize all 7 core fields
   - Add metadata (source, scrapedAt)

3. **Plan testing approach:**
   - Unit tests for normalizers
   - Integration tests with mock HTML
   - Manual testing with real scrapers

4. **Consider GitHub Actions:**
   - Where to store JSON output?
   - How to pass between phases?
   - Artifact storage limits

---

*Research complete: 2026-03-25*  
*Ready for planning phase*
