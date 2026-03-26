# Phase 3 Research: Email Notifications

**Researched:** 2026-03-26
**Researcher Model:** sonnet
**Status:** Ready for planning

## Standard Stack

Based on project context and research:

- **Email Service:** Gmail API (required by roadmap JOB-06)
- **Client Library:** `googleapis` (official Google APIs Node.js client)
- **Authentication:** OAuth 2.0 via `google-auth-library`
- **Runtime:** Node.js with TypeScript (project standard)
- **Framework:** Next.js App Router (established in Phase 2)

## Architecture Patterns

### Gmail API Integration Pattern

```javascript
const {google} = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  YOUR_CLIENT_ID,
  YOUR_CLIENT_SECRET,
  YOUR_REDIRECT_URL
);

// Set auth as global default
google.options({ auth: oauth2Client });

// Initialize Gmail client
const gmail = google.gmail('v1');

// Send email
await gmail.messages.send({
  userId: 'me',
  requestBody: {
    raw: base64EncodedMessage
  }
});
```

### OAuth2 Flow

1. **Setup:** Create OAuth2 client with credentials
2. **Authorization:** Generate auth URL, user consents
3. **Token Exchange:** Exchange authorization code for access/refresh tokens
4. **Credentials:** Set tokens on OAuth2 client
5. **API Calls:** Use authenticated client for Gmail API

### Required Scopes

- `https://www.googleapis.com/auth/gmail.send` - Send emails

## Don't Hand-Roll

- **OAuth2 flow:** Use `google-auth-library` - handles token refresh, expiration
- **Email encoding:** Use proper MIME format with base64 encoding
- **Error handling:** Handle 401 (unauthorized), 429 (rate limit), retry logic

## Common Pitfalls

1. **Token expiration:** Access tokens expire in 1 hour, use refresh tokens
2. **Base64 encoding:** Gmail requires RFC 2822 formatted, base64-encoded messages
3. **Scopes:** Must request `gmail.send` scope specifically
4. **User consent:** First-time setup requires manual OAuth flow
5. **Rate limits:** Gmail API has sending limits (check quotas)

## User Setup Required

**Before implementation, user must:**

1. **Create Google Cloud Project:**
   - Visit https://console.cloud.google.com
   - Create new project or select existing
   - Enable Gmail API

2. **Create OAuth2 Credentials:**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URIs: `http://localhost:3000/oauth2callback`
   - Download credentials JSON

3. **Store Credentials Securely:**
   - Add to `.env` file:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_secret
     GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
     GMAIL_RECIPIENT=your_email@example.com
     ```

## Cost Estimate

- **Gmail API:** Free tier available (500 emails/day for standard accounts)
- **Development time:** ~2-3 hours for OAuth setup + implementation

## Next Steps

1. Create CONTEXT.md with decisions
2. Plan implementation (2-3 plans)
3. Implement Gmail integration
4. Test email sending
5. Automate (Phase 4)
