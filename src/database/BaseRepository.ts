/**
 * Base Repository
 * Provides common CRUD operations for all entities
 */

import uuid from 'react-native-uuid';
import { dbManager } from './index';

export interface BaseEntity {
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  version?: number;
}

export interface LocalEntity extends BaseEntity {
  local_id: string;
  remote_id?: number | null;
  sync_status?: 'local' | 'synced' | 'conflict';
  last_synced_at?: string | null;
}

export interface MasterEntity extends BaseEntity {
  remote_id: number;
  last_synced_at: string;
}

/**
 * Base repository with common operations
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected tableName: string) {}

  /**
   * Generate UUID for local entities
   */
  protected generateId(): string {
    return uuid.v4() as string;
  }

  /**
   * Get current timestamp in ISO format
   */
  protected now(): string {
    return new Date().toISOString();
  }

  /**
   * Build WHERE clause for soft delete
   */
  protected softDeleteFilter(includeDeleted = false): string {
    return includeDeleted ? '' : 'WHERE deleted_at IS NULL';
  }

  /**
   * Execute a query
   */
  protected async query<R = T>(sql: string, params: any[] = []): Promise<R[]> {
    return await dbManager.query<R>(sql, params);
  }

  /**
   * Execute a query and return first result
   */
  protected async queryFirst<R = T>(sql: string, params: any[] = []): Promise<R | null> {
    return await dbManager.queryFirst<R>(sql, params);
  }

  /**
   * Execute an INSERT/UPDATE/DELETE
   */
  protected async execute(sql: string, params: any[] = []) {
    return await dbManager.execute(sql, params);
  }

  /**
   * Get all records (excluding soft deleted)
   */
  async findAll(includeDeleted = false): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} ${this.softDeleteFilter(includeDeleted)} ORDER BY created_at DESC`;
    return await this.query(sql);
  }

  /**
   * Get record by ID
   */
  abstract findById(id: string | number): Promise<T | null>;

  /**
   * Create a new record
   */
  abstract create(data: Partial<T>): Promise<T>;

  /**
   * Update a record
   */
  abstract update(id: string | number, data: Partial<T>): Promise<T | null>;

  /**
   * Soft delete a record
   */
  async delete(id: string | number, idColumn: string = 'local_id'): Promise<boolean> {
    const sql = `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE ${idColumn} = ? AND deleted_at IS NULL`;
    const result = await this.execute(sql, [this.now(), this.now(), id]);
    return result.changes > 0;
  }

  /**
   * Hard delete a record (use with caution)
   */
  async hardDelete(id: string | number, idColumn: string = 'local_id'): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${idColumn} = ?`;
    const result = await this.execute(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Count records
   */
  async count(includeDeleted = false): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${this.softDeleteFilter(includeDeleted)}`;
    const result = await this.queryFirst<{ count: number }>(sql);
    return result?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(id: string | number, idColumn: string = 'local_id'): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE ${idColumn} = ? AND deleted_at IS NULL`;
    const result = await this.queryFirst(sql, [id]);
    return result !== null;
  }

  /**
   * Bulk insert (use in transactions)
   */
  protected async bulkInsert(items: any[], columns: string[]): Promise<void> {
    if (items.length === 0) return;

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    await dbManager.transaction(async (tx) => {
      for (const item of items) {
        const values = columns.map(col => item[col]);
        await tx.runAsync(sql, values);
      }
    });
  }
}
