/**
 * Script to obtain Gmail OAuth tokens
 * 
 * Usage:
 * 1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
 * 2. Run: node scripts/get-gmail-tokens.js
 * 3. Follow the URL in your browser
 * 4. Copy the authorization code
 * 5. Tokens will be saved to .env
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { google } = require('googleapis');

// Load environment variables
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  console.error('Please add your Gmail OAuth credentials to .env first');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function getAccessToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      
      oauth2Client.getToken(code, (err, token) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(token);
      });
    });
  });
}

async function main() {
  try {
    console.log('Gmail OAuth Token Generator\n');
    console.log('This will help you get Gmail API access tokens.\n');
    
    const token = await getAccessToken();
    
    console.log('\n✓ Tokens obtained successfully!');
    console.log('\nAccess Token:', token.access_token);
    console.log('Refresh Token:', token.refresh_token || '(not provided)');
    
    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add or update tokens
    const lines = envContent.split('\n');
    const newLines = [];
    let accessTokenFound = false;
    let refreshTokenFound = false;
    
    lines.forEach(line => {
      if (line.startsWith('GMAIL_ACCESS_TOKEN=')) {
        newLines.push(`GMAIL_ACCESS_TOKEN="${token.access_token}"`);
        accessTokenFound = true;
      } else if (line.startsWith('GMAIL_REFRESH_TOKEN=')) {
        newLines.push(`GMAIL_REFRESH_TOKEN="${token.refresh_token || ''}"`);
        refreshTokenFound = true;
      } else {
        newLines.push(line);
      }
    });
    
    if (!accessTokenFound) {
      newLines.push(`GMAIL_ACCESS_TOKEN="${token.access_token}"`);
    }
    
    if (!refreshTokenFound && token.refresh_token) {
      newLines.push(`GMAIL_REFRESH_TOKEN="${token.refresh_token}"`);
    }
    
    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    
    console.log('\n✓ Tokens saved to .env');
    console.log('\nNext steps:');
    console.log('1. Run: npm run automate');
    console.log('2. Or push to GitHub to trigger automated workflow');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
