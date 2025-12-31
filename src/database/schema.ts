/**
 * Database Schema Definitions
 * SQLite schema for offline-first architecture
 */

export const DB_NAME = 'money_manage.db';
export const DB_VERSION = 1;

/**
 * Schema creation SQL statements
 * Each table includes sync and audit fields
 */
export const SCHEMA = {
  // Master Data Tables (Backend Authoritative)
  
  BANKS: `
    CREATE TABLE IF NOT EXISTS banks (
      remote_id INTEGER PRIMARY KEY,
      bank_name TEXT NOT NULL,
      color TEXT,
      image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      version INTEGER DEFAULT 1,
      last_synced_at TEXT NOT NULL
    );
  `,
  
  BANKS_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_banks_name ON banks(bank_name);',
    'CREATE INDEX IF NOT EXISTS idx_banks_deleted ON banks(deleted_at);',
  ],

  CATEGORIES: `
    CREATE TABLE IF NOT EXISTS categories (
      remote_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL,
      description TEXT,
      user_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      version INTEGER DEFAULT 1,
      last_synced_at TEXT NOT NULL
    );
  `,
  
  CATEGORIES_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);',
    'CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);',
  ],

  // Local-Only Tables (Device Authoritative)
  
  TRANSACTIONS: `
    CREATE TABLE IF NOT EXISTS transactions (
      local_id TEXT PRIMARY KEY,
      remote_id INTEGER,
      bank_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      transaction_type INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      version INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'local',
      last_synced_at TEXT,
      FOREIGN KEY (bank_id) REFERENCES banks(remote_id),
      FOREIGN KEY (category_id) REFERENCES categories(remote_id)
    );
  `,
  
  TRANSACTIONS_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_bank ON transactions(bank_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status);',
  ],

  BUDGETS: `
    CREATE TABLE IF NOT EXISTS budgets (
      local_id TEXT PRIMARY KEY,
      remote_id INTEGER,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      alert_at INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      version INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'local',
      last_synced_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(remote_id)
    );
  `,
  
  BUDGETS_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);',
    'CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_budgets_deleted ON budgets(deleted_at);',
    'CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);',
    'CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(start_date);',
  ],

  BUDGET_ALERTS: `
    CREATE TABLE IF NOT EXISTS budget_alerts (
      local_id TEXT PRIMARY KEY,
      remote_id INTEGER,
      budget_id TEXT NOT NULL,
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
  `,
  
  BUDGET_ALERTS_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_alerts_budget ON budget_alerts(budget_id);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_read ON budget_alerts(is_read);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_deleted ON budget_alerts(deleted_at);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_created ON budget_alerts(created_at);',
  ],

  // System Tables
  
  SYNC_METADATA: `
    CREATE TABLE IF NOT EXISTS sync_metadata (
      entity_type TEXT PRIMARY KEY,
      last_sync_at TEXT NOT NULL,
      last_sync_version INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      error_message TEXT,
      updated_at TEXT NOT NULL
    );
  `,

  APP_SETTINGS: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
};

/**
 * Initial sync metadata entries
 */
export const INITIAL_SYNC_METADATA = [
  { entity_type: 'banks', last_sync_at: new Date(0).toISOString(), sync_status: 'pending' },
  { entity_type: 'categories', last_sync_at: new Date(0).toISOString(), sync_status: 'pending' },
];

/**
 * Migration definitions
 * Add new migrations here as schema evolves
 */
export const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db: any) => {
      // Create all tables
      await db.execAsync(SCHEMA.BANKS);
      for (const index of SCHEMA.BANKS_INDEXES) {
        await db.execAsync(index);
      }

      await db.execAsync(SCHEMA.CATEGORIES);
      for (const index of SCHEMA.CATEGORIES_INDEXES) {
        await db.execAsync(index);
      }

      await db.execAsync(SCHEMA.TRANSACTIONS);
      for (const index of SCHEMA.TRANSACTIONS_INDEXES) {
        await db.execAsync(index);
      }

      await db.execAsync(SCHEMA.BUDGETS);
      for (const index of SCHEMA.BUDGETS_INDEXES) {
        await db.execAsync(index);
      }

      await db.execAsync(SCHEMA.BUDGET_ALERTS);
      for (const index of SCHEMA.BUDGET_ALERTS_INDEXES) {
        await db.execAsync(index);
      }

      await db.execAsync(SCHEMA.SYNC_METADATA);
      await db.execAsync(SCHEMA.APP_SETTINGS);

      // Insert initial sync metadata
      for (const meta of INITIAL_SYNC_METADATA) {
        await db.runAsync(
          `INSERT INTO sync_metadata (entity_type, last_sync_at, sync_status, updated_at) 
           VALUES (?, ?, ?, ?)`,
          [meta.entity_type, meta.last_sync_at, meta.sync_status, new Date().toISOString()]
        );
      }

      console.log('✅ Initial schema created successfully');
    },
  },
  // Add future migrations here
  // {
  //   version: 2,
  //   name: 'add_user_preferences',
  //   up: async (db: any) => {
  //     await db.execAsync(`ALTER TABLE app_settings ADD COLUMN category TEXT;`);
  //   }
  // }
];

/**
 * Table names enum for type safety
 */
export enum TableName {
  BANKS = 'banks',
  CATEGORIES = 'categories',
  TRANSACTIONS = 'transactions',
  BUDGETS = 'budgets',
  BUDGET_ALERTS = 'budget_alerts',
  SYNC_METADATA = 'sync_metadata',
  APP_SETTINGS = 'app_settings',
}

/**
 * Sync status enum
 */
export enum SyncStatus {
  LOCAL = 'local',
  SYNCED = 'synced',
  CONFLICT = 'conflict',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
