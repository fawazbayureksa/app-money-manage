/**
 * Database Initialization and Management
 * Handles SQLite database lifecycle and migrations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { DB_NAME, DB_VERSION, MIGRATIONS } from './schema';

const DB_VERSION_KEY = '@db_version';

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Get database instance (singleton pattern)
   */
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    if (this.initPromise) {
      await this.initPromise;
      return this.db!;
    }

    this.initPromise = this.initialize();
    await this.initPromise;
    return this.db!;
  }

  /**
   * Initialize database and run migrations
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🗄️  Initializing database...');

      // Open database
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // Get current version from storage
      const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

      console.log(`📊 Current database version: ${currentVersion}`);
      console.log(`📊 Target database version: ${DB_VERSION}`);

      // Run migrations if needed
      if (currentVersion < DB_VERSION) {
        await this.runMigrations(currentVersion, DB_VERSION);
        await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION.toString());
        console.log('✅ Database migrations completed');
      } else {
        console.log('✅ Database is up to date');
      }

      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.initPromise = null;
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Run migrations from current version to target version
   */
  private async runMigrations(fromVersion: number, toVersion: number): Promise<void> {
    console.log(`🔄 Running migrations from v${fromVersion} to v${toVersion}...`);

    const pendingMigrations = MIGRATIONS.filter(
      (m) => m.version > fromVersion && m.version <= toVersion
    ).sort((a, b) => a.version - b.version);

    for (const migration of pendingMigrations) {
      console.log(`  → Applying migration: ${migration.name} (v${migration.version})`);
      try {
        await migration.up(this.db!);
        console.log(`  ✅ Migration ${migration.name} completed`);
      } catch (error) {
        console.error(`  ❌ Migration ${migration.name} failed:`, error);
        throw new Error(`Migration ${migration.name} failed: ${error}`);
      }
    }
  }

  /**
   * Execute a raw SQL query (for testing/debugging)
   */
  async executeRaw(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getDatabase();
    return await db.runAsync(sql, params);
  }

  /**
   * Execute a SELECT query
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.getDatabase();
    const result = await db.getAllAsync<T>(sql, params);
    return result;
  }

  /**
   * Execute a SELECT query and return first result
   */
  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const db = await this.getDatabase();
    const result = await db.getFirstAsync<T>(sql, params);
    return result || null;
  }

  /**
   * Execute an INSERT/UPDATE/DELETE query
   */
  async execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    const db = await this.getDatabase();
    return await db.runAsync(sql, params);
  }

  /**
   * Execute multiple statements in a transaction
   */
  async transaction(callback: (tx: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
    const db = await this.getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      await callback(db);
      await db.execAsync('COMMIT;');
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      console.log('✅ Database closed');
    }
  }

  /**
   * Reset database (for testing/debugging)
   */
  async reset(): Promise<void> {
    try {
      console.log('⚠️  Resetting database...');
      
      if (this.db) {
        await this.db.closeAsync();
      }

      // Delete database file
      await SQLite.deleteDatabaseAsync(DB_NAME);
      
      // Clear version from storage
      await AsyncStorage.removeItem(DB_VERSION_KEY);
      
      // Reinitialize
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      
      await this.getDatabase();
      
      console.log('✅ Database reset complete');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    transactions: number;
    budgets: number;
    alerts: number;
    banks: number;
    categories: number;
  }> {
    const db = await this.getDatabase();
    
    const [transactions, budgets, alerts, banks, categories] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions WHERE deleted_at IS NULL'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM budgets WHERE deleted_at IS NULL'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM budget_alerts WHERE deleted_at IS NULL'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM banks WHERE deleted_at IS NULL'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL'),
    ]);

    return {
      transactions: transactions?.count || 0,
      budgets: budgets?.count || 0,
      alerts: alerts?.count || 0,
      banks: banks?.count || 0,
      categories: categories?.count || 0,
    };
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();

// Export convenience functions
export const getDatabase = () => dbManager.getDatabase();
export const query = <T = any>(sql: string, params: any[] = []) => dbManager.query<T>(sql, params);
export const queryFirst = <T = any>(sql: string, params: any[] = []) => dbManager.queryFirst<T>(sql, params);
export const execute = (sql: string, params: any[] = []) => dbManager.execute(sql, params);
export const transaction = (callback: (tx: SQLite.SQLiteDatabase) => Promise<void>) => dbManager.transaction(callback);
