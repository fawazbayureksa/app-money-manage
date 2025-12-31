# Offline-First Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for converting your existing screens to use the offline-first architecture with local SQLite repositories.

---

## 📋 Implementation Checklist

### Phase 1: Core Setup ✅ (COMPLETED)

- [x] Install expo-sqlite
- [x] Create database schema and migrations
- [x] Implement base repository pattern
- [x] Create entity repositories (Transaction, Budget, Alert, Bank, Category)
- [x] Create sync service for master data
- [x] Update authentication to single-device model
- [x] Update app entry point (_layout.tsx, index.tsx)

### Phase 2: Screen Updates (IN PROGRESS)

- [ ] Update TransactionListScreen
- [ ] Update AddTransactionScreen
- [ ] Update BudgetListScreen
- [ ] Update AddBudgetScreen
- [ ] Update CategoryListScreen
- [ ] Update AlertListScreen
- [ ] Update HomeScreen

### Phase 3: Testing & Polish

- [ ] Test offline functionality
- [ ] Test sync functionality
- [ ] Performance testing with large datasets
- [ ] Error handling improvements
- [ ] User feedback improvements

---

## 🔄 Converting Existing Screens

### Pattern 1: List Screens

**Before (API-based):**
```typescript
import { transactionService } from '../../api/transactionService';

const fetchTransactions = async () => {
  const response = await transactionService.getTransactions();
  if (response.success) {
    setTransactions(response.data);
  }
};
```

**After (Local-first):**
```typescript
import { transactionRepository } from '../../database/TransactionRepository';

const fetchTransactions = async () => {
  const data = await transactionRepository.findWithFilters({
    startDate: filter.startDate,
    endDate: filter.endDate,
  });
  setTransactions(data);
};
```

### Pattern 2: Create/Add Screens

**Before (API-based):**
```typescript
const handleSubmit = async () => {
  const response = await transactionService.createTransaction(data);
  if (response.success) {
    router.back();
  }
};
```

**After (Local-first):**
```typescript
const handleSubmit = async () => {
  const transaction = await transactionRepository.create({
    bank_id: selectedBank,
    category_id: selectedCategory,
    amount: parseFloat(amount),
    description: description,
    transaction_type: type === 'income' ? 1 : 2,
    date: selectedDate.toISOString(),
  });
  
  // Optimistic update - no waiting for sync
  router.back();
};
```

### Pattern 3: Delete Operations

**Before (API-based):**
```typescript
const handleDelete = async (id: number) => {
  await transactionService.deleteTransaction(id);
  fetchTransactions(); // Refetch from API
};
```

**After (Local-first):**
```typescript
const handleDelete = async (localId: string) => {
  await transactionRepository.delete(localId);
  fetchTransactions(); // Reload from local DB
};
```

### Pattern 4: Master Data (Banks, Categories)

**Before (API-based):**
```typescript
const loadBanks = async () => {
  const response = await bankService.getBanks();
  setBanks(response.data);
};
```

**After (Local-first):**
```typescript
import { bankRepository } from '../../database/BankRepository';

const loadBanks = async () => {
  // Always load from local cache
  const banks = await bankRepository.findAll();
  setBanks(banks);
  
  // Banks are synced automatically by OfflineAuthContext
  // No need to manually trigger sync here
};
```

---

## 📝 Screen Update Examples

### Example 1: Update TransactionListScreen

**File:** `src/screens/Transaction/TransactionListScreen.tsx`

**Changes:**

1. **Import local repository instead of API service:**
```typescript
// OLD
import { transactionService, Transaction } from '../../api/transactionService';

// NEW
import { transactionRepository, Transaction } from '../../database/TransactionRepository';
```

2. **Update fetch function:**
```typescript
// OLD
const fetchTransactions = async () => {
  const response = await transactionService.getTransactions(params);
  if (response.success) {
    setTransactions(response.data);
  }
};

// NEW
const fetchTransactions = async () => {
  const filter = { /* your filters */ };
  const transactions = await transactionRepository.findWithFilters(filter);
  setTransactions(transactions);
  
  // Also get stats
  const stats = await transactionRepository.getStats(filter);
  setStats(stats);
};
```

3. **Update delete function:**
```typescript
// OLD
await transactionService.deleteTransaction(transaction.id);

// NEW
await transactionRepository.delete(transaction.local_id);
```

4. **Add sync trigger to pull-to-refresh:**
```typescript
import { syncService } from '../../services/syncService';

const onRefresh = async () => {
  setRefreshing(true);
  
  // Sync master data
  try {
    await syncService.syncAll();
  } catch (error) {
    // Continue with local data if sync fails
  }
  
  // Reload local data
  await fetchTransactions();
};
```

5. **Update key extraction:**
```typescript
// OLD
keyExtractor={(item) => item.id.toString()}

// NEW
keyExtractor={(item) => item.local_id}
```

### Example 2: Update AddTransactionScreen

**File:** `src/screens/Transaction/AddTransactionScreen.tsx`

**Changes:**

1. **Update imports:**
```typescript
import { transactionRepository } from '../../database/TransactionRepository';
import { bankRepository } from '../../database/BankRepository';
import { categoryRepository } from '../../database/CategoryRepository';
```

2. **Load banks and categories from local cache:**
```typescript
const loadMasterData = async () => {
  const [banks, categories] = await Promise.all([
    bankRepository.findAll(),
    categoryRepository.findAll(),
  ]);
  
  setBanks(banks);
  setCategories(categories);
};
```

3. **Update submit handler:**
```typescript
const handleSubmit = async () => {
  try {
    await transactionRepository.create({
      bank_id: selectedBank.remote_id,
      category_id: selectedCategory.remote_id,
      amount: parseFloat(amount),
      description: description,
      transaction_type: type === 'income' ? 1 : 2,
      date: date.toISOString(),
    });
    
    // Success - navigate back
    router.back();
  } catch (error) {
    Alert.alert('Error', 'Failed to create transaction');
  }
};
```

### Example 3: Update BudgetListScreen

**File:** `src/screens/Budget/BudgetListScreen.tsx`

**Changes:**

1. **Import local repository:**
```typescript
import { budgetRepository, BudgetWithStats } from '../../database/BudgetRepository';
```

2. **Load budgets with spending stats:**
```typescript
const loadBudgets = async () => {
  // This automatically calculates spending from local transactions
  const budgetsWithStats = await budgetRepository.findWithStats();
  setBudgets(budgetsWithStats);
};
```

3. **Update delete:**
```typescript
await budgetRepository.delete(budget.local_id);
```

---

## 🔧 Common Patterns

### 1. Loading Master Data

Always load from local cache - sync happens automatically:

```typescript
useEffect(() => {
  loadMasterData();
}, []);

const loadMasterData = async () => {
  const [banks, categories] = await Promise.all([
    bankRepository.findAll(),
    categoryRepository.findAll(),
  ]);
  
  setBanks(banks);
  setCategories(categories);
};
```

### 2. Optimistic Updates

Update UI immediately, persist in background:

```typescript
const handleCreate = async (data) => {
  // Generate local ID
  const tempId = uuidv4();
  const newItem = { ...data, local_id: tempId };
  
  // Update UI immediately
  setItems(prev => [newItem, ...prev]);
  
  // Persist to database
  try {
    await repository.create(data);
  } catch (error) {
    // Rollback on error
    setItems(prev => prev.filter(i => i.local_id !== tempId));
    Alert.alert('Error', 'Failed to create item');
  }
};
```

### 3. Error Handling

Always handle database errors gracefully:

```typescript
try {
  const data = await repository.findAll();
  setData(data);
} catch (error) {
  console.error('Database error:', error);
  Alert.alert('Error', 'Failed to load data');
  // Continue with empty state
  setData([]);
}
```

### 4. Sync Status Indicators

Show sync status in UI:

```typescript
import { useOfflineAuth } from '../../context/OfflineAuthContext';

const { isSyncing } = useOfflineAuth();

// In render:
{isSyncing && (
  <View style={styles.syncIndicator}>
    <ActivityIndicator size="small" />
    <Text>Syncing...</Text>
  </View>
)}
```

### 5. Manual Sync Trigger

Allow users to manually trigger sync:

```typescript
import { syncService } from '../../services/syncService';

const handleManualSync = async () => {
  try {
    setSyncing(true);
    await syncService.syncAll();
    Alert.alert('Success', 'Data synced successfully');
  } catch (error) {
    Alert.alert('Error', 'Sync failed. Will retry later.');
  } finally {
    setSyncing(false);
  }
};
```

---

## 🎨 UI/UX Improvements

### 1. Offline Indicator

Show when items are local-only:

```tsx
{item.sync_status === 'local' && (
  <Chip icon="cloud-off-outline" compact>
    Local Only
  </Chip>
)}
```

### 2. Sync Status Banner

```tsx
{isSyncing && (
  <Banner visible={true} icon="sync">
    Syncing master data...
  </Banner>
)}
```

### 3. Empty States

```tsx
<View style={styles.emptyState}>
  <IconButton icon="database-off" size={64} />
  <Text>No data yet</Text>
  <Text>Add your first item to get started</Text>
</View>
```

---

## 🧪 Testing Guide

### Test Offline Functionality

1. **Enable airplane mode** on device/simulator
2. Create transactions, budgets, etc.
3. Verify data persists
4. Re-open app and verify data is still there
5. Disable airplane mode
6. Verify sync works

### Test Sync Functionality

1. Clear app data
2. Launch app (should trigger initial sync)
3. Verify banks and categories are loaded
4. Make changes locally
5. Pull to refresh
6. Verify incremental sync works

### Test Performance

1. Generate large dataset (use database seed script)
2. Test scrolling performance
3. Test search/filter performance
4. Check memory usage

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'local_id' of undefined"

**Solution:** Check that you're using the correct ID field:
- Local entities use `local_id` (string)
- Master entities use `remote_id` (number)

### Issue: "Foreign key constraint failed"

**Solution:** Ensure master data (banks, categories) is synced before creating transactions:
```typescript
// Check if master data exists
const banksCount = await bankRepository.count();
if (banksCount === 0) {
  await syncService.syncBanks();
}
```

### Issue: "Database not initialized"

**Solution:** Ensure OfflineAuthProvider wraps your app in _layout.tsx

### Issue: Slow queries

**Solution:** 
1. Check indexes are created (see schema.ts)
2. Use filters to limit result set
3. Implement pagination

---

## 📊 Performance Tips

1. **Use indexes** - All date, FK, and status fields are indexed
2. **Paginate large lists** - Use `limit` and `offset`
3. **Batch operations** - Use transactions for bulk inserts
4. **Lazy load details** - Only fetch full details when needed
5. **Cache counts** - Store counts in state, refresh periodically

---

## 🔐 Security Considerations

1. **No encryption by default** - SQLite database is not encrypted
2. **Consider expo-file-system encryption** for sensitive data
3. **Use SecureStore** for tokens (if auth is reintroduced)
4. **Validate all inputs** before inserting
5. **Use parameterized queries** (already implemented in repositories)

---

## 🚀 Next Steps

1. **Update all screens** following the patterns above
2. **Test thoroughly** in offline mode
3. **Add loading states** and error handling
4. **Implement data export** feature (JSON/CSV)
5. **Add database backup** to cloud storage
6. **Consider reintroducing auth** for multi-device sync

---

## 📚 Additional Resources

- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Offline-First Design Patterns](https://offlinefirst.org/)
- [SQLite Performance Tips](https://www.sqlite.org/optoverview.html)

---

## 💡 Pro Tips

1. **Start with one screen** - Update TransactionListScreen first
2. **Keep old code** - Comment out instead of deleting initially
3. **Test incrementally** - Test each screen after updating
4. **Monitor console logs** - Database operations are logged
5. **Use database viewer** - Install SQLite viewer for debugging

---

## ✅ Completion Criteria

Your screen is successfully converted when:

- ✅ No API service imports remain (except in sync service)
- ✅ All CRUD operations use local repositories
- ✅ Works perfectly in airplane mode
- ✅ Pull-to-refresh triggers sync
- ✅ Optimistic updates feel instant
- ✅ Error handling is robust
- ✅ Loading states are smooth
- ✅ UI shows offline indicators where appropriate
