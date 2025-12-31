# 🚀 Firebase Implementation Guide - Step by Step

## Phase 0: Prerequisites & Setup ✅

### 1. Install Required Packages

```bash
# Install Firebase SDK
npx expo install firebase

# Already installed:
# - expo-constants
# - @react-native-async-storage/async-storage

# For push notifications (Phase 5)
npx expo install expo-notifications expo-device
```

### 2. Update app.json

Add Firebase configuration to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://34.158.34.129:8080/api",
      "firebase": {
        "apiKey": "YOUR_FIREBASE_API_KEY",
        "authDomain": "your-project.firebaseapp.com",
        "projectId": "your-project-id",
        "storageBucket": "your-project.appspot.com",
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

### 3. Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 4. Verify Setup

```bash
# Start your app
npx expo start --clear

# Check console logs:
# ✅ Firebase initialized successfully
# 🎛️ Feature Flags Status
```

---

## Phase 1: Migrate Authentication 🔐

### Step 1.1: Enable Feature Flag

Update `app.json`:
```json
"features": {
  "useFirebaseAuth": true,  // ← Change to true
  "useFirebaseCategories": false,
  "useFirebaseTransactions": false,
  "useFirebaseBudgets": false
}
```

### Step 1.2: Update App Entry Point

Update `app/_layout.tsx` (or your root layout):

```typescript
// Before:
import { AuthProvider } from '../src/context/AuthContext';

// After:
import { HybridAuthProvider, useAuth } from '../src/context/HybridAuthContext';

export default function RootLayout() {
  return (
    <HybridAuthProvider>
      {/* Your app content */}
    </HybridAuthProvider>
  );
}
```

### Step 1.3: Update Auth Hook Usage

In all screens that use auth, update the import:

```typescript
// Before:
import { useAuth } from '../context/AuthContext';

// After:
import { useAuth } from '../context/HybridAuthContext';

// Usage remains the same:
const { user, login, logout, isAuthenticated } = useAuth();
```

### Step 1.4: Test Authentication

1. Clear app data
2. Try registering a new user
3. Check Firebase Console → Authentication
4. Try logging in
5. Test logout
6. Test app restart (persistence)

### Step 1.5: Monitor and Roll Back if Needed

```typescript
// If issues occur, quickly rollback:
"features": {
  "useFirebaseAuth": false,  // ← Back to REST API
}
```

**Success Criteria**:
- ✅ New users can register
- ✅ Users can login
- ✅ Session persists after app restart
- ✅ Logout works correctly
- ✅ No authentication errors

---

## Phase 2: Migrate Categories 📁

### Step 2.1: Create Hybrid Category Service

Create `src/api/hybridCategoryService.ts`:

```typescript
import { FEATURE_FLAGS } from '../config/features';
import categoryService from './categoryService';
import firebaseCategoryService from '../services/firebaseCategoryService';

export const getCategories = async () => {
  if (FEATURE_FLAGS.useFirebaseCategories) {
    return await firebaseCategoryService.getCategories();
  } else {
    return await categoryService.getCategories();
  }
};

export const createCategory = async (categoryData: any) => {
  if (FEATURE_FLAGS.useFirebaseCategories) {
    return await firebaseCategoryService.createCategory(categoryData);
  } else {
    return await categoryService.createCategory(categoryData);
  }
};

export const updateCategory = async (categoryId: any, categoryData: any) => {
  if (FEATURE_FLAGS.useFirebaseCategories) {
    return await firebaseCategoryService.updateCategory(categoryId, categoryData);
  } else {
    return await categoryService.updateCategory(categoryId, categoryData);
  }
};

export const deleteCategory = async (categoryId: any) => {
  if (FEATURE_FLAGS.useFirebaseCategories) {
    return await firebaseCategoryService.deleteCategory(categoryId);
  } else {
    return await categoryService.deleteCategory(categoryId);
  }
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
```

### Step 2.2: Update Category Screens

Update `src/screens/Category/CategoryListScreen.tsx`:

```typescript
// Before:
import categoryService from '../../api/categoryService';

// After:
import hybridCategoryService from '../../api/hybridCategoryService';

// Replace all categoryService calls with hybridCategoryService
const loadCategories = async () => {
  const response = await hybridCategoryService.getCategories();
  // ...
};
```

Do the same for `AddCategoryScreen.tsx`.

### Step 2.3: Add Real-time Updates (Optional Enhancement)

If using Firebase, add real-time listener:

```typescript
useEffect(() => {
  if (FEATURE_FLAGS.useFirebaseCategories) {
    // Real-time updates
    const unsubscribe = firebaseCategoryService.subscribeToCategories(
      (categories) => {
        setCategories(categories);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setError(error.message);
      }
    );
    
    return () => unsubscribe();
  } else {
    // Manual load
    loadCategories();
  }
}, []);
```

### Step 2.4: Enable Feature Flag

Update `app.json`:
```json
"features": {
  "useFirebaseAuth": true,
  "useFirebaseCategories": true,  // ← Enable
  "useFirebaseTransactions": false,
  "useFirebaseBudgets": false
}
```

### Step 2.5: Data Migration (Important!)

Create a migration script:

```typescript
// scripts/migrateCategories.ts
import { auth, db } from '../src/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import apiClient from '../src/api/client';

async function migrateUserCategories(email: string, password: string) {
  try {
    // 1. Login with Firebase
    const userCredential = await signInWithEmailAndPassword(auth!, email, password);
    const userId = userCredential.user.uid;
    
    console.log('Logged in:', userId);
    
    // 2. Fetch categories from REST API
    const response = await apiClient.get('/categories');
    const categories = response.data.data;
    
    console.log(`Found ${categories.length} categories to migrate`);
    
    // 3. Write to Firestore
    for (const category of categories) {
      await addDoc(collection(db!, 'categories'), {
        userId,
        name: category.CategoryName,
        description: category.Description,
        isDefault: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      console.log(`✅ Migrated: ${category.CategoryName}`);
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Usage:
// migrateUserCategories('user@example.com', 'password');
```

**Test Categories**:
- ✅ Can view existing categories
- ✅ Can create new category
- ✅ Can update category
- ✅ Can delete category
- ✅ Real-time updates work (if implemented)

---

## Phase 3: Migrate Transactions 💸

### Step 3.1: Create Hybrid Transaction Service

Similar to categories, create `src/api/hybridTransactionService.ts`:

```typescript
import { FEATURE_FLAGS } from '../config/features';
import transactionService from './transactionService';
import firebaseTransactionService from '../services/firebaseTransactionService';

export const getTransactions = async (params?: any) => {
  if (FEATURE_FLAGS.useFirebaseTransactions) {
    return await firebaseTransactionService.getTransactions(params);
  } else {
    return await transactionService.getTransactions(params);
  }
};

export const createTransaction = async (data: any) => {
  if (FEATURE_FLAGS.useFirebaseTransactions) {
    return await firebaseTransactionService.createTransaction(data);
  } else {
    return await transactionService.createTransaction(data);
  }
};

export const deleteTransaction = async (id: any) => {
  if (FEATURE_FLAGS.useFirebaseTransactions) {
    return await firebaseTransactionService.deleteTransaction(id);
  } else {
    return await transactionService.deleteTransaction(id);
  }
};

export default {
  getTransactions,
  createTransaction,
  deleteTransaction,
};
```

### Step 3.2: Update Transaction Screens

Update imports in:
- `src/screens/Transaction/TransactionListScreen.tsx`
- `src/screens/Transaction/AddTransactionScreen.tsx`
- `src/screens/Home/HomeScreen.tsx`

```typescript
// Replace:
import transactionService from '../../api/transactionService';

// With:
import hybridTransactionService from '../../api/hybridTransactionService';
```

### Step 3.3: Add Real-time Updates

```typescript
useEffect(() => {
  if (FEATURE_FLAGS.useFirebaseTransactions) {
    const unsubscribe = firebaseTransactionService.subscribeToTransactions(
      (transactions) => {
        setTransactions(transactions);
        setLoading(false);
      },
      (error) => {
        console.error(error);
      },
      filters
    );
    
    return () => unsubscribe();
  } else {
    loadTransactions();
  }
}, [filters]);
```

### Step 3.4: Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions:onTransactionCreated,functions:onTransactionDeleted
```

### Step 3.5: Enable Feature Flag

```json
"features": {
  "useFirebaseAuth": true,
  "useFirebaseCategories": true,
  "useFirebaseTransactions": true,  // ← Enable
  "useFirebaseBudgets": false
}
```

### Step 3.6: Migrate Transaction Data

```typescript
// scripts/migrateTransactions.ts
async function migrateUserTransactions(email: string, password: string) {
  // Similar to category migration
  // Fetch from REST API and write to Firestore
  // Remember to convert transaction_type: 1/2 → 'income'/'expense'
}
```

**Test Transactions**:
- ✅ Can view transactions
- ✅ Can create transaction
- ✅ Can delete transaction
- ✅ Real-time updates work
- ✅ Budget calculations trigger (Cloud Functions)

---

## Phase 4: Migrate Budgets & Alerts 💰

### Step 4.1: Create Firebase Budget Service

The service file already exists at:
- `src/services/firebaseBudgetService.ts` (create similarly to categories)

### Step 4.2: Create Hybrid Services

```typescript
// src/api/hybridBudgetService.ts
// ... similar pattern as before
```

### Step 4.3: Update Budget Screens

Update imports in:
- `src/screens/Budget/BudgetListScreen.tsx`
- `src/screens/Budget/AddBudgetScreen.tsx`
- `src/screens/Alerts/AlertListScreen.tsx`

### Step 4.4: Deploy Budget Cloud Functions

```bash
firebase deploy --only functions:dailyBudgetCheck,functions:onBudgetAlertCreated
```

### Step 4.5: Enable Feature Flags

```json
"features": {
  "useFirebaseAuth": true,
  "useFirebaseCategories": true,
  "useFirebaseTransactions": true,
  "useFirebaseBudgets": true,  // ← Enable
  "useFirebaseAlerts": true     // ← Enable
}
```

**Test Budgets**:
- ✅ Can create budget
- ✅ Budget spending updates automatically
- ✅ Alerts created when threshold reached
- ✅ Can view alerts
- ✅ Can mark alerts as read

---

## Phase 5: Push Notifications 🔔

### Step 5.1: Configure FCM in app.json

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.yourcompany.moneymanage"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.yourcompany.moneymanage"
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

### Step 5.2: Create Notifications Service

```typescript
// src/services/notificationsService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);

  // Save to Firestore
  if (auth?.currentUser && db) {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      fcmToken: token,
      platform: Platform.OS,
    });
  }

  return token;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Step 5.3: Register on Login

Update `FirebaseAuthContext.tsx`:

```typescript
import { registerForPushNotifications } from '../services/notificationsService';

// In onAuthStateChanged callback, after user is authenticated:
if (firebaseUser) {
  // ... existing code ...
  
  // Register for push notifications
  registerForPushNotifications().catch(console.error);
}
```

### Step 5.4: Test Notifications

```bash
# Deploy notification function
firebase deploy --only functions:onBudgetAlertCreated

# Create a budget alert (trigger manually or wait for threshold)
# Check if notification appears on device
```

---

## Phase 6: Cleanup & Optimization 🧹

### Step 6.1: Remove REST API Dependencies

Once all features are migrated and tested:

```typescript
// Delete old services:
// - src/api/categoryService.ts
// - src/api/transactionService.ts
// - src/api/budgetService.ts
// - src/api/alertService.ts
// - src/context/AuthContext.tsx (keep Firebase version only)

// Remove feature flags:
// - src/config/features.ts (or set all to true)
// - Remove hybrid services
```

### Step 6.2: Remove app.json Extra Config

```json
{
  "expo": {
    "extra": {
      // Remove apiUrl
      // Remove features flags
      // Keep only firebase config
      "firebase": { ... }
    }
  }
}
```

### Step 6.3: Update Imports

Replace all hybrid service imports with Firebase services:

```typescript
// Before:
import hybridCategoryService from './api/hybridCategoryService';

// After:
import firebaseCategoryService from './services/firebaseCategoryService';
```

### Step 6.4: Performance Testing

```bash
# Test with:
# - 100+ transactions
# - Multiple categories
# - Active budgets
# - Real-time updates
# - Offline mode
# - Poor network conditions
```

### Step 6.5: Security Audit

- [ ] Test Firestore security rules
- [ ] Verify users can't access others' data
- [ ] Test with multiple user accounts
- [ ] Check Cloud Function authentication
- [ ] Review API keys in version control (.gitignore)

---

## Monitoring & Maintenance 📊

### Firebase Console Checks

**Daily**:
- Authentication errors
- Firestore read/write counts
- Cloud Function invocations
- Crashlytics reports (if enabled)

**Weekly**:
- Cost analysis
- Performance metrics
- User feedback
- Error logs

### Cost Alerts

Set up budget alerts in Firebase Console:
1. Go to Firebase Console → Usage and Billing
2. Set budget alerts at $10, $20, $50
3. Monitor daily usage

### Performance Monitoring

```typescript
// Add Firebase Performance Monitoring
npx expo install firebase/performance

// Track custom traces
import { trace } from 'firebase/performance';

const loadTransactionsTrace = trace(perf, 'load_transactions');
loadTransactionsTrace.start();
await firebaseTransactionService.getTransactions();
loadTransactionsTrace.stop();
```

---

## Troubleshooting 🔧

### Common Issues

**Issue**: "Firebase not initialized"
```typescript
// Solution: Check app.json configuration
// Ensure all Firebase config values are set
console.log(firebaseConfig);
```

**Issue**: "Permission denied" in Firestore
```typescript
// Solution: Check security rules
// Ensure user is authenticated
// Verify userId matches in document
```

**Issue**: "Index required" error
```typescript
// Solution: Click the link in error message
// Or deploy indexes: firebase deploy --only firestore:indexes
```

**Issue**: Real-time listener not updating
```typescript
// Solution: Check if unsubscribe is called properly
useEffect(() => {
  const unsubscribe = onSnapshot(/* ... */);
  return () => unsubscribe(); // ← Important!
}, []);
```

---

## Success Checklist ✅

### Authentication
- [ ] Users can register
- [ ] Users can login
- [ ] Session persists
- [ ] Password reset works
- [ ] Email verification works (optional)

### Data Operations
- [ ] All CRUD operations work
- [ ] Real-time updates functional
- [ ] Offline mode works
- [ ] Data syncs after reconnection
- [ ] No permission errors

### Business Logic
- [ ] Budget calculations accurate
- [ ] Alerts triggered correctly
- [ ] Cloud Functions executing
- [ ] Push notifications delivered

### Performance
- [ ] App loads in < 2 seconds
- [ ] Queries return in < 500ms
- [ ] No memory leaks
- [ ] Works with poor network
- [ ] Battery usage acceptable

### Security
- [ ] Users isolated (can't see others' data)
- [ ] Security rules enforced
- [ ] API keys not exposed
- [ ] Authentication required
- [ ] Input validation working

### Cost
- [ ] Within budget ($15-20/month for 1000 users)
- [ ] Budget alerts configured
- [ ] Query limits implemented
- [ ] No runaway costs

---

## Next Steps

1. **Test thoroughly** with real users
2. **Monitor metrics** in Firebase Console
3. **Gather feedback** on performance
4. **Optimize queries** based on usage patterns
5. **Add analytics** for user behavior insights

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

---

🎉 **Congratulations!** Your app is now running on Firebase with real-time capabilities, better security, and improved scalability!
