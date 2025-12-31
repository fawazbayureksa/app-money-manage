# 🔥 Firebase Setup Guide

## Prerequisites

1. Node.js installed
2. Firebase account created
3. Firebase project created in console

---

## Step 1: Install Dependencies

```bash
# Install Firebase SDK (v9+ modular)
npx expo install firebase

# Install Expo notification packages for FCM
npx expo install expo-notifications expo-device expo-constants

# Install async storage (already installed)
# @react-native-async-storage/async-storage
```

---

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Name it: "money-manage-app"
4. Disable Google Analytics (optional)
5. Create project

---

## Step 3: Add Web App to Firebase

1. In Firebase Console, click "Web" icon (</>)
2. Register app: "Money Manage Web"
3. Copy the configuration object
4. **Do NOT check** "Also set up Firebase Hosting"

You'll get something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "money-manage-app.firebaseapp.com",
  projectId: "money-manage-app",
  storageBucket: "money-manage-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## Step 4: Configure Environment Variables

### Update `.env` file:
```bash
# API Configuration (keep for gradual migration)
API_URL=http://34.158.34.129:8080/api

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=money-manage-app.firebaseapp.com
FIREBASE_PROJECT_ID=money-manage-app
FIREBASE_STORAGE_BUCKET=money-manage-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Feature Flags
USE_FIREBASE_AUTH=false
USE_FIREBASE_CATEGORIES=false
USE_FIREBASE_TRANSACTIONS=false
USE_FIREBASE_BUDGETS=false
```

### Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://34.158.34.129:8080/api",
      "firebase": {
        "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
        "authDomain": "money-manage-app.firebaseapp.com",
        "projectId": "money-manage-app",
        "storageBucket": "money-manage-app.appspot.com",
        "messagingSenderId": "123456789",
        "appId": "1:123456789:web:abcdef123456"
      },
      "features": {
        "useFirebaseAuth": false,
        "useFirebaseCategories": false,
        "useFirebaseTransactions": false,
        "useFirebaseBudgets": false
      }
    }
  }
}
```

---

## Step 5: Enable Firebase Services

### Authentication
1. In Firebase Console → Authentication
2. Click "Get Started"
3. Sign-in method → Email/Password → Enable
4. Save

### Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location (closest to users)
5. Enable

### Cloud Storage (Optional for now)
1. In Firebase Console → Storage
2. Click "Get Started"
3. Start in production mode

### Cloud Messaging
1. In Firebase Console → Cloud Messaging
2. No additional setup needed for now

---

## Step 6: Install Firebase CLI

```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
cd /path/to/your/project
firebase init

# Select:
# - Firestore: Configure rules and indexes
# - Functions: Cloud Functions
# - Hosting: No (unless you want web hosting)
# - Storage: Configure security rules
# - Emulators: Yes (for local testing)

# Choose existing project: money-manage-app
```

This creates:
- `firebase.json` - Firebase configuration
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Composite indexes
- `functions/` - Cloud Functions directory

---

## Step 7: Configure Firestore Indexes

Edit `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "budgets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "budget_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Step 8: Set Up Firebase Emulators (Local Testing)

Edit `firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

Start emulators:
```bash
firebase emulators:start
```

Access emulator UI at `http://localhost:4000`

---

## Step 9: Configure Expo for Firebase

The configuration files have been created in your project:
- `src/config/firebase.ts` - Firebase initialization
- `src/config/features.ts` - Feature flags
- See the implementation files for details

---

## Step 10: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy all
firebase deploy
```

---

## Step 11: Test Firebase Connection

Create a test script:
```typescript
// scripts/testFirebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    console.log('✅ Firebase connected successfully!');
    console.log(`Found ${snapshot.size} categories`);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

test();
```

Run:
```bash
npx ts-node scripts/testFirebase.ts
```

---

## Step 12: Enable Offline Persistence (Optional)

In your app initialization:
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from './config/firebase';

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence disabled');
    } else if (err.code == 'unimplemented') {
      console.log('Browser doesn't support persistence');
    }
  });
```

---

## Step 13: Configure FCM for Push Notifications

### For Expo Managed Workflow:

1. Get FCM Server Key from Firebase Console
2. Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### Download Config Files:
1. Firebase Console → Project Settings
2. Download `google-services.json` (Android)
3. Download `GoogleService-Info.plist` (iOS)
4. Place in project root

---

## Troubleshooting

### Issue: "Firebase not initialized"
**Solution**: Ensure firebase is imported and initialized before use

### Issue: "Permission denied" errors
**Solution**: Check Firestore security rules, ensure user is authenticated

### Issue: "Index not found"
**Solution**: Deploy indexes with `firebase deploy --only firestore:indexes`

### Issue: Emulator connection issues
**Solution**: Update firebase config to point to emulators:
```typescript
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

---

## Next Steps

1. ✅ Firebase project created and configured
2. ✅ Environment variables set
3. ✅ Indexes deployed
4. ✅ Security rules deployed
5. → Start implementing Firebase Auth (Phase 1)
6. → Gradually migrate features

---

## Useful Commands

```bash
# Deploy everything
firebase deploy

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Functions
firebase deploy --only functions

# Start emulators
firebase emulators:start

# View logs
firebase functions:log

# Set environment variables for Functions
firebase functions:config:set api.key="YOUR_KEY"

# Check Firestore usage
# Go to Firebase Console → Usage and billing
```

---

## Security Checklist

- [ ] Security rules deployed
- [ ] API keys stored in environment variables
- [ ] Firebase config not hardcoded
- [ ] Indexes created for all queries
- [ ] Rate limiting considered
- [ ] User data isolated (userId in all documents)
- [ ] Sensitive operations in Cloud Functions
- [ ] Email verification enabled (optional)

---

Ready to start migrating! 🚀
