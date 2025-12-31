# Offline-First Architecture Documentation

## Overview

This document describes the offline-first architecture for the Money Manage mobile application. The app operates fully offline with optional syncing for master data from the backend.

---

## Architecture Principles

### 1. **Offline-First Design**
- All core features work without internet connectivity
- Local SQLite database is the single source of truth for device-owned data
- Network is optional and used only for master data synchronization
- Fast, responsive UI with optimistic updates

### 2. **Data Ownership Model**

#### **Local-Only Data (Device Authoritative)**
These entities are created, updated, and deleted exclusively on the device:

- **Transactions** - User's financial transactions
- **Budgets** - User's budget definitions
- **Budget Alerts** - Budget threshold alerts
- **User Settings** - App preferences and configuration

**Characteristics:**
- Full CRUD operations on device
- Never synced to backend
- Support soft delete (`deleted_at`)
- Include audit fields (`created_at`, `updated_at`)
- UUID-based local IDs for future sync capability

#### **Master Data (Backend Authoritative)**
These entities are managed by the backend and read-only on device:

- **Banks** - List of available banks (MANDATORY)
- **Categories** - Transaction categories (OPTIONAL - can be user-specific)

**Characteristics:**
- Read-only on device
- Cached locally in SQLite
- Pull-only synchronization
- Server always wins conflicts
- Version-based incremental sync

### 3. **Authentication Model**

**Single-Device Ownership:**
- One logical user per device
- No login required for daily operations
- Optional backend registration for future sync
- Device ID as primary identifier

**Simplified Flow:**
- First launch: Bootstrap master data
- Subsequent launches: Incremental sync
- No authentication required for local operations

---

## Database Schema

### Core Tables

#### 1. **transactions** (Local-Only)
```sql
CREATE TABLE transactions (
  local_id TEXT PRIMARY KEY,           -- UUID generated locally
  remote_id INTEGER,                   -- Backend ID (for future sync)
  bank_id INTEGER NOT NULL,            -- FK to banks.remote_id
  category_id INTEGER NOT NULL,        -- FK to categories.remote_id
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  transaction_type INTEGER NOT NULL,   -- 1=income, 2=expense
  date TEXT NOT NULL,                  -- ISO 8601 format
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,                     -- Soft delete
  version INTEGER DEFAULT 1,
  sync_status TEXT DEFAULT 'local',   -- local|synced|conflict
  last_synced_at TEXT,
  FOREIGN KEY (bank_id) REFERENCES banks(remote_id),
  FOREIGN KEY (category_id) REFERENCES categories(remote_id)
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_deleted ON transactions(deleted_at);
CREATE INDEX idx_transactions_bank ON transactions(bank_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
```

#### 2. **budgets** (Local-Only)
```sql
CREATE TABLE budgets (
  local_id TEXT PRIMARY KEY,
  remote_id INTEGER,
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  period TEXT NOT NULL,               -- 'monthly' or 'yearly'
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER DEFAULT 1,
  alert_at INTEGER NOT NULL,          -- Percentage threshold
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  sync_status TEXT DEFAULT 'local',
  last_synced_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(remote_id)
);

CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_deleted ON budgets(deleted_at);
CREATE INDEX idx_budgets_period ON budgets(period);
```

#### 3. **budget_alerts** (Local-Only)
```sql
CREATE TABLE budget_alerts (
  local_id TEXT PRIMARY KEY,
  remote_id INTEGER,
  budget_id TEXT NOT NULL,            -- FK to budgets.local_id
  percentage REAL NOT NULL,
  spent_amount REAL NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (budget_id) REFERENCES budgets(local_id)
);

CREATE INDEX idx_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_alerts_read ON budget_alerts(is_read);
CREATE INDEX idx_alerts_deleted ON budget_alerts(deleted_at);
```

#### 4. **banks** (Master Data)
```sql
CREATE TABLE banks (
  remote_id INTEGER PRIMARY KEY,      -- Backend ID
  bank_name TEXT NOT NULL,
  color TEXT,
  image TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  last_synced_at TEXT NOT NULL
);

CREATE INDEX idx_banks_name ON banks(bank_name);
```

#### 5. **categories** (Master Data)
```sql
CREATE TABLE categories (
  remote_id INTEGER PRIMARY KEY,      -- Backend ID
  category_name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER,                    -- For user-specific categories
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  version INTEGER DEFAULT 1,
  last_synced_at TEXT NOT NULL
);

CREATE INDEX idx_categories_name ON categories(category_name);
CREATE INDEX idx_categories_user ON categories(user_id);
```

#### 6. **sync_metadata** (System)
```sql
CREATE TABLE sync_metadata (
  entity_type TEXT PRIMARY KEY,       -- 'banks', 'categories'
  last_sync_at TEXT NOT NULL,
  last_sync_version INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'pending', -- pending|in_progress|completed|failed
  error_message TEXT,
  updated_at TEXT NOT NULL
);
```

---

## Sync Strategy

### Master Data Synchronization

#### **Sync Triggers**
1. **Initial Bootstrap** (first launch)
   - Download all master data
   - Mark as synced
   
2. **Incremental Sync** (subsequent launches)
   - App launch (foreground)
   - App resume from background
   - Network reconnect
   - Manual refresh (pull-to-refresh)

#### **Sync Flow**

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ Network         │──────────────▶│  Continue with   │
│ Available?      │               │  Local Data      │
└────────┬────────┘               └──────────────────┘
         │ YES
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ Is First        │──────────────▶│  Incremental     │
│ Launch?         │               │  Sync            │
└────────┬────────┘               └────────┬─────────┘
         │ YES                             │
         ▼                                 │
┌─────────────────┐                        │
│ Full Bootstrap  │                        │
│ - Banks         │                        │
│ - Categories    │                        │
└────────┬────────┘                        │
         │                                 │
         └─────────────┬───────────────────┘
                       ▼
              ┌─────────────────┐
              │  Sync Success   │
              │  - Update cache │
              │  - Update meta  │
              └─────────────────┘
```

#### **Incremental Sync Algorithm**

```typescript
async function syncMasterData(entityType: 'banks' | 'categories') {
  // 1. Get last sync metadata
  const lastSync = await getLastSyncTimestamp(entityType);
  
  // 2. Request changes since last sync
  const response = await api.get(`/${entityType}`, {
    params: { updated_after: lastSync }
  });
  
  // 3. Update local cache (server wins)
  for (const item of response.data) {
    await upsertMasterData(entityType, item);
  }
  
  // 4. Update sync metadata
  await updateSyncMetadata(entityType, {
    last_sync_at: new Date().toISOString(),
    sync_status: 'completed'
  });
}
```

#### **Conflict Resolution**
- **Rule**: Server always wins
- Local modifications to master data are rejected
- If user attempts to modify, show warning

#### **Failure Handling**

```typescript
async function syncWithRetry(entityType: string, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await syncMasterData(entityType);
      return { success: true };
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        // Log error and continue with local cache
        await updateSyncMetadata(entityType, {
          sync_status: 'failed',
          error_message: error.message
        });
        return { success: false, error };
      }
      
      // Exponential backoff
      await delay(1000 * Math.pow(2, attempt));
    }
  }
}
```

---

## Data Flow Architecture

### Write Operations (Local-Only Data)

```
User Action (Create/Update/Delete)
         │
         ▼
┌─────────────────────┐
│  Repository Layer   │
│  - Validation       │
│  - UUID generation  │
│  - Timestamp        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  SQLite Transaction │
│  - Write to DB      │
│  - Update indexes   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  UI Update          │
│  - Optimistic       │
│  - Instant feedback │
└─────────────────────┘
```

### Read Operations

```
Screen Component
         │
         ▼
┌─────────────────────┐
│  Repository Layer   │
│  - Build query      │
│  - Apply filters    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  SQLite Query       │
│  - Use indexes      │
│  - Filter deleted   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Transform & Return │
│  - Map to models    │
│  - Compute totals   │
└─────────────────────┘
```

---

## Performance Optimization

### 1. **Indexing Strategy**
- Date fields for transactions (common filter)
- Foreign keys for joins
- Status fields (deleted_at, is_active)
- Type fields (transaction_type, period)

### 2. **Query Optimization**
```typescript
// Good: Indexed query with specific date range
SELECT * FROM transactions 
WHERE date >= ? AND date <= ? 
AND deleted_at IS NULL 
ORDER BY date DESC 
LIMIT 50;

// Bad: Full table scan
SELECT * FROM transactions WHERE description LIKE '%keyword%';
```

### 3. **Batch Operations**
```typescript
// Use transactions for bulk inserts
await db.transaction(tx => {
  transactions.forEach(t => {
    tx.executeSql(INSERT_QUERY, [t.amount, t.description, ...]);
  });
});
```

### 4. **Memory Management**
- Paginate large result sets
- Lazy load detail views
- Clear query caches periodically

### 5. **Background Sync**
- Non-blocking sync on app launch
- Show UI immediately with cached data
- Update UI when sync completes

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Install expo-sqlite
2. Create database initialization
3. Implement base repository pattern
4. Create migration system

### Phase 2: Core Features (Week 2)
1. Implement transaction repository
2. Implement budget repository
3. Implement alert repository
4. Update screens to use local repos

### Phase 3: Master Data Sync (Week 3)
1. Implement bank sync service
2. Implement category sync service
3. Add sync triggers
4. Add error handling

### Phase 4: Authentication Simplification (Week 4)
1. Remove login requirement
2. Implement device ID system
3. Optional backend registration
4. Update AuthContext

### Phase 5: Testing & Optimization (Week 5)
1. Test with large datasets (10k+ transactions)
2. Performance profiling
3. Memory optimization
4. Error handling improvements

---

## Future Extensibility

### 1. **Multi-Device Sync**
- Use `local_id` as client-side ID
- Implement conflict resolution with CRDTs
- Sync local-only data to backend

### 2. **Cloud Backup**
- Export full database
- Encrypt and upload
- Restore on new device

### 3. **Authentication Reintroduction**
- Add optional login
- Link device to cloud account
- Multi-device sync

### 4. **Offline Analytics**
- Pre-compute aggregations
- Store in separate tables
- Background refresh

---

## Best Practices

### 1. **Error Handling**
```typescript
try {
  await repository.create(data);
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    // Handle constraint violation
  } else {
    // Log and show user-friendly message
  }
}
```

### 2. **Soft Delete**
```typescript
// Never physically delete
async delete(id: string) {
  await db.executeSql(
    'UPDATE transactions SET deleted_at = ? WHERE local_id = ?',
    [new Date().toISOString(), id]
  );
}
```

### 3. **Optimistic Updates**
```typescript
// Update UI immediately
const newTransaction = { ...data, local_id: uuid() };
setTransactions(prev => [newTransaction, ...prev]);

// Then persist
await repository.create(newTransaction);
```

### 4. **Transaction Safety**
```typescript
await db.transaction(async (tx) => {
  // All operations succeed or fail together
  await insertBudget(tx, budget);
  await updateCategory(tx, categoryId);
});
```

---

## Testing Strategy

### 1. **Unit Tests**
- Repository CRUD operations
- Data validation
- UUID generation

### 2. **Integration Tests**
- End-to-end flows
- Sync scenarios
- Error recovery

### 3. **Performance Tests**
- Large dataset queries
- Batch operations
- Memory usage

### 4. **Offline Tests**
- Airplane mode testing
- Network interruption
- Sync recovery

---

## Security Considerations

### 1. **Local Data Protection**
- SQLite database is not encrypted by default
- Consider expo-file-system encryption for sensitive data
- SecureStore for tokens (if auth is reintroduced)

### 2. **Input Validation**
- Validate all user inputs
- Sanitize before SQL queries
- Use parameterized queries

### 3. **Audit Trail**
- Track created_at, updated_at
- Maintain version numbers
- Log important state changes

---

## Monitoring & Debugging

### 1. **Logging**
```typescript
logger.info('Transaction created', { id, amount });
logger.error('Sync failed', { entity, error });
```

### 2. **Performance Metrics**
- Query execution time
- Database size
- Sync duration

### 3. **Debug Tools**
- SQLite database viewer
- React Native Debugger
- Flipper plugin

---

## Conclusion

This offline-first architecture provides:
- ✅ 100% offline functionality
- ✅ Fast, responsive UI
- ✅ Reliable data persistence
- ✅ Optional backend sync
- ✅ Future-proof design
- ✅ Scalable to 10k+ records

The system is designed for single-device usage but extensible to multi-device sync and cloud backup in the future.
