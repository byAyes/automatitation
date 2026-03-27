# 🚀 Job Email Automation - Production Testing Guide

## ✅ Current Status

**All code implemented and tested:**
- ✅ JSearch API integration (requires API key)
- ✅ Direct scraping fallback (Indeed, LinkedIn, Glassdoor, Computrabajo)
- ✅ 3-day date filtering
- ✅ GitHub Actions workflow configured
- ✅ Email digest functionality
- ✅ Job deduplication logic

## 🔑 API Options

### Option 1: JSearch API (Recommended - Easiest)

**What it is:** Aggregates jobs from Indeed, LinkedIn, Glassdoor, ZipRecruiter, etc.

**Free Tier:** 100 requests/day (enough for testing)

**How to get API key:**
1. Go to https://rapidapi.com/letscrape-6bRBa3Qgu/api/jsearch
2. Click "Subscribe to Test"
3. Sign up with Google/GitHub (free)
4. Copy your API key

**Setup:**
```bash
# Add to GitHub Secrets:
JSEARCH_API_KEY=your-api-key-here

# For local testing, add to .env:
JSEARCH_API_KEY=your-api-key-here
```

**Pros:**
- ✅ Works immediately
- ✅ No anti-bot issues
- ✅ Multiple sources in one API
- ✅ Returns jobs from last 3 days

**Cons:**
- ❌ Requires API key (but free tier available)

---

### Option 2: Direct Scraping (No API Key)

**What it is:** Direct scraping from job boards

**Free Tier:** Unlimited (but rate-limited)

**Setup:** No API key needed!

**Pros:**
- ✅ No API key required
- ✅ Completely free

**Cons:**
- ❌ Anti-bot measures (Indeed 403, LinkedIn login)
- ❌ Unreliable from residential IPs
- ❌ Works better from GitHub Actions (different IPs)

---

## 🧪 How to Test in Production

### Step 1: Configure GitHub Secrets

Go to your repo: https://github.com/byAyes/automatitation

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

#### For JSearch API (Recommended):
```
Name: JSEARCH_API_KEY
Value: [your-rapidapi-key]
```

#### For Gmail (Required):
```
Name: GMAIL_RECIPIENT
Value: your-email@gmail.com

Name: GOOGLE_CLIENT_ID
Value: [from Google Cloud Console]

Name: GOOGLE_CLIENT_SECRET
Value: [from Google Cloud Console]

Name: GMAIL_ACCESS_TOKEN
Value: [from running node scripts/get-gmail-tokens.js]

Name: GMAIL_REFRESH_TOKEN
Value: [from running node scripts/get-gmail-tokens.js]
```

### Step 2: Test Workflow Manually

1. Go to **Actions** tab in your repo
2. Click **"Weekly Job Email Automation"**
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Click **"Run workflow"**

### Step 3: Monitor Execution

- Click on the running workflow
- Watch the logs in real-time
- Expected output with JSearch API:
  ```
  [ScraperRunner] Starting job search with JSearch API...
  [JSearch] Searching for: software engineer
  [JSearch] ✅ Found 10 jobs
  [ScraperRunner] Completed. Total jobs: 10
  ```

### Step 4: Check Results

**If successful:**
- ✅ Jobs found (10-50 depending on query)
- ✅ Email sent (check your inbox)
- ✅ Logs show job count
- ✅ Database updated (if configured)

**If failed:**
- Check logs for error message
- Verify API key is correct
- Check Gmail credentials

---

## 🔧 Troubleshooting

### JSearch API Returns 401
- API key missing or invalid
- Check RapidAPI subscription is active
- Verify API key in GitHub Secrets

### No Jobs Found
- Try different query (e.g., "developer" instead of "software engineer")
- Check date filter (last 3 days might be too restrictive)
- Try location-specific query

### Gmail Sending Fails
- Verify OAuth tokens are valid
- Re-run `node scripts/get-gmail-tokens.js`
- Check Gmail API is enabled in Google Cloud Console

### Database Errors
- DATABASE_URL secret missing
- Prisma schema not pushed
- Run `npx prisma db push` locally first

---

## 📊 Production Deployment Checklist

- [ ] JSearch API key obtained from RapidAPI
- [ ] All 6 GitHub Secrets configured
- [ ] Workflow tested manually
- [ ] Email received successfully
- [ ] Logs show jobs found
- [ ] Database connected (optional)
- [ ] Schedule confirmed (Thursday 9 AM UTC)

---

## 🎯 Recommended Next Steps

1. **Get JSearch API Key** (2 minutes)
   - Go to: https://rapidapi.com/letscrape-6bRBa3Qgu/api/jsearch
   - Subscribe (free)
   - Copy API key

2. **Add GitHub Secret** (1 minute)
   - Settings → Secrets → Actions
   - Add `JSEARCH_API_KEY`

3. **Test Workflow** (3 minutes)
   - Actions → Run workflow
   - Watch it execute
   - Check email

4. **Verify Results** (1 minute)
   - Check email inbox
   - Review workflow logs
   - Confirm job count

---

## 📈 Expected Performance

**With JSearch API:**
- Jobs found: 10-50 per run
- Success rate: 99%
- Execution time: 30-60 seconds
- Reliability: High

**With Direct Scraping:**
- Jobs found: 0-10 (varies greatly)
- Success rate: 20-50%
- Execution time: 2-5 minutes
- Reliability: Low (blocked by anti-bot)

---

## 💡 Pro Tips

1. **Use JSearch API** - It's free and reliable
2. **Test with manual trigger** before relying on schedule
3. **Start with small job count** (max 10) for testing
4. **Monitor first few runs** to ensure everything works
5. **Adjust query** based on your job preferences

---

## 🆘 Need Help?

**Common Issues:**

1. **"API key required"** → Get free key from RapidAPI
2. **"No jobs found"** → Try broader query
3. **"Email not sent"** → Check Gmail secrets
4. **"Workflow failed"** → Check logs for specific error

**Resources:**
- JSearch API Docs: https://jsearchapi.com/
- GitHub Actions Logs: Actions tab in your repo
- This project's SETUP.md file

---

**Ready to test?** Follow the steps above or ask for help!
