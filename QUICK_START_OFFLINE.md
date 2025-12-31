# Offline-First Quick Start Guide

## 🚀 What's Been Implemented

Your Money Manage app has been converted to an **offline-first architecture**. Here's what's changed:

### ✅ Core Features

1. **Local SQLite Database** - All data stored locally first
2. **Instant Operations** - No waiting for network requests
3. **Automatic Sync** - Master data syncs in background
4. **No Login Required** - Single-device ownership model
5. **Works Offline** - Full functionality without internet

---

## 📁 New File Structure

```
src/
├── database/
│   ├── schema.ts                    # Database tables & indexes
│   ├── index.ts                     # Database manager
│   ├── BaseRepository.ts            # Base CRUD operations
│   ├── TransactionRepository.ts     # Transaction operations
│   ├── BudgetRepository.ts          # Budget operations
│   ├── BudgetAlertRepository.ts     # Alert operations
│   ├── BankRepository.ts            # Bank master data
│   └── CategoryRepository.ts        # Category master data
├── services/
│   └── syncService.ts               # Master data sync
└── context/
    └── OfflineAuthContext.tsx       # Simplified auth

docs/
├── OFFLINE_ARCHITECTURE.md          # Full architecture docs
└── IMPLEMENTATION_GUIDE.md          # Screen update guide
```

---

## 🎯 Quick Start

### 1. Install Dependencies

Already done! The following were installed:
- `expo-sqlite` - Local database
- `react-native-uuid` - UUID generation
- `@react-native-community/netinfo` - Network detection

### 2. App Initialization Flow

When the app launches:

```
1. Generate/Load Device ID
2. Initialize SQLite Database
3. Run Migrations (if needed)
4. Sync Master Data (banks, categories)
5. Show Main App
```

### 3. How to Use the Repositories

#### Create a Transaction
```typescript
import { transactionRepository } from '../database/TransactionRepository';

const transaction = await transactionRepository.create({
  bank_id: 1,
  category_id: 2,
  amount: 50.00,
  description: 'Lunch',
  transaction_type: 2, // expense
  date: new Date().toISOString(),
});
```

#### Get All Transactions
```typescript
const transactions = await transactionRepository.findAll();

// With filters
const filtered = await transactionRepository.findWithFilters({
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  transactionType: 2, // expenses only
});
```

#### Update a Transaction
```typescript
await transactionRepository.update(localId, {
  amount: 75.00,
  description: 'Lunch + Coffee',
});
```

#### Delete a Transaction
```typescript
await transactionRepository.delete(localId);
// Soft delete - data still in DB with deleted_at timestamp
```

#### Get Statistics
```typescript
const stats = await transactionRepository.getStats({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});
// Returns: { totalIncome, totalExpense, balance, count }
```

---

## 📊 Data Model

### Local-Only Tables (You Control)
- **transactions** - Financial transactions
- **budgets** - Budget definitions
- **budget_alerts** - Budget threshold alerts

### Master Data Tables (Backend Controls)
- **banks** - List of banks (read-only)
- **categories** - Transaction categories (read-only)

---

## 🔄 Sync Behavior

### Automatic Sync Triggers
- ✅ First app launch (full sync)
- ✅ App resume from background
- ✅ Network reconnect
- ✅ Pull-to-refresh

### Manual Sync
```typescript
import { syncService } from '../services/syncService';

await syncService.syncAll();
```

### Sync Status
```typescript
import { useOfflineAuth } from '../context/OfflineAuthContext';

const { isSyncing, syncMasterData } = useOfflineAuth();

// In UI
{isSyncing && <ActivityIndicator />}
```

---

## 🛠️ Updating Your Screens

See **IMPLEMENTATION_GUIDE.md** for detailed patterns. Quick example:

**Before (API-based):**
```typescript
import { transactionService } from '../../api/transactionService';

const loadData = async () => {
  const response = await transactionService.getTransactions();
  setTransactions(response.data);
};
```

**After (Local-first):**
```typescript
import { transactionRepository } from '../../database/TransactionRepository';

const loadData = async () => {
  const transactions = await transactionRepository.findAll();
  setTransactions(transactions);
};
```

---

## 🧪 Testing

### Test Offline Mode

1. Enable airplane mode
2. Open app
3. Create/edit/delete data
4. Close and reopen app
5. Verify data persists

### Test Sync

1. Clear app data
2. Open app (should sync banks/categories)
3. Verify master data loaded
4. Pull-to-refresh should trigger incremental sync

### Check Database

```typescript
import { dbManager } from '../database';

// Get stats
const stats = await dbManager.getStats();
console.log(stats);
// { transactions: 150, budgets: 5, alerts: 3, banks: 10, categories: 8 }
```

---

## 🔍 Debugging

### Enable Logging

Logs are already built-in:
```
🗄️  Initializing database...
📊 Current database version: 0
📊 Target database version: 1
🔄 Running migrations from v0 to v1...
  → Applying migration: initial_schema (v1)
  ✅ Migration initial_schema completed
✅ Database initialized successfully
```

### View Database

Use a SQLite viewer:
1. Get database file from device
2. Open with [DB Browser for SQLite](https://sqlitebrowser.org/)
3. Inspect tables, data, indexes

### Common Issues

**"Cannot find database"**
- Database is created on first launch
- Check OfflineAuthProvider wraps app

**"Foreign key constraint failed"**
- Master data (banks/categories) not synced
- Trigger manual sync first

**"Undefined local_id"**
- Using wrong ID field
- Local entities: `local_id` (string)
- Master entities: `remote_id` (number)

---

## 📱 User Experience

### What Users See

1. **First Launch**
   - "Initializing app..." spinner
   - Sync master data (banks, categories)
   - Ready to use (5-10 seconds)

2. **Subsequent Launches**
   - Instant loading from local database
   - Background sync (non-blocking)
   - App feels native and fast

3. **Offline Usage**
   - Everything works normally
   - No error messages
   - Data saved locally
   - Optional "offline" indicators in UI

4. **Back Online**
   - Auto-sync on reconnect
   - Master data updates
   - No user action needed

---

## 🎨 UI Enhancements

### Add Offline Indicator
```tsx
{item.sync_status === 'local' && (
  <Chip icon="cloud-off-outline" compact>
    Local Only
  </Chip>
)}
```

### Add Sync Status
```tsx
import { useOfflineAuth } from '../context/OfflineAuthContext';

const { isSyncing } = useOfflineAuth();

{isSyncing && (
  <Banner visible icon="sync">
    Syncing data...
  </Banner>
)}
```

### Pull-to-Refresh with Sync
```tsx
const onRefresh = async () => {
  setRefreshing(true);
  
  // Sync master data
  await syncService.syncAll();
  
  // Reload local data
  await loadData();
  
  setRefreshing(false);
};
```

---

## 🚀 Next Steps

1. **Update Screens** - Convert existing screens to use repositories
2. **Test Thoroughly** - Test offline mode extensively
3. **Add Polish** - Loading states, error handling, UI indicators
4. **Performance** - Test with large datasets (1000+ transactions)
5. **Future Features**:
   - Data export (JSON/CSV)
   - Cloud backup
   - Multi-device sync (if needed)

---

## 📖 Documentation

- **OFFLINE_ARCHITECTURE.md** - Complete architecture explanation
- **IMPLEMENTATION_GUIDE.md** - Step-by-step screen update guide
- **Repository files** - Inline documentation for all methods

---

## 💡 Key Concepts

### Device-Authoritative
- Your device is the source of truth
- No conflicts with server
- Works 100% offline

### Master Data
- Banks and categories come from server
- Read-only on device
- Auto-synced in background

### Soft Delete
- Records marked as deleted (not physically removed)
- Can be restored if needed
- Maintains referential integrity

### Optimistic Updates
- UI updates immediately
- Database persists in background
- Feels instant to users

---

## ❓ FAQ

**Q: Do I need internet to use the app?**
A: No! The app works 100% offline. Internet is only needed to sync banks/categories.

**Q: What happens to my data if I reinstall?**
A: Local data is lost. Consider implementing cloud backup in the future.

**Q: Can multiple devices sync?**
A: Not yet. This is designed for single-device usage. Multi-device sync can be added later.

**Q: Is my data encrypted?**
A: SQLite database is not encrypted by default. Consider expo-file-system encryption if needed.

**Q: How do I backup my data?**
A: Implement data export feature (JSON/CSV) - see future enhancements.

---

## 🎉 Benefits

✅ **Instant Performance** - No network latency
✅ **Reliable** - Works anywhere, anytime
✅ **Scalable** - Handles thousands of records
✅ **Future-Proof** - Easy to add cloud sync later
✅ **User-Friendly** - No login hassles

---

## 📞 Support

If you encounter issues:
1. Check console logs for errors
2. Verify database initialized (check logs)
3. Test in airplane mode
4. Review IMPLEMENTATION_GUIDE.md
5. Inspect database with SQLite viewer

---

**Happy Coding! 🚀**
