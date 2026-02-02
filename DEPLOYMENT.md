# API Key Security & Deployment Guide

## Why .env Files Matter

### The Problem
Hardcoding API keys in your JavaScript exposes them to:
- 🔴 Anyone viewing page source
- 🔴 GitHub repository history
- 🔴 Web server logs
- 🔴 Browser DevTools
- 🔴 Man-in-the-middle attacks

### The Solution
Use environment variables that are NEVER sent to the browser.

## Local Development Setup

### 1. Create Your .env File
```bash
# In project root directory
cp .env.example .env
```

### 2. Add Your Credentials
Edit `.env` and add your Firebase keys:
```
FIREBASE_API_KEY=AIzaSyBjZgEPAivAgxFJP0x1QA8Rr04uZxqwJcs
FIREBASE_AUTH_DOMAIN=boxsim.firebaseapp.com
# ... rest of credentials
```

### 3. Verify .gitignore
Ensure `.env` is in `.gitignore`:
```
# .gitignore
.env
.env.local
.env.*.local
```

### 4. Never Commit .env
```bash
# Good - commits example only
git add .env.example

# Bad - NEVER do this
git add .env  # This will be rejected by .gitignore
```

## Production Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Push to GitHub** (without .env)
```bash
git push origin main
```

2. **Connect to Vercel**
   - Go to vercel.com/new
   - Import your GitHub repository
   - Select your project

3. **Add Environment Variables**
   - Project Settings → Environment Variables
   - Add each Firebase credential:
     - FIREBASE_API_KEY
     - FIREBASE_AUTH_DOMAIN
     - etc.

4. **Deploy**
   - Vercel automatically reads .env during build
   - Variables are injected at build time

### Option 2: Netlify

1. **Connect Repository**
   - netlify.com → New site from Git
   - Connect your GitHub repo

2. **Add Environment Variables**
   - Site settings → Build & Deploy → Environment
   - Add your Firebase credentials

3. **Set Build Command**
   - Leave empty (static site) or use your build tool
   - Deployment automatically happens on git push

### Option 3: Firebase Hosting

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
```

2. **Initialize Firebase Project**
```bash
firebase init hosting
```

3. **Set Environment Variables**
   - Add to `firebase.json` or use functions
   - Never hardcode in deployed code

4. **Deploy**
```bash
firebase deploy
```

### Option 4: Traditional Web Server (Apache/Nginx)

For server-side environments like PHP:

1. **Server-Side API Gateway**
```php
// config.php (never exposed to web)
$config = [
    'FIREBASE_API_KEY' => getenv('FIREBASE_API_KEY'),
    'FIREBASE_AUTH_DOMAIN' => getenv('FIREBASE_AUTH_DOMAIN'),
    // ...
];

// Endpoint for frontend
echo json_encode(['publicKey' => $config['FIREBASE_API_KEY']]);
```

2. **Set System Environment Variables**
```bash
# .env file on server (not in webroot)
export FIREBASE_API_KEY="your_key_here"
export FIREBASE_AUTH_DOMAIN="your_domain"
```

3. **Frontend Fetches Config**
```javascript
fetch('/api/config')
    .then(r => r.json())
    .then(config => initializeFirebase(config));
```

## Security Checklist

- [ ] `.env` file created from `.env.example`
- [ ] `.env` listed in `.gitignore`
- [ ] `.env` never committed to git
- [ ] Environment variables loaded via `env-loader.js`
- [ ] API keys not hardcoded in source code
- [ ] `.env.example` has placeholder values only
- [ ] Production env vars set in hosting platform
- [ ] Firebase security rules configured
- [ ] HTTPS enabled on production
- [ ] Regular API key rotation implemented

## Testing Environment Variables

### Check if .env is Loading
Open browser console and run:
```javascript
console.log(envLoader.getAll());
```

Should show your Firebase config (check for your actual API key).

### Verify Variables Are Loaded
```javascript
console.log(envLoader.get('FIREBASE_API_KEY'));
// Should output your API key (in development)
```

## Rotating API Keys

### In Firebase Console:
1. Go to Project Settings
2. Service Accounts
3. Generate new key
4. Update your `.env` file locally
5. Deploy new version to hosting

### Important
- Old keys take 24 hours to disable
- Test with new key before disabling old one
- Update in `.env.example` if needed (without actual keys)

## Troubleshooting

### Variables Not Loading
1. Check `.env` file exists in project root
2. Check file format: `KEY=value` (no spaces around =)
3. Reload page in browser
4. Check browser console for errors

### Variables Undefined
1. Ensure `env-loader.js` is loaded first
2. Use fallback values with `envLoader.get('KEY', 'default')`
3. Check for typos in variable names

### Can Still See Keys in Network Tab
This is normal if you're using client-side authentication. For maximum security:
- Use a backend API gateway
- Keep keys server-side only
- Send only necessary data to frontend

## Firebase Security Rules

Protect your database with rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "inventory": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

**Last Updated**: February 2, 2026
**Version**: 1.0.0

For more: https://firebase.google.com/docs/database/security
