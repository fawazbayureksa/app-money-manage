/**
 * Bank Repository (Master Data)
 * Handles local caching of banks from backend
 */

import { BaseRepository, MasterEntity } from './BaseRepository';
import { TableName } from './schema';

export interface Bank extends MasterEntity {
  bank_name: string;
  color?: string | null;
  image?: string | null;
}

class BankRepository extends BaseRepository<Bank> {
  constructor() {
    super(TableName.BANKS);
  }

  /**
   * Find bank by remote_id
   */
  async findById(remoteId: number): Promise<Bank | null> {
    const sql = `SELECT * FROM banks WHERE remote_id = ? AND deleted_at IS NULL`;
    return await this.queryFirst<Bank>(sql, [remoteId]);
  }

  /**
   * Upsert bank from sync (server data)
   */
  async upsert(data: {
    remote_id: number;
    bank_name: string;
    color?: string;
    image?: string;
    created_at?: string;
    updated_at?: string;
    version?: number;
  }): Promise<Bank> {
    const now = this.now();
    
    const bank: Bank = {
      remote_id: data.remote_id,
      bank_name: data.bank_name,
      color: data.color || null,
      image: data.image || null,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      version: data.version || 1,
      last_synced_at: now,
    };

    const sql = `
      INSERT INTO banks (
        remote_id, bank_name, color, image, created_at, 
        updated_at, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(remote_id) DO UPDATE SET
        bank_name = excluded.bank_name,
        color = excluded.color,
        image = excluded.image,
        updated_at = excluded.updated_at,
        version = excluded.version,
        last_synced_at = excluded.last_synced_at
    `;

    await this.execute(sql, [
      bank.remote_id,
      bank.bank_name,
      bank.color,
      bank.image,
      bank.created_at,
      bank.updated_at,
      bank.version,
      bank.last_synced_at,
    ]);

    return (await this.findById(bank.remote_id))!;
  }

  /**
   * Bulk upsert banks from sync
   */
  async bulkUpsert(banks: Array<{
    remote_id: number;
    bank_name: string;
    color?: string;
    image?: string;
    created_at?: string;
    updated_at?: string;
    version?: number;
  }>): Promise<void> {
    if (banks.length === 0) return;

    const now = this.now();
    const sql = `
      INSERT INTO banks (
        remote_id, bank_name, color, image, created_at, 
        updated_at, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(remote_id) DO UPDATE SET
        bank_name = excluded.bank_name,
        color = excluded.color,
        image = excluded.image,
        updated_at = excluded.updated_at,
        version = excluded.version,
        last_synced_at = excluded.last_synced_at
    `;

    const db = await this.execute('BEGIN TRANSACTION', []);
    
    try {
      for (const bank of banks) {
        await this.execute(sql, [
          bank.remote_id,
          bank.bank_name,
          bank.color || null,
          bank.image || null,
          bank.created_at || now,
          bank.updated_at || now,
          bank.version || 1,
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
   * Get all banks (always show all, no delete operation)
   */
  async findAll(includeDeleted = false): Promise<Bank[]> {
    const sql = `
      SELECT * FROM banks 
      ${this.softDeleteFilter(includeDeleted)} 
      ORDER BY bank_name ASC
    `;
    return await this.query(sql);
  }

  /**
   * Search banks by name
   */
  async search(query: string): Promise<Bank[]> {
    const sql = `
      SELECT * FROM banks 
      WHERE bank_name LIKE ? AND deleted_at IS NULL 
      ORDER BY bank_name ASC
    `;
    return await this.query(sql, [`%${query}%`]);
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<string | null> {
    const sql = `SELECT MAX(last_synced_at) as last_sync FROM banks`;
    const result = await this.queryFirst<{ last_sync: string }>(sql);
    return result?.last_sync || null;
  }

  /**
   * Override: Banks cannot be created locally
   */
  async create(): Promise<Bank> {
    throw new Error('Banks are master data and cannot be created locally. They must be synced from the backend.');
  }

  /**
   * Override: Banks cannot be updated locally
   */
  async update(): Promise<Bank | null> {
    throw new Error('Banks are master data and cannot be updated locally. They must be synced from the backend.');
  }

  /**
   * Override: Banks cannot be deleted locally (soft delete still disabled)
   */
  async delete(): Promise<boolean> {
    throw new Error('Banks are master data and cannot be deleted locally.');
  }
}

export const bankRepository = new BankRepository();
