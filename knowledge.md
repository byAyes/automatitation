# Seahorse — Job Email Automation

## What This Is
Automated job board scraper → AI matcher → email digest pipeline. Scrapes Glassdoor, Computrabajo, LinkedIn, Indeed, and JSearch; filters/matches jobs against a user profile; sends weekly email digests via Resend (free tier).

## Commands
| Command | Purpose |
|---------|---------|
| `npm run automate` | Run the full pipeline (scrape → email) |
| `npm test` | Run Jest test suite |
| `npx prisma db push` | Push schema changes to DB |
| `npx prisma generate` | Regenerate Prisma client |
| `pip install -r scrapers/requirements.txt` | Install Python scraper deps |
| `npx tsx scripts/test-email.ts` | Test email sending |
| `DOTENV_CONFIG_PATH=.env npx tsx scripts/debug-email.ts` | Debug email provider routing |

## Key Code Locations
- **Pipeline entry** → `src/automation/scheduler.ts` → `src/automation/orchestrator.ts`
- **Scrapers** → TypeScript bridge (`src/scrapers/`), Python subprocess (`scrapers/`)
- **Matching** → `src/lib/matching/` (skills, location, salary via weighted scoring)
- **Email** → `src/lib/email/` (Resend/SendGrid/SMTP/Gmail providers)
- **Scraper config** → `scrapers.yaml`

## Architecture Notes
- **Typescript (CommonJS)** with `tsx` runtime
- **Email**: Resend (free tier, 100 emails/day). Uses `onboarding@resend.dev` as sender.
  - Provider routing reads `EMAIL_PROVIDER` env var at call time (lazy init).
- **Python scrapers**: Spawned as subprocesses via `pythonBridge.ts`. Use Scrapling library.
- **Matching**: Weighted scoring (Skills 40% / Interests 30% / Location 20% / Salary 10%)

## Database Status ⚠️
Database (Supabase) is **deferred** due to a Windows + IPv6-only Supabase hostname connectivity issue. The Prisma client uses a mock that returns empty/safe defaults so the pipeline works without a database:
- All jobs pass through (no duplicate filtering)
- Job history/cache is not persisted
- Email marking and cleanup are no-ops

**To re-enable**: Install `@prisma/adapter-pg` and `pg`, set `DATABASE_URL`, and swap `src/lib/prisma.ts` for the real client with adapter.

## Email Provider Configuration
| Env Var | Value | Notes |
|---------|-------|-------|
| `EMAIL_PROVIDER` | `resend` | Switch to `gmail` or `sendgrid` or `smtp` |
| `RESEND_API_KEY` | key | Resend API key |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Free tier sender |
| `GMAIL_RECIPIENT` | email | Recipient for digests |

## CI (GitHub Actions)
- Runs weekly (Thu 9 AM UTC)
- Seasonal CV cleanup processed monthly
