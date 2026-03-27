# 📧 Job Email Automation

> **Automated job board scraping with AI-powered matching, delivered to your inbox weekly.**

[![Status](https://img.shields.io/badge/status-complete-success)](https://github.com/byAyes/automatitation)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/byAyes/automatitation/weekly-job-email.yml?branch=main)](https://github.com/byAyes/automatitation/actions)

---

## 🎯 What It Does

This system automates your job search by:

1. **Scraping** major job boards (LinkedIn, Indeed, Glassdoor)
2. **Matching** jobs against your profile using AI-powered weighted scoring
3. **Filtering** for relevance (>70% match threshold)
4. **Emailing** you a curated digest of opportunities weekly
5. **Running** automatically every Thursday at 9 AM UTC

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (or Supabase free tier)
- Gmail API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/byAyes/automatitation.git
cd automatitation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configuration

1. **Database Setup** (choose one):

   **Option A: Supabase (Recommended - Free)**
   ```bash
   # Create project at supabase.com
   # Get connection string from Settings > Database
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co/postgres"
   ```

   **Option B: Local PostgreSQL**
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
   ```

2. **Gmail OAuth Setup**:
   ```bash
   # Get credentials from Google Cloud Console
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-secret"
   GMAIL_RECIPIENT="your-email@example.com"
   
   # Generate OAuth tokens
   node scripts/get-gmail-tokens.js
   ```

3. **Update Database Schema**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### First Run

```bash
# Test locally
npm run automate

# Or trigger GitHub Actions manually
# Actions → Weekly Job Email Automation → Run workflow
```

---

## 📦 Features

### ✅ Core Features
- [x] Multi-source job scraping (LinkedIn, Indeed, Glassdoor)
- [x] Anti-detection with rate limiting and stealth
- [x] AI-powered job matching with weighted scoring
- [x] Fuzzy skill matching with Levenshtein distance
- [x] Gmail API integration with OAuth2
- [x] Weekly automated email digests
- [x] Job deduplication and history tracking
- [x] GitHub Actions workflow automation
- [x] 3-month retention policy

### 🔧 Technical Highlights
- **TypeScript** - Full type safety
- **Prisma ORM** - Type-safe database access
- **Next.js App Router** - Modern API endpoints
- **Puppeteer with Stealth** - Anti-detection scraping
- **Weighted Scoring Algorithm** - Customizable matching criteria
- **GitHub Actions** - Reliable weekly automation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           GitHub Actions (Weekly Cron)              │
│         Every Thursday at 9:00 AM UTC               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│  Scheduler (src/automation/scheduler.ts)             │
│  - Entry point                                       │
│  - Error handling                                    │
│  - Logging                                           │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│  Orchestrator (src/automation/orchestrator.ts)       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 1. Scrape Job Boards                        │    │
│  │    • LinkedIn (Puppeteer)                   │    │
│  │    • Indeed (HTTP + Cheerio)                │    │
│  │    • Glassdoor (Puppeteer + Stealth)        │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 2. Filter New Jobs                          │    │
│  │    • Remove duplicates (by URL)             │    │
│  │    • Check emailed status                   │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 3. Match Against Profile                    │    │
│  │    • Skills (40% weight)                    │    │
│  │    • Interests (30% weight)                 │    │
│  │    • Location (20% weight)                  │    │
│  │    • Salary (10% weight)                    │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 4. Send Email Digest                        │    │
│  │    • Format jobs list                       │    │
│  │    • Gmail API with OAuth2                  │    │
│  │    • Mark as emailed                        │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 5. Cleanup Old Jobs                         │    │
│  │    • Remove jobs > 3 months                 │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  PostgreSQL Database│
        │  - Jobs             │
        │  - UserProfile      │
        │  - EmailDigest      │
        └─────────────────────┘
```

---

## 📂 Project Structure

```
job-email-automation/
├── .github/workflows/          # GitHub Actions workflows
│   └── weekly-job-email.yml    # Weekly automation
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/
│   └── get-gmail-tokens.js     # OAuth token generator
├── src/
│   ├── app/api/                # Next.js API routes
│   │   ├── email/send/         # Email endpoint
│   │   └── match-jobs/         # Matching endpoint
│   ├── automation/             # Automation pipeline
│   │   ├── scheduler.ts        # Entry point
│   │   └── orchestrator.ts     # Pipeline logic
│   ├── lib/
│   │   ├── automation/         # Automation utilities
│   │   │   ├── job-history.ts  # Deduplication logic
│   │   │   └── logger.ts       # Logging utilities
│   │   └── email/              # Email functionality
│   │       ├── gmail.ts        # Gmail API client
│   │       └── template.ts     # Email templates
│   ├── matching/               # Job matching algorithms
│   │   ├── scorer.ts           # Main scoring logic
│   │   ├── skill-matcher.ts    # Skill matching
│   │   ├── interest-matcher.ts # Interest matching
│   │   ├── location-matcher.ts # Location matching
│   │   └── salary-matcher.ts   # Salary matching
│   ├── scrapers/               # Job board scrapers
│   │   ├── strategies/         # Scraper implementations
│   │   ├── base/               # Base scraper class
│   │   └── utils/              # Scraper utilities
│   ├── types/                  # TypeScript types
│   │   ├── job.ts              # Job interface
│   │   ├── job-match.ts        # Match score types
│   │   └── user-profile.ts     # User profile types
│   └── generated/prisma/       # Generated Prisma client
├── .planning/                  # GSD planning docs
├── .env.example                # Environment template
├── package.json                # Dependencies
├── prisma.config.ts            # Prisma configuration
└── SETUP.md                    # Detailed setup guide
```

---

## 🛠️ Available Commands

```bash
# Run automation pipeline
npm run automate

# Database commands
npx prisma db push      # Update database schema
npx prisma generate     # Generate Prisma client
npx prisma studio       # Open database GUI

# Get Gmail OAuth tokens
node scripts/get-gmail-tokens.js
```

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `GOOGLE_CLIENT_ID` | Gmail OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth client secret | ✅ |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | ✅ |
| `GMAIL_RECIPIENT` | Email address for digests | ✅ |
| `GMAIL_ACCESS_TOKEN` | Gmail access token | ✅ |
| `GMAIL_REFRESH_TOKEN` | Gmail refresh token | ✅ |

See `.env.example` for template.

---

## 📊 Database Schema

### Job
- `id` - Unique identifier
- `title` - Job title
- `company` - Company name
- `location` - Job location
- `description` - Full job description
- `url` - Job posting URL (unique)
- `salary` - Salary information
- `postedAt` - When job was posted
- `scrapedAt` - When job was scraped
- `emailedAt` - When job was emailed (nullable)
- `skills` - Required skills array
- `category` - Job category

### UserProfile
- `id` - Unique identifier
- `userId` - User identifier
- `skills` - User skills array
- `interests` - User interests array
- `location` - Preferred location
- `remoteOnly` - Remote-only preference
- `experienceLevel` - Experience level
- `minSalary` / `maxSalary` - Salary range
- `skillWeight` / `interestWeight` / `locationWeight` / `salaryWeight` - Matching weights

### EmailDigest
- `id` - Unique identifier
- `sentAt` - When digest was sent
- `jobCount` - Number of jobs in digest
- `jobs` - Related jobs

---

## 🧪 Testing

```bash
# Test locally with your profile
npm run automate

# Check GitHub Actions logs
# GitHub → Actions → Weekly Job Email Automation

# View database
npx prisma studio
```

---

## 📈 Roadmap

### Phase 1: Job Board Scraper ✅
- [x] Foundation and base scraper
- [x] Indeed scraper
- [x] LinkedIn scraper (Puppeteer + Stealth)
- [x] Glassdoor scraper
- [x] Gap closure and fixes

### Phase 2: AI Job Matching ✅
- [x] UserProfile schema and types
- [x] Weighted scoring algorithm
- [x] Fuzzy skill matching (Levenshtein)
- [x] API endpoint for matched jobs

### Phase 3: Email Notifications ✅
- [x] Gmail API integration with OAuth2
- [x] Email template for job digests
- [x] Test endpoint

### Phase 4: Automation & Scheduling ✅
- [x] GitHub Actions workflow (weekly cron)
- [x] Job history and deduplication
- [x] Pipeline orchestration
- [x] Logging and error handling

### Future Enhancements
- [ ] User interface for profile management
- [ ] Real-time notifications
- [ ] Multi-user support
- [ ] Analytics dashboard
- [ ] Click-through tracking
- [ ] Advanced ML-based matching

---

## 🤝 Contributing

This is a personal automation project. Feel free to fork and adapt for your own job search!

Key areas for improvement:
- Additional job board scrapers
- Improved matching algorithms
- UI for profile management
- Analytics and reporting

---

## 📝 License

ISC License - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GSD (Get Shit Done)** - Planning and execution framework
- **Prisma** - Type-safe database ORM
- **Next.js** - React framework for API routes
- **Puppeteer** - Headless Chrome for scraping
- **Google OAuth2** - Gmail API authentication

---

## 📞 Support

For setup issues, see [SETUP.md](SETUP.md) for detailed instructions.

**Common Issues:**
- Database connection errors → Check `DATABASE_URL` format
- OAuth errors → Verify Google Cloud Console settings
- Scraper failures → Review rate limiting and anti-detection

---

<div align="center">

**Built with ❤️ for efficient job searching**

[View on GitHub](https://github.com/byAyes/automatitation) • [Report Issue](https://github.com/byAyes/automatitation/issues)

</div>
