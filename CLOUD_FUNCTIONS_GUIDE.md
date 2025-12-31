# Cloud Functions Implementation Guide

## Overview
Cloud Functions handle server-side logic, calculations, and secure operations that shouldn't run on the client.

## Setup

```bash
# Initialize functions (if not already done)
firebase init functions

# Choose TypeScript
# Install dependencies
cd functions
npm install
```

---

## Function 1: Calculate Budget Spending

**Trigger**: Transaction create/update/delete  
**Purpose**: Update budget `spentAmount` when transactions change

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Triggered when a transaction is created
export const onTransactionCreated = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    
    // Only process expense transactions
    if (transaction.type !== 'expense') {
      return null;
    }

    const userId = transaction.userId;
    const categoryId = transaction.categoryId;
    const amount = transaction.amount;
    const transactionDate = transaction.date.toDate();

    // Find active budgets for this category
    const budgetsSnapshot = await db
      .collection('budgets')
      .where('userId', '==', userId)
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .get();

    const updatePromises: Promise<any>[] = [];

    budgetsSnapshot.forEach((budgetDoc) => {
      const budget = budgetDoc.data();
      const startDate = budget.startDate.toDate();
      const endDate = budget.endDate.toDate();

      // Check if transaction is within budget period
      if (transactionDate >= startDate && transactionDate <= endDate) {
        const newSpentAmount = (budget.spentAmount || 0) + amount;
        const percentageUsed = (newSpentAmount / budget.amount) * 100;

        updatePromises.push(
          budgetDoc.ref.update({
            spentAmount: newSpentAmount,
            percentageUsed,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
        );

        // Check if alert threshold is reached
        if (percentageUsed >= budget.alertAt && !budget.alertSent) {
          updatePromises.push(
            createBudgetAlert(userId, budgetDoc.id, budget, newSpentAmount, percentageUsed)
          );
          updatePromises.push(
            budgetDoc.ref.update({ alertSent: true })
          );
        }
      }
    });

    await Promise.all(updatePromises);
    return null;
  });

// Triggered when a transaction is deleted
export const onTransactionDeleted = functions.firestore
  .document('transactions/{transactionId}')
  .onDelete(async (snap, context) => {
    const transaction = snap.data();
    
    if (transaction.type !== 'expense') {
      return null;
    }

    const userId = transaction.userId;
    const categoryId = transaction.categoryId;
    const amount = transaction.amount;
    const transactionDate = transaction.date.toDate();

    // Find active budgets for this category
    const budgetsSnapshot = await db
      .collection('budgets')
      .where('userId', '==', userId)
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .get();

    const updatePromises: Promise<any>[] = [];

    budgetsSnapshot.forEach((budgetDoc) => {
      const budget = budgetDoc.data();
      const startDate = budget.startDate.toDate();
      const endDate = budget.endDate.toDate();

      if (transactionDate >= startDate && transactionDate <= endDate) {
        const newSpentAmount = Math.max(0, (budget.spentAmount || 0) - amount);
        const percentageUsed = (newSpentAmount / budget.amount) * 100;

        updatePromises.push(
          budgetDoc.ref.update({
            spentAmount: newSpentAmount,
            percentageUsed,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
        );
      }
    });

    await Promise.all(updatePromises);
    return null;
  });

// Helper function to create budget alert
async function createBudgetAlert(
  userId: string,
  budgetId: string,
  budget: any,
  spentAmount: number,
  percentage: number
) {
  const alertData = {
    userId,
    budgetId,
    categoryId: budget.categoryId,
    categoryName: budget.categoryName,
    budgetAmount: budget.amount,
    spentAmount,
    percentage: Math.round(percentage),
    message: `You've spent ${Math.round(percentage)}% of your ${budget.categoryName} budget`,
    isRead: false,
    notificationSent: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  const alertRef = await db.collection('budget_alerts').add(alertData);
  
  // Trigger push notification
  await sendBudgetAlertNotification(userId, alertData);
  
  return alertRef;
}
```

---

## Function 2: Send Push Notifications

**Trigger**: Budget alert created  
**Purpose**: Send FCM notification to user

```typescript
// functions/src/index.ts (continued)

// Triggered when a budget alert is created
export const onBudgetAlertCreated = functions.firestore
  .document('budget_alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    
    if (alert.notificationSent) {
      return null; // Already sent
    }

    await sendBudgetAlertNotification(alert.userId, alert);
    
    // Mark as sent
    await snap.ref.update({
      notificationSent: true,
    });

    return null;
  });

async function sendBudgetAlertNotification(userId: string, alert: any) {
  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.fcmToken) {
      console.log('No FCM token for user:', userId);
      return;
    }

    const message = {
      notification: {
        title: '💰 Budget Alert',
        body: alert.message,
      },
      data: {
        type: 'budget_alert',
        alertId: alert.budgetId,
        categoryName: alert.categoryName,
      },
      token: userData.fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Notification sent to user:', userId);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
```

---

## Function 3: Scheduled Budget Check

**Trigger**: Daily at midnight  
**Purpose**: Check all active budgets and create alerts

```typescript
// functions/src/index.ts (continued)

export const dailyBudgetCheck = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Running daily budget check...');
    
    const now = new Date();
    
    // Get all active budgets
    const budgetsSnapshot = await db
      .collection('budgets')
      .where('isActive', '==', true)
      .get();

    const checkPromises: Promise<any>[] = [];

    budgetsSnapshot.forEach((budgetDoc) => {
      const budget = budgetDoc.data();
      const endDate = budget.endDate.toDate();
      
      // Check if budget period is ending
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 3 && daysRemaining > 0) {
        // Create reminder alert
        const reminderData = {
          userId: budget.userId,
          budgetId: budgetDoc.id,
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          budgetAmount: budget.amount,
          spentAmount: budget.spentAmount || 0,
          percentage: budget.percentageUsed || 0,
          message: `Your ${budget.categoryName} budget ends in ${daysRemaining} days`,
          isRead: false,
          notificationSent: false,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        checkPromises.push(
          db.collection('budget_alerts').add(reminderData)
        );
      }
      
      // Deactivate expired budgets
      if (daysRemaining < 0) {
        checkPromises.push(
          budgetDoc.ref.update({
            isActive: false,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
        );
      }
    });

    await Promise.all(checkPromises);
    console.log(`Processed ${budgetsSnapshot.size} budgets`);
    
    return null;
  });
```

---

## Function 4: User Data Aggregation

**Trigger**: HTTP request  
**Purpose**: Calculate dashboard statistics

```typescript
// functions/src/index.ts (continued)

export const getDashboardStats = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const startDate = data.startDate ? new Date(data.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = data.endDate ? new Date(data.endDate) : new Date();

  try {
    // Get transactions for the period
    const transactionsSnapshot = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .get();

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending: { [key: string]: number } = {};
    const dailySpending: { [key: string]: number } = {};

    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      const amount = transaction.amount;
      const date = transaction.date.toDate().toISOString().split('T')[0];

      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        
        // Category breakdown
        categorySpending[transaction.categoryName] = 
          (categorySpending[transaction.categoryName] || 0) + amount;
        
        // Daily breakdown
        dailySpending[date] = (dailySpending[date] || 0) + amount;
      }
    });

    // Get active budgets
    const budgetsSnapshot = await db
      .collection('budgets')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const budgets = budgetsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totals: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      categorySpending,
      dailySpending,
      budgets,
      transactionCount: transactionsSnapshot.size,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate statistics');
  }
});
```

---

## Function 5: Data Export

**Trigger**: HTTP request  
**Purpose**: Export user data to CSV

```typescript
// functions/src/index.ts (continued)

export const exportTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const format = data.format || 'json'; // json or csv

  try {
    const transactionsSnapshot = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    const transactions = transactionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date.toDate().toISOString().split('T')[0],
        description: data.description,
        category: data.categoryName,
        bank: data.bankName,
        type: data.type,
        amount: data.amount,
      };
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'Description', 'Category', 'Bank', 'Type', 'Amount'];
      const rows = transactions.map((t) => [
        t.date,
        t.description,
        t.category,
        t.bank,
        t.type,
        t.amount,
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      return { format: 'csv', data: csvContent };
    }

    return { format: 'json', data: transactions };
  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export data');
  }
});
```

---

## Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:onTransactionCreated

# View logs
firebase functions:log

# Delete a function
firebase functions:delete functionName
```

---

## Testing Functions Locally

```bash
# Start emulators
firebase emulators:start

# Functions will run on http://localhost:5001
```

---

## Environment Variables for Functions

```bash
# Set config
firebase functions:config:set api.key="YOUR_API_KEY"

# Get config
firebase functions:config:get

# Use in functions
const apiKey = functions.config().api.key;
```

---

## Best Practices

1. **Error Handling**: Always catch and log errors
2. **Idempotency**: Functions should be idempotent (safe to retry)
3. **Timeouts**: Keep execution time under 60 seconds
4. **Costs**: Monitor invocations and optimize
5. **Security**: Verify authentication in HTTP functions
6. **Testing**: Test with emulators before deploying

---

## Calling Functions from App

```typescript
// src/services/functionsService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const functionsService = {
  getDashboardStats: async (startDate: string, endDate: string) => {
    if (!functions) throw new Error('Functions not initialized');
    
    const getDashboardStatsFunc = httpsCallable(functions, 'getDashboardStats');
    const result = await getDashboardStatsFunc({ startDate, endDate });
    return result.data;
  },

  exportTransactions: async (format: 'json' | 'csv' = 'json') => {
    if (!functions) throw new Error('Functions not initialized');
    
    const exportFunc = httpsCallable(functions, 'exportTransactions');
    const result = await exportFunc({ format });
    return result.data;
  },
};
```

---

## Cost Estimation

- **Free tier**: 2 million invocations/month
- **Compute time**: 400,000 GB-seconds/month free
- **Network egress**: 5GB/month free

For this app with 1,000 users:
- Estimated invocations: ~50,000/month
- **Cost**: $0-5/month

---

Next: Deploy Security Rules and test the system end-to-end!
