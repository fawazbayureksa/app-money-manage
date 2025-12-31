# Screen Migration Checklist

## 📋 Screens to Update

Track progress of converting screens from API-based to offline-first architecture.

---

## ✅ Completed

- [x] App Root (_layout.tsx) - Using OfflineAuthProvider
- [x] Index Screen (index.tsx) - Updated initialization flow
- [x] Example Screen (OfflineTransactionListScreen.tsx) - Full implementation reference

---

## 🔄 In Progress

### Priority 1: Transaction Screens

- [ ] **TransactionListScreen.tsx**
  - [ ] Import transactionRepository
  - [ ] Update fetchTransactions to use findWithFilters
  - [ ] Update delete to use local_id
  - [ ] Add sync to pull-to-refresh
  - [ ] Add stats display
  - [ ] Test offline mode

- [ ] **AddTransactionScreen.tsx**
  - [ ] Import repositories (transaction, bank, category)
  - [ ] Load banks/categories from local cache
  - [ ] Update create to use transactionRepository
  - [ ] Remove API calls
  - [ ] Test creation flow

### Priority 2: Budget Screens

- [ ] **BudgetListScreen.tsx**
  - [ ] Import budgetRepository
  - [ ] Use findWithStats for automatic calculations
  - [ ] Update delete to use local_id
  - [ ] Add sync trigger
  - [ ] Test budget status calculations

- [ ] **AddBudgetScreen.tsx**
  - [ ] Import budgetRepository, categoryRepository
  - [ ] Load categories from local cache
  - [ ] Update create to use budgetRepository
  - [ ] Test budget creation

### Priority 3: Alert Screens

- [ ] **AlertListScreen.tsx**
  - [ ] Import budgetAlertRepository
  - [ ] Use findAll with unreadOnly filter
  - [ ] Update markAsRead to use local_id
  - [ ] Test alert display and read status

### Priority 4: Category Screens

- [ ] **CategoryListScreen.tsx**
  - [ ] Import categoryRepository
  - [ ] Load from local cache (findAll)
  - [ ] Show read-only message
  - [ ] Remove create/edit/delete options (master data)
  - [ ] Add sync refresh

- [ ] **AddCategoryScreen.tsx**
  - [ ] Remove or disable (categories are master data)
  - [ ] OR: Keep for user-specific categories (optional)

### Priority 5: Home Screen

- [ ] **HomeScreen.tsx**
  - [ ] Import all repositories
  - [ ] Load data from local database
  - [ ] Show statistics from local calculations
  - [ ] Add sync indicator
  - [ ] Test dashboard

---

## 🔧 Per-Screen Checklist

Use this checklist for each screen you update:

### Pre-Update
- [ ] Read current implementation
- [ ] Identify all API calls
- [ ] Note what data is needed
- [ ] Check for foreign key relationships

### During Update
- [ ] Import repository instead of API service
- [ ] Replace API calls with repository methods
- [ ] Update ID references (id → local_id or remote_id)
- [ ] Add proper error handling
- [ ] Add loading states
- [ ] Test in simulator

### Post-Update
- [ ] Test in airplane mode
- [ ] Test with empty database
- [ ] Test with large dataset
- [ ] Test pull-to-refresh
- [ ] Verify no API imports remain
- [ ] Check console for errors
- [ ] Update UI for offline indicators

---

## 🎯 Testing Matrix

| Screen | Create | Read | Update | Delete | Offline | Sync | Performance |
|--------|--------|------|--------|--------|---------|------|-------------|
| TransactionList | ⬜ | ⬜ | N/A | ⬜ | ⬜ | ⬜ | ⬜ |
| AddTransaction | ⬜ | N/A | N/A | N/A | ⬜ | ⬜ | ⬜ |
| BudgetList | ⬜ | ⬜ | N/A | ⬜ | ⬜ | ⬜ | ⬜ |
| AddBudget | ⬜ | N/A | N/A | N/A | ⬜ | ⬜ | ⬜ |
| AlertList | N/A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| CategoryList | N/A | ⬜ | N/A | N/A | ⬜ | ⬜ | ⬜ |
| Home | N/A | ⬜ | N/A | N/A | ⬜ | ⬜ | ⬜ |

Legend:
- ⬜ Not tested
- ✅ Passing
- ❌ Failing
- N/A Not applicable

---

## 📝 Code Review Checklist

Before marking a screen as complete:

- [ ] No imports from `src/api/` (except in syncService)
- [ ] All CRUD uses repository methods
- [ ] Proper error handling (try/catch)
- [ ] Loading states shown
- [ ] Optimistic updates where appropriate
- [ ] Pull-to-refresh triggers sync
- [ ] Works in airplane mode
- [ ] Key extractors use correct ID field
- [ ] Foreign keys reference correct columns
- [ ] No console errors
- [ ] UI shows offline indicators
- [ ] Performance is acceptable

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"
**Solution:** Change `item.id` to `item.local_id` for local entities

### Issue: "Foreign key constraint failed"
**Solution:** Ensure master data is synced before creating dependent records

### Issue: Data not persisting
**Solution:** Check if OfflineAuthProvider is properly initialized

### Issue: Slow performance
**Solution:** Add filters/pagination, check indexes

### Issue: Sync not working
**Solution:** Check network, verify API endpoints still work

---

## 📊 Progress Tracking

| Category | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| Transaction Screens | 2 | 1 | 0 | 1 |
| Budget Screens | 2 | 0 | 0 | 2 |
| Alert Screens | 1 | 0 | 0 | 1 |
| Category Screens | 2 | 0 | 0 | 2 |
| Home Screens | 1 | 0 | 0 | 1 |
| **TOTAL** | **8** | **1** | **0** | **7** |

Progress: 12.5% Complete

---

## 🎯 Estimated Time

- TransactionListScreen: 1-2 hours
- AddTransactionScreen: 1 hour
- BudgetListScreen: 1-2 hours
- AddBudgetScreen: 1 hour
- AlertListScreen: 30 minutes
- CategoryListScreen: 30 minutes
- AddCategoryScreen: 15 minutes (disable only)
- HomeScreen: 2-3 hours

**Total Estimated Time: 8-12 hours**

---

## 🚀 Quick Wins

Start with these for immediate progress:

1. **AlertListScreen** (easiest)
   - Simple read-only list
   - No create/update logic
   - Good learning screen

2. **AddTransactionScreen** (high impact)
   - Most-used feature
   - Simple create logic
   - Immediate user benefit

3. **TransactionListScreen** (high value)
   - Core feature
   - Good reference for patterns
   - Enables most workflows

---

## 📅 Suggested Timeline

### Week 1
- Day 1-2: TransactionListScreen + AddTransactionScreen
- Day 3: Test transaction flows thoroughly
- Day 4-5: BudgetListScreen + AddBudgetScreen

### Week 2
- Day 1: AlertListScreen
- Day 2: CategoryListScreen
- Day 3-4: HomeScreen (most complex)
- Day 5: Final testing and polish

---

## ✅ Done Criteria

The migration is complete when:

- ✅ All screens use local repositories
- ✅ No API service imports remain (except sync)
- ✅ All tests pass (offline mode)
- ✅ Performance is acceptable
- ✅ UI polish complete (indicators, states)
- ✅ Documentation updated
- ✅ Code reviewed

---

**Update this file as you make progress!**
