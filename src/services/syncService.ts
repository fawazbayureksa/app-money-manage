/**
 * Sync Service
 * Handles synchronization of master data from backend
 */

import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/client';
import { dbManager } from '../database';
import { Bank, bankRepository } from '../database/BankRepository';
import { Category, categoryRepository } from '../database/CategoryRepository';

export type SyncEntityType = 'banks' | 'categories';

export interface SyncMetadata {
  entity_type: SyncEntityType;
  last_sync_at: string;
  last_sync_version: number;
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string | null;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  entity_type: SyncEntityType;
  synced_count: number;
  error?: string;
  timestamp: string;
}

class SyncService {
  private isSyncing = false;
  private syncPromise: Promise<SyncResult[]> | null = null;

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  /**
   * Sync all master data entities
   */
  async syncAll(): Promise<SyncResult[]> {
    // Return existing promise if sync is in progress
    if (this.isSyncing && this.syncPromise) {
      console.log('⏳ Sync already in progress, waiting...');
      return this.syncPromise;
    }

    this.isSyncing = true;
    this.syncPromise = this._syncAll();

    try {
      const results = await this.syncPromise;
      return results;
    } finally {
      this.isSyncing = false;
      this.syncPromise = null;
    }
  }

  private async _syncAll(): Promise<SyncResult[]> {
    console.log('🔄 Starting master data sync...');

    // Check network connectivity
    const online = await this.isOnline();
    if (!online) {
      console.log('📡 No network connection, skipping sync');
      return [];
    }

    const results: SyncResult[] = [];

    // Sync banks
    try {
      const bankResult = await this.syncBanks();
      results.push(bankResult);
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      results.push({
        success: false,
        entity_type: 'banks',
        synced_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    // Sync categories
    try {
      const categoryResult = await this.syncCategories();
      results.push(categoryResult);
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      results.push({
        success: false,
        entity_type: 'categories',
        synced_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Sync completed: ${successCount}/${results.length} entities synced`);

    return results;
  }

  /**
   * Sync banks from backend
   */
  async syncBanks(): Promise<SyncResult> {
    console.log('🏦 Syncing banks...');
    
    try {
      // Update sync status to in_progress
      await this.updateSyncMetadata('banks', { sync_status: 'in_progress' });

      // Get last sync timestamp
      const lastSync = await this.getSyncMetadata('banks');
      const lastSyncTime = lastSync?.last_sync_at || new Date(0).toISOString();

      // Fetch banks from backend (incremental if possible)
      const response = await apiClient.get('/banks', {
        params: { updated_after: lastSyncTime },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch banks');
      }

      // Extract banks from response
      let banks: Bank[] = [];
      if (response.data.data?.data) {
        // Paginated response
        banks = response.data.data.data;
      } else if (Array.isArray(response.data.data)) {
        // Direct array
        banks = response.data.data;
      }

      console.log(`📥 Received ${banks.length} banks from backend`);

      // Bulk upsert banks
      if (banks.length > 0) {
        await bankRepository.bulkUpsert(banks.map((b: any) => ({
          remote_id: b.id || b.remote_id,
          bank_name: b.bank_name,
          color: b.color || undefined,
          image: b.image || undefined,
          created_at: b.created_at,
          updated_at: b.updated_at,
        })));
      }

      // Update sync metadata
      await this.updateSyncMetadata('banks', {
        sync_status: 'completed',
        last_sync_at: new Date().toISOString(),
        error_message: null,
      });

      console.log(`✅ Banks synced successfully: ${banks.length} items`);

      return {
        success: true,
        entity_type: 'banks',
        synced_count: banks.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      
      // Update sync metadata with error
      await this.updateSyncMetadata('banks', {
        sync_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      // Don't throw - allow app to continue with cached data
      return {
        success: false,
        entity_type: 'banks',
        synced_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sync categories from backend
   */
  async syncCategories(): Promise<SyncResult> {
    console.log('📁 Syncing categories...');
    
    try {
      // Update sync status to in_progress
      await this.updateSyncMetadata('categories', { sync_status: 'in_progress' });

      // Get last sync timestamp
      const lastSync = await this.getSyncMetadata('categories');
      const lastSyncTime = lastSync?.last_sync_at || new Date(0).toISOString();

      // Fetch categories from backend (incremental if possible)
      const response = await apiClient.get('/categories', {
        params: { updated_after: lastSyncTime },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch categories');
      }

      // Extract categories from response
      let categories: Category[] = response.data.data || [];

      console.log(`📥 Received ${categories.length} categories from backend`);

      // Bulk upsert categories
      if (categories.length > 0) {
        await categoryRepository.bulkUpsert(categories.map((c: any) => ({
          remote_id: c.ID || c.remote_id,
          category_name: c.CategoryName || c.category_name,
          description: c.Description || c.description || undefined,
          user_id: c.UserID || c.user_id || undefined,
          created_at: c.CreatedAt || c.created_at,
          updated_at: c.UpdatedAt || c.updated_at,
        })));
      }

      // Update sync metadata
      await this.updateSyncMetadata('categories', {
        sync_status: 'completed',
        last_sync_at: new Date().toISOString(),
        error_message: null,
      });

      console.log(`✅ Categories synced successfully: ${categories.length} items`);

      return {
        success: true,
        entity_type: 'categories',
        synced_count: categories.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      
      // Update sync metadata with error
      await this.updateSyncMetadata('categories', {
        sync_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      // Don't throw - allow app to continue with cached data
      return {
        success: false,
        entity_type: 'categories',
        synced_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get sync metadata for entity
   */
  async getSyncMetadata(entityType: SyncEntityType): Promise<SyncMetadata | null> {
    const sql = `SELECT * FROM sync_metadata WHERE entity_type = ?`;
    return await dbManager.queryFirst<SyncMetadata>(sql, [entityType]);
  }

  /**
   * Update sync metadata
   */
  async updateSyncMetadata(
    entityType: SyncEntityType,
    data: Partial<Omit<SyncMetadata, 'entity_type'>>
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.last_sync_at !== undefined) {
      updates.push('last_sync_at = ?');
      values.push(data.last_sync_at);
    }
    if (data.last_sync_version !== undefined) {
      updates.push('last_sync_version = ?');
      values.push(data.last_sync_version);
    }
    if (data.sync_status !== undefined) {
      updates.push('sync_status = ?');
      values.push(data.sync_status);
    }
    if (data.error_message !== undefined) {
      updates.push('error_message = ?');
      values.push(data.error_message);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(entityType);

    const sql = `UPDATE sync_metadata SET ${updates.join(', ')} WHERE entity_type = ?`;
    await dbManager.execute(sql, values);
  }

  /**
   * Check if initial sync is needed
   */
  async needsInitialSync(): Promise<boolean> {
    const banksCount = await bankRepository.count();
    const categoriesCount = await categoryRepository.count();
    
    return banksCount === 0 || categoriesCount === 0;
  }

  /**
   * Get all sync metadata
   */
  async getAllSyncMetadata(): Promise<SyncMetadata[]> {
    const sql = `SELECT * FROM sync_metadata ORDER BY entity_type`;
    return await dbManager.query<SyncMetadata>(sql);
  }

  /**
   * Reset sync metadata (for testing)
   */
  async resetSyncMetadata(entityType?: SyncEntityType): Promise<void> {
    if (entityType) {
      await dbManager.execute(
        `UPDATE sync_metadata 
         SET last_sync_at = ?, sync_status = 'pending', error_message = NULL, updated_at = ? 
         WHERE entity_type = ?`,
        [new Date(0).toISOString(), new Date().toISOString(), entityType]
      );
    } else {
      await dbManager.execute(
        `UPDATE sync_metadata 
         SET last_sync_at = ?, sync_status = 'pending', error_message = NULL, updated_at = ?`,
        [new Date(0).toISOString(), new Date().toISOString()]
      );
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
