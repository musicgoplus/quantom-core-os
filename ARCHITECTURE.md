# Authentication Flow & Architecture

## 🔐 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER VISITS index.html                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              env-loader.js loads .env file                      │
│         (Firebase credentials loaded from .env)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           script.js initializes Firebase with                   │
│              environment variables from .env                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         checkAuthStatus() checks if user logged in              │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │                      │
         NOT LOGGED IN              LOGGED IN
                   │                      │
                   ▼                      ▼
            ┌────────────────┐    ┌──────────────────┐
            │  Show Auth Page │    │ Show Main App    │
            │  (Login Form)   │    │ (Dashboard)      │
            └────────────────┘    └──────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ User sees options:  │
        │ 1. LOGIN            │
        │ 2. REGISTER         │
        └─────┬───────────────┘
              │
              ├─────────────┬──────────────┐
              │             │              │
              ▼             ▼              ▼
          ┌─────────┐  ┌──────────┐  ┌──────────────┐
          │ LOGIN   │  │ SIGNUP   │  │ Form Switch  │
          └────┬────┘  └────┬─────┘  └──────────────┘
               │             │
               ▼             ▼
        ┌─────────────────────────────┐
        │   User Fills Form Fields    │
        │ (Email, Password, etc.)     │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  Form Validation            │
        │  - Email format             │
        │  - Password match (signup)  │
        │  - Min 6 characters         │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  Firebase Authentication    │
        │  - createUserWithEmail()    │
        │  - signInWithEmail()        │
        └────────────┬────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
          SUCCESS           ERROR
            │                 │
            ▼                 ▼
    ┌──────────────┐   ┌──────────────┐
    │ Show Success │   │ Show Error   │
    │ Modal Page   │   │ Message      │
    └──────┬───────┘   └──────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Continue Button  │
    │ (User clicks)    │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ showMainApp()    │
    │ Hide Auth Page   │
    │ Show Dashboard   │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ User in Dashboard            │
    │ - Can use all features       │
    │ - Can logout from sidebar    │
    └──────────────────────────────┘
```

---

## 🗂️ File Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      index.html                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Loads env-loader.js                                    │ │
│  │ 2. Loads Firebase libraries                               │ │
│  │ 3. Loads script.js (after env-loader)                     │ │
│  │ 4. Contains HTML structure:                               │ │
│  │    - Auth page (login, signup, success forms)             │ │
│  │    - Main container (hidden until auth)                   │ │
│  │    - Sidebar with logout button                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┼───────┐
       │       │       │
       ▼       ▼       ▼
    ┌──────────────────────────────────────────────────────────┐
    │           env-loader.js                                  │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ 1. Fetches .env file                                ││
    │  │ 2. Parses KEY=value format                           ││
    │  │ 3. Stores in envLoader.env object                    ││
    │  │ 4. Provides get(key, default) method                 ││
    │  │ 5. Provides getAll() method                          ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────┬────────────────────────────────────────────┘
                   │ Reads from:
                   ▼
    ┌──────────────────────────────────────────────────────────┐
    │               .env file (LOCAL ONLY)                     │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ FIREBASE_API_KEY=AIzaSy...                           ││
    │  │ FIREBASE_AUTH_DOMAIN=boxsim.firebaseapp.com          ││
    │  │ FIREBASE_DATABASE_URL=https://...                    ││
    │  │ FIREBASE_PROJECT_ID=boxsim                           ││
    │  │ FIREBASE_STORAGE_BUCKET=boxsim.firebasestorage.app   ││
    │  │ FIREBASE_MESSAGING_SENDER_ID=978064446117            ││
    │  │ FIREBASE_APP_ID=1:978064446117:web:...               ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────────────────────────────────────────────────┘
               │
               │ (Protected by .gitignore)
               │
    ┌──────────────────────────────────────────────────────────┐
    │              .env.example (IN REPOSITORY)                │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ FIREBASE_API_KEY=your_api_key_here                   ││
    │  │ FIREBASE_AUTH_DOMAIN=your_auth_domain_here           ││
    │  │ ... (placeholders only)                              ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────┐
    │              script.js (MAIN LOGIC)                      │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ 1. Waits for envLoader to load                       ││
    │  │ 2. Gets credentials from envLoader                   ││
    │  │ 3. Initializes Firebase                              ││
    │  │ 4. Sets up auth listeners                            ││
    │  │                                                       ││
    │  │ Auth Functions:                                       ││
    │  │ - checkAuthStatus()       - Checks if user logged in ││
    │  │ - handleLogin()           - Authenticates user       ││
    │  │ - handleSignup()          - Registers new user       ││
    │  │ - showAuthSuccess()       - Shows success modal      ││
    │  │ - continueToMain()        - Goes to dashboard        ││
    │  │ - logout()                - Signs out user           ││
    │  │ - switchForm()            - Switches login/signup    ││
    │  │ - showMainApp()           - Shows dashboard          ││
    │  │ - showAuthPage()          - Shows login page         ││
    │  │ - setupDataListeners()    - Sets up Firebase sync    ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────┬───────────────────────────────────────────┘
                   │ Communicates with:
                   ▼
    ┌──────────────────────────────────────────────────────────┐
    │           Firebase (Cloud Backend)                       │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ Authentication Service                               ││
    │  │ - firebase.auth()                                    ││
    │  │ - signInWithEmailAndPassword()                       ││
    │  │ - createUserWithEmailAndPassword()                   ││
    │  │ - signOut()                                          ││
    │  │ - onAuthStateChanged()                               ││
    │  │                                                       ││
    │  │ Realtime Database Service                            ││
    │  │ - firebase.database()                                ││
    │  │ - db.ref('path').set()                               ││
    │  │ - db.ref('path').on('value')                         ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────┐
    │              style.css (STYLING)                         │
    │  ┌──────────────────────────────────────────────────────┐│
    │  │ - .auth-page          (auth page container)          ││
    │  │ - .auth-box           (form box)                     ││
    │  │ - .auth-form          (form container)               ││
    │  │ - .form-group         (form field grouping)          ││
    │  │ - .error-message      (error display)                ││
    │  │ - .link-btn           (switch form button)           ││
    │  │ - Responsive styles for mobile/tablet               ││
    │  │ - Dark/Light theme support                          ││
    │  └──────────────────────────────────────────────────────┘│
    └──────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Registration

```
User Input (Form)
       │
       ▼
┌──────────────────────────┐
│  Validate Input          │
│  - Password length       │
│  - Password match        │
│  - Email format          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ handleSignup() Function  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ firebase.auth()                          │
│   .createUserWithEmailAndPassword()      │
│                                          │
│ Sends to Firebase:                       │
│ - email                                  │
│ - password                               │
└──────────┬───────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
  SUCCESS       ERROR
    │             │
    ▼             ▼
┌───────────┐  ┌─────────────────┐
│ User      │  │ Show error msg  │
│ Created   │  │ in form         │
└─────┬─────┘  └─────────────────┘
      │
      ▼
┌───────────────────────────┐
│ updateProfile()           │
│ - Set displayName         │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────────────┐
│ db.ref('users/{uid}')     │
│ .set({...userData})       │
│                           │
│ Save to database:         │
│ - username                │
│ - email                   │
│ - createdAt               │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────────────┐
│ showAuthSuccess()         │
│ Show success modal        │
└───────────────────────────┘
```

---

## 🔒 Security Considerations

```
┌─────────────────────────────────────────────────────────┐
│                    API KEY SECURITY                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ PROTECTED BY:                                        │
│                                                         │
│ 1. .env File (Local Development)                       │
│    └─ Stored on your machine only                      │
│    └─ Not committed to git                             │
│                                                         │
│ 2. .gitignore                                           │
│    └─ Prevents .env from being committed               │
│    └─ Blocks accidental exposure                       │
│                                                         │
│ 3. env-loader.js                                        │
│    └─ Dynamically loads credentials                    │
│    └─ Fallback values prevent errors                   │
│                                                         │
│ 4. Hosting Platform Env Vars (Production)              │
│    └─ Vercel, Netlify, Firebase Hosting                │
│    └─ Not exposed in code                              │
│                                                         │
│ 5. Firebase Security Rules                             │
│    └─ Restricts data access to authenticated users     │
│    └─ Prevents unauthorized database reads/writes      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT SIDE (Browser)                     │
│  ┌──────────────────────────────────────────────────────────┤
│  │                                                           │
│  │  HTML (index.html)                                       │
│  │  ├─ Auth Page                                            │
│  │  │  ├─ Login Form                                        │
│  │  │  ├─ Signup Form                                       │
│  │  │  └─ Success Modal                                     │
│  │  │                                                        │
│  │  └─ Main App                                             │
│  │     ├─ Dashboard                                         │
│  │     ├─ Nodes                                             │
│  │     └─ Database                                          │
│  │                                                           │
│  │  JavaScript (script.js)                                  │
│  │  ├─ Authentication Logic                                │
│  │  ├─ Form Handling                                        │
│  │  ├─ UI Rendering                                         │
│  │  └─ Firebase Communication                              │
│  │                                                           │
│  │  Environment Loader (env-loader.js)                     │
│  │  └─ Loads and manages API credentials                   │
│  │                                                           │
│  │  Styling (style.css)                                     │
│  │  └─ All visual presentation                              │
│  │                                                           │
│  └──────────────────────────────────────────────────────────┤
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/HTTPS
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   SERVER SIDE (Firebase)                    │
│  ┌──────────────────────────────────────────────────────────┤
│  │                                                           │
│  │  Authentication Service                                  │
│  │  ├─ User Registration                                    │
│  │  ├─ User Login                                           │
│  │  ├─ Session Management                                   │
│  │  └─ Token Generation                                     │
│  │                                                           │
│  │  Realtime Database                                       │
│  │  ├─ User Profiles                                        │
│  │  ├─ Inventory Data                                       │
│  │  └─ Real-time Synchronization                            │
│  │                                                           │
│  │  Security Rules                                          │
│  │  ├─ Authentication Required                              │
│  │  └─ Data Access Control                                  │
│  │                                                           │
│  └──────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
```

---

**Key Points:**
- ✅ Credentials stored in `.env` locally
- ✅ Environment variables loaded dynamically
- ✅ Firebase handles authentication securely
- ✅ Real-time database syncs data
- ✅ Security rules enforce access control
- ✅ Production uses hosting platform env vars
