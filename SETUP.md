# Job Email Automation - Setup Guide

## ✅ Installation Complete

All 12 plans across 4 phases have been implemented. The system is ready for activation.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Database Setup

You have **two options**:

#### Option A: Use Supabase (Recommended - Free, 500MB)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **Settings > Database**
3. Copy the **Connection string (pooler mode)**
4. Add to your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co/postgres?pgbouncer=true"
   ```

#### Option B: Local PostgreSQL

1. Make sure PostgreSQL is running on port 51214
2. Update `.env` with your connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:51214/postgres"
   ```

### Step 2: Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Go to **Credentials > Create Credentials > OAuth 2.0 Client ID**
5. Set redirect URI to: `http://localhost:3000/oauth2callback`
6. Copy credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-secret"
   GMAIL_RECIPIENT="your-email@example.com"
   ```

7. **Get refresh token** (one-time setup):
   ```bash
   # Run this in your terminal:
   node scripts/get-gmail-tokens.js
   ```
   This will open a browser window for OAuth consent and save tokens automatically.

### Step 3: Update Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
# Gmail API OAuth2 Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
GMAIL_RECIPIENT="your-email@example.com"

# Database (from Supabase or local)
DATABASE_URL="postgresql://..."

# OAuth tokens (populated after first auth)
GMAIL_ACCESS_TOKEN=""
GMAIL_REFRESH_TOKEN=""
```

### Step 4: Run Database Migrations

```bash
npx prisma db push
npx prisma generate
```

### Step 5: Test Locally

```bash
npm run automate
```

This will:
- Scrape job boards (if implemented)
- Filter for new jobs
- Send a test email digest
- Mark jobs as emailed
- Clean up old jobs

### Step 6: Deploy to GitHub Actions

1. **Add GitHub Secrets** (Settings > Secrets and variables > Actions):
   - `DATABASE_URL`
   - `GMAIL_RECIPIENT`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GMAIL_ACCESS_TOKEN`
   - `GMAIL_REFRESH_TOKEN`

2. **Test workflow manually**:
   - Go to **Actions > Weekly Job Email Automation**
   - Click **Run workflow**
   - Select branch: `main`
   - Click **Run workflow**

3. **Verify execution**:
   - Check workflow logs
   - Verify email received
   - Confirm database updates

---

## 📅 Automation Schedule

The workflow runs automatically:
- **When:** Every Thursday at 9:00 AM UTC
- **What:** Scrapes jobs → Matches against profile → Sends email digest
- **Logs:** Available in GitHub Actions (30-day retention)

---

## 🔧 Troubleshooting

### Database connection fails
- Verify `DATABASE_URL` is correct
- For Supabase: ensure pooler mode is used
- Check firewall allows connections

### Gmail OAuth errors
- Verify redirect URI matches exactly: `http://localhost:3000/oauth2callback`
- Ensure Gmail API is enabled in Google Cloud Console
- Check that OAuth consent screen is configured

### No jobs found
- Verify scrapers are implemented in `src/scrapers/index.ts`
- Check rate limiting isn't too aggressive
- Review scraper logs for errors

### Email not sent
- Check `GMAIL_RECIPIENT` is set correctly
- Verify OAuth tokens haven't expired
- Review GitHub Actions logs for error details

---

## 📊 What's Next?

After activation:
1. **Monitor first run** - Check logs and email delivery
2. **Adjust thresholds** - Modify match score threshold if needed
3. **Add more scrapers** - Extend for additional job boards
4. **Track metrics** - Monitor job matches over time

---

## 🎯 System Architecture

```
GitHub Actions (Weekly)
    ↓
scheduler.ts:runAutomation()
    ↓
orchestrator.ts:executePipeline()
    ├─→ Scrapers (LinkedIn, Indeed, Glassdoor)
    ├─→ filterNewJobs() - Remove duplicates
    ├─→ formatJobDigest() - Create email
    ├─→ sendEmail() - Gmail API
    ├─→ markJobsAsEmailed() - Update DB
    └─→ cleanupOldJobs() - 3 month retention
```

---

**Questions?** Check individual plan summaries in `.planning/phases/` for detailed implementation notes.
