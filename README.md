# QUANTUM CORE OS - Setup & Security Guide

## Overview
QUANTUM CORE OS is a cybernetic-themed inventory management system with Firebase authentication and secure API key handling.

## Installation & Setup

### 1. Environment Variables Setup (.env)

For **security reasons**, API keys are stored in a `.env` file that is NOT committed to git.

#### Step 1: Copy the Example File
```bash
cp .env.example .env
```

#### Step 2: Add Your Firebase Credentials
Open the `.env` file and replace the placeholder values with your actual Firebase credentials:

```
FIREBASE_API_KEY=your_actual_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project-rtdb.region.firebasedatabase.app
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 2. Running the Application

#### Local Development
Simply open `index.html` in your browser or use a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npm install -g http-server
http-server

# Using Python 2
python -m SimpleHTTPServer 8000
```

Then navigate to `http://localhost:8000`

## Security Features

### API Key Protection
- ✅ API keys stored in `.env` file (never committed to git)
- ✅ `.env` file listed in `.gitignore`
- ✅ `.env.example` provided for reference
- ✅ Environment variables loaded dynamically via `env-loader.js`
- ✅ Fallback values prevent complete app failure if .env is missing

### Authentication
- ✅ Firebase Authentication integrated
- ✅ Email/Password registration and login
- ✅ Session persistence across page reloads
- ✅ Automatic logout functionality
- ✅ Password validation (minimum 6 characters)
- ✅ User profile data stored securely in Firebase

### Access Control
- 🔒 Auth page blocks access to main app
- 🔒 Only authenticated users can access inventory features
- 🔒 Logout clears all sensitive form data

## File Structure

```
quantumOS/
├── index.html              # Main HTML with auth page
├── script.js               # JavaScript with Firebase & auth logic
├── style.css               # Styling for all pages
├── env-loader.js          # Environment variable loader
├── .env                    # 🔐 API KEYS (NOT IN GIT)
├── .env.example           # Example env file for documentation
├── .gitignore             # Prevents .env from being committed
└── README.md              # This file
```

## Usage

### First Time Users
1. **Register**: Click "REGISTER" on the login page
2. **Enter Details**: Username, email, password (min 6 chars)
3. **Success**: Click "CONTINUE TO SYSTEM" to access the app

### Returning Users
1. **Login**: Enter your email and password
2. **Access**: After successful authentication, the app is ready
3. **Navigate**: Use the sidebar to access Dashboard, Nodes, and Data

## Best Practices

### ⚠️ DO NOT
- ❌ Commit `.env` file to git
- ❌ Share API keys in code
- ❌ Hardcode credentials
- ❌ Expose `.env` in production URLs
- ❌ Push `.env` to public repositories

### ✅ DO
- ✅ Keep `.env` file local only
- ✅ Use `.env.example` for documentation
- ✅ Rotate API keys regularly
- ✅ Use environment variables for all secrets
- ✅ Review `.gitignore` before committing
- ✅ Use HTTPS in production

## Production Deployment

For production environments:

1. **Use Server-Side Env Loading**
   - Never send `.env` to browser
   - Create backend endpoint to load config
   - Pass only necessary, non-sensitive values to frontend

2. **Firebase Rules**
   - Implement proper Firestore/Realtime Database rules
   - Restrict read/write access by UID
   - Enable authentication requirement

3. **Environment Management**
   - Use hosting provider's secret management
   - Vercel: Environment Variables
   - Netlify: Build & Deploy settings
   - AWS: Secrets Manager

## Troubleshooting

### Environment Variables Not Loading
1. Ensure `.env` file exists in project root
2. Check file format (KEY=value on each line)
3. No quotes needed in .env file
4. Reload page after creating/modifying .env

### Firebase Connection Issues
1. Verify all credentials in `.env`
2. Check Firebase project is active
3. Enable Email/Password authentication in Firebase Console
4. Verify Database Rules allow reads/writes

### Login Issues
1. Check email format is valid
2. Password must be at least 6 characters
3. Ensure email is registered
4. Check browser console for errors

## Support

For Firebase issues: https://firebase.google.com/docs
For authentication help: https://firebase.google.com/docs/auth

---

**Last Updated**: February 2, 2026
**Version**: 1.0.0
