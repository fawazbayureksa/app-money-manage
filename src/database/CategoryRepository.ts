/**
 * Category Repository (Master Data)
 * Handles local caching of categories from backend
 */

import { BaseRepository, MasterEntity } from './BaseRepository';
import { TableName } from './schema';

export interface Category extends MasterEntity {
  category_name: string;
  description?: string | null;
  user_id?: number | null;
}

class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(TableName.CATEGORIES);
  }

  /**
   * Find category by remote_id
   */
  async findById(remoteId: number): Promise<Category | null> {
    const sql = `SELECT * FROM categories WHERE remote_id = ? AND deleted_at IS NULL`;
    return await this.queryFirst<Category>(sql, [remoteId]);
  }

  /**
   * Upsert category from sync (server data)
   */
  async upsert(data: {
    remote_id: number;
    category_name: string;
    description?: string;
    user_id?: number;
    created_at?: string;
    updated_at?: string;
    version?: number;
  }): Promise<Category> {
    const now = this.now();
    
    const category: Category = {
      remote_id: data.remote_id,
      category_name: data.category_name,
      description: data.description || null,
      user_id: data.user_id || null,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      version: data.version || 1,
      last_synced_at: now,
    };

    const sql = `
      INSERT INTO categories (
        remote_id, category_name, description, user_id, created_at, 
        updated_at, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(remote_id) DO UPDATE SET
        category_name = excluded.category_name,
        description = excluded.description,
        user_id = excluded.user_id,
        updated_at = excluded.updated_at,
        version = excluded.version,
        last_synced_at = excluded.last_synced_at
    `;

    await this.execute(sql, [
      category.remote_id,
      category.category_name,
      category.description,
      category.user_id,
      category.created_at,
      category.updated_at,
      category.version,
      category.last_synced_at,
    ]);

    return (await this.findById(category.remote_id))!;
  }

  /**
   * Bulk upsert categories from sync
   */
  async bulkUpsert(categories: Array<{
    remote_id: number;
    category_name: string;
    description?: string;
    user_id?: number;
    created_at?: string;
    updated_at?: string;
    version?: number;
  }>): Promise<void> {
    if (categories.length === 0) return;

    const now = this.now();
    const sql = `
      INSERT INTO categories (
        remote_id, category_name, description, user_id, created_at, 
        updated_at, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(remote_id) DO UPDATE SET
        category_name = excluded.category_name,
        description = excluded.description,
        user_id = excluded.user_id,
        updated_at = excluded.updated_at,
        version = excluded.version,
        last_synced_at = excluded.last_synced_at
    `;

    const db = await this.execute('BEGIN TRANSACTION', []);
    
    try {
      for (const category of categories) {
        await this.execute(sql, [
          category.remote_id,
          category.category_name,
          category.description || null,
          category.user_id || null,
          category.created_at || now,
          category.updated_at || now,
          category.version || 1,
          now,
        ]);
      }
      await this.execute('COMMIT', []);
    } catch (error) {
      await this.execute('ROLLBACK', []);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async findAll(includeDeleted = false): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories 
      ${this.softDeleteFilter(includeDeleted)} 
      ORDER BY category_name ASC
    `;
    return await this.query(sql);
  }

  /**
   * Search categories by name
   */
  async search(query: string): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories 
      WHERE category_name LIKE ? AND deleted_at IS NULL 
      ORDER BY category_name ASC
    `;
    return await this.query(sql, [`%${query}%`]);
  }

  /**
   * Get categories for specific user (if user-specific categories exist)
   */
  async findByUser(userId: number): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories 
      WHERE (user_id = ? OR user_id IS NULL) AND deleted_at IS NULL 
      ORDER BY category_name ASC
    `;
    return await this.query(sql, [userId]);
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<string | null> {
    const sql = `SELECT MAX(last_synced_at) as last_sync FROM categories`;
    const result = await this.queryFirst<{ last_sync: string }>(sql);
    return result?.last_sync || null;
  }

  /**
   * Create a local category (user-created, not synced from backend)
   * Note: Local categories will have remote_id = 0 or negative value
   */
  async createLocal(data: {
    category_name: string;
    description?: string;
    user_id?: number;
  }): Promise<Category> {
    const now = this.now();
    
    // Use negative remote_id for local-only categories
    const tempRemoteId = -Math.floor(Math.random() * 1000000);
    
    const category: Category = {
      remote_id: tempRemoteId,
      category_name: data.category_name,
      description: data.description || null,
      user_id: data.user_id || null,
      created_at: now,
      updated_at: now,
      version: 1,
      last_synced_at: now, // Set to current time for local-only categories
    };

    const sql = `
      INSERT INTO categories (
        remote_id, category_name, description, user_id, created_at,
        updated_at, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(sql, [
      category.remote_id,
      category.category_name,
      category.description,
      category.user_id,
      category.created_at,
      category.updated_at,
      category.version,
      category.last_synced_at,
    ]);

    return (await this.findById(category.remote_id))!;
  }
}

export const categoryRepository = new CategoryRepository();
