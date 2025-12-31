/**
 * Budget Alert Repository
 * Handles CRUD operations for budget alerts
 */

import { BaseRepository } from './BaseRepository';
import { TableName } from './schema';

export interface BudgetAlert {
  local_id: string;
  remote_id?: number | null;
  budget_id: string; // FK to budgets.local_id
  percentage: number;
  spent_amount: number;
  message: string;
  is_read: number; // SQLite uses 0/1 for boolean
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  version: number;
  
  // Joined data (not stored)
  category_id?: number;
  category_name?: string;
  budget_amount?: number;
}

class BudgetAlertRepository extends BaseRepository<BudgetAlert> {
  constructor() {
    super(TableName.BUDGET_ALERTS);
  }

  /**
   * Find alert by local_id
   */
  async findById(localId: string): Promise<BudgetAlert | null> {
    const sql = `
      SELECT 
        a.*,
        b.category_id,
        c.category_name,
        b.amount as budget_amount
      FROM budget_alerts a
      LEFT JOIN budgets b ON a.budget_id = b.local_id
      LEFT JOIN categories c ON b.category_id = c.remote_id
      WHERE a.local_id = ? AND a.deleted_at IS NULL
    `;
    return await this.queryFirst<BudgetAlert>(sql, [localId]);
  }

  /**
   * Create a new alert
   */
  async create(data: {
    budget_id: string;
    percentage: number;
    spent_amount: number;
    message: string;
  }): Promise<BudgetAlert> {
    const alert: BudgetAlert = {
      local_id: this.generateId(),
      budget_id: data.budget_id,
      percentage: data.percentage,
      spent_amount: data.spent_amount,
      message: data.message,
      is_read: 0,
      created_at: this.now(),
      updated_at: this.now(),
      version: 1,
    };

    const sql = `
      INSERT INTO budget_alerts (
        local_id, budget_id, percentage, spent_amount, message,
        is_read, created_at, updated_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(sql, [
      alert.local_id,
      alert.budget_id,
      alert.percentage,
      alert.spent_amount,
      alert.message,
      alert.is_read,
      alert.created_at,
      alert.updated_at,
      alert.version,
    ]);

    return (await this.findById(alert.local_id))!;
  }

  /**
   * Update alert (mainly for marking as read)
   */
  async update(localId: string | number, data: Partial<BudgetAlert>): Promise<BudgetAlert | null> {
    const existing = await this.findById(localId as string);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.is_read !== undefined) {
      updates.push('is_read = ?');
      values.push(data.is_read ? 1 : 0);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?', 'version = version + 1');
    values.push(this.now(), localId as string);

    const sql = `UPDATE budget_alerts SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`;
    await this.execute(sql, values);

    return await this.findById(localId as string);
  }

  /**
   * Mark alert as read
   */
  async markAsRead(localId: string): Promise<boolean> {
    const result = await this.update(localId, { is_read: 1 } as Partial<BudgetAlert>);
    return result !== null;
  }

  /**
   * Mark multiple alerts as read
   */
  async markMultipleAsRead(localIds: string[]): Promise<number> {
    if (localIds.length === 0) return 0;

    const placeholders = localIds.map(() => '?').join(', ');
    const sql = `
      UPDATE budget_alerts 
      SET is_read = 1, updated_at = ?, version = version + 1 
      WHERE local_id IN (${placeholders}) AND deleted_at IS NULL
    `;
    
    const result = await this.execute(sql, [this.now(), ...localIds]);
    return result.changes;
  }

  /**
   * Get all alerts with optional filters
   */
  async findAll(includeDeleted = false): Promise<BudgetAlert[]> {
    return this.findAllWithOptions({ includeDeleted });
  }

  /**
   * Get all alerts with optional filters (extended)
   */
  async findAllWithOptions(options?: { unreadOnly?: boolean; includeDeleted?: boolean }): Promise<BudgetAlert[]> {
    const conditions: string[] = [];
    
    if (!options?.includeDeleted) {
      conditions.push('a.deleted_at IS NULL');
    }
    
    if (options?.unreadOnly) {
      conditions.push('a.is_read = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        a.*,
        b.category_id,
        c.category_name,
        b.amount as budget_amount
      FROM budget_alerts a
      LEFT JOIN budgets b ON a.budget_id = b.local_id
      LEFT JOIN categories c ON b.category_id = c.remote_id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;

    return await this.query<BudgetAlert>(sql);
  }

  /**
   * Get unread alert count
   */
  async getUnreadCount(): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM budget_alerts 
      WHERE is_read = 0 AND deleted_at IS NULL
    `;
    const result = await this.queryFirst<{ count: number }>(sql);
    return result?.count || 0;
  }

  /**
   * Get alerts for a specific budget
   */
  async findByBudget(budgetId: string): Promise<BudgetAlert[]> {
    const sql = `
      SELECT 
        a.*,
        b.category_id,
        c.category_name,
        b.amount as budget_amount
      FROM budget_alerts a
      LEFT JOIN budgets b ON a.budget_id = b.local_id
      LEFT JOIN categories c ON b.category_id = c.remote_id
      WHERE a.budget_id = ? AND a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `;
    return await this.query<BudgetAlert>(sql, [budgetId]);
  }

  /**
   * Check if alert exists (custom signature)
   */
  async existsForBudgetAndPercentage(budgetId: string, percentage: number): Promise<boolean> {
    const sql = `
      SELECT 1 
      FROM budget_alerts 
      WHERE budget_id = ? AND percentage = ? AND deleted_at IS NULL
    `;
    const result = await this.queryFirst(sql, [budgetId, percentage]);
    return result !== null;
  }

  /**
   * Delete old read alerts (cleanup)
   */
  async deleteOldReadAlerts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const sql = `
      UPDATE budget_alerts 
      SET deleted_at = ?, updated_at = ? 
      WHERE is_read = 1 AND created_at < ? AND deleted_at IS NULL
    `;
    
    const result = await this.execute(sql, [
      this.now(),
      this.now(),
      cutoffDate.toISOString(),
    ]);
    
    return result.changes;
  }
}

export const budgetAlertRepository = new BudgetAlertRepository();
