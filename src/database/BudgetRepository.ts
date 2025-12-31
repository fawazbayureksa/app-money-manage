/**
 * Budget Repository
 * Handles CRUD operations for local budgets
 */

import { BaseRepository, LocalEntity } from './BaseRepository';
import { TableName } from './schema';
import { transactionRepository } from './TransactionRepository';

export interface Budget extends LocalEntity {
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  is_active: number; // SQLite uses 0/1 for boolean
  alert_at: number;
  description?: string | null;
  
  // Computed fields (not stored)
  category_name?: string;
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
  status?: 'safe' | 'warning' | 'exceeded';
  days_remaining?: number;
}

export interface BudgetWithStats extends Budget {
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  status: 'safe' | 'warning' | 'exceeded';
  days_remaining: number;
}

class BudgetRepository extends BaseRepository<Budget> {
  constructor() {
    super(TableName.BUDGETS);
  }

  /**
   * Find budget by local_id
   */
  async findById(localId: string): Promise<Budget | null> {
    const sql = `
      SELECT 
        b.*,
        c.category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.remote_id
      WHERE b.local_id = ? AND b.deleted_at IS NULL
    `;
    return await this.queryFirst<Budget>(sql, [localId]);
  }

  /**
   * Create a new budget
   */
  async create(data: {
    category_id: number;
    amount: number;
    period: 'monthly' | 'yearly';
    start_date: string;
    alert_at: number;
    description?: string;
  }): Promise<Budget> {
    const budget: Budget = {
      local_id: this.generateId(),
      category_id: data.category_id,
      amount: data.amount,
      period: data.period,
      start_date: data.start_date,
      end_date: this.calculateEndDate(data.start_date, data.period),
      is_active: 1,
      alert_at: data.alert_at,
      description: data.description || null,
      created_at: this.now(),
      updated_at: this.now(),
      sync_status: 'local',
      version: 1,
    };

    const sql = `
      INSERT INTO budgets (
        local_id, category_id, amount, period, start_date, end_date,
        is_active, alert_at, description, created_at, updated_at, 
        sync_status, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(sql, [
      budget.local_id,
      budget.category_id,
      budget.amount,
      budget.period,
      budget.start_date,
      budget.end_date,
      budget.is_active,
      budget.alert_at,
      budget.description,
      budget.created_at,
      budget.updated_at,
      budget.sync_status,
      budget.version,
    ]);

    return (await this.findById(budget.local_id))!;
  }

  /**
   * Update a budget
   */
  async update(localId: string | number, data: Partial<Budget>): Promise<Budget | null> {
    const existing = await this.findById(localId as string);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(data.category_id);
    }
    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }
    if (data.period !== undefined) {
      updates.push('period = ?');
      values.push(data.period);
      
      // Recalculate end_date if period changes
      const startDate = data.start_date || existing.start_date;
      updates.push('end_date = ?');
      values.push(this.calculateEndDate(startDate, data.period));
    }
    if (data.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(data.start_date);
      
      // Recalculate end_date if start_date changes
      const period = data.period || existing.period;
      updates.push('end_date = ?');
      values.push(this.calculateEndDate(data.start_date, period));
    }
    if (data.alert_at !== undefined) {
      updates.push('alert_at = ?');
      values.push(data.alert_at);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?', 'version = version + 1');
    values.push(this.now(), localId as string);

    const sql = `UPDATE budgets SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`;
    await this.execute(sql, values);

    return await this.findById(localId as string);
  }

  /**
   * Get all active budgets
   */
  async findActive(): Promise<Budget[]> {
    const sql = `
      SELECT 
        b.*,
        c.category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.remote_id
      WHERE b.is_active = 1 AND b.deleted_at IS NULL
      ORDER BY b.created_at DESC
    `;
    return await this.query<Budget>(sql);
  }

  /**
   * Get budgets with spending statistics
   */
  async findWithStats(): Promise<BudgetWithStats[]> {
    const budgets = await this.findActive();
    const now = new Date();
    
    const budgetsWithStats = await Promise.all(
      budgets.map(async (budget) => {
        // Get spending for this budget's category and period
        const spent = await this.getSpentAmount(budget);
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;
        
        // Determine status
        let status: 'safe' | 'warning' | 'exceeded';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= budget.alert_at) {
          status = 'warning';
        } else {
          status = 'safe';
        }

        // Calculate days remaining
        const endDate = new Date(budget.end_date || budget.start_date);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...budget,
          spent_amount: spent,
          remaining_amount: remaining,
          percentage_used: percentage,
          status,
          days_remaining: Math.max(0, daysRemaining),
        } as BudgetWithStats;
      })
    );

    return budgetsWithStats;
  }

  /**
   * Get spent amount for a budget
   */
  private async getSpentAmount(budget: Budget): Promise<number> {
    const stats = await transactionRepository.getStats({
      startDate: budget.start_date,
      endDate: budget.end_date || undefined,
    });
    
    // Get spending for this specific category
    const categorySpending = await transactionRepository.getSpendingByCategory({
      startDate: budget.start_date,
      endDate: budget.end_date || undefined,
    });
    
    const categoryData = categorySpending.find(s => s.category_id === budget.category_id);
    return categoryData?.total || 0;
  }

  /**
   * Get budget by category
   */
  async findByCategory(categoryId: number): Promise<Budget | null> {
    const sql = `
      SELECT 
        b.*,
        c.category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.remote_id
      WHERE b.category_id = ? AND b.is_active = 1 AND b.deleted_at IS NULL
      ORDER BY b.created_at DESC
      LIMIT 1
    `;
    return await this.queryFirst<Budget>(sql, [categoryId]);
  }

  /**
   * Calculate end date based on period
   */
  private calculateEndDate(startDate: string, period: 'monthly' | 'yearly'): string {
    const start = new Date(startDate);
    
    if (period === 'monthly') {
      start.setMonth(start.getMonth() + 1);
    } else {
      start.setFullYear(start.getFullYear() + 1);
    }
    
    return start.toISOString();
  }

  /**
   * Deactivate expired budgets
   */
  async deactivateExpired(): Promise<number> {
    const now = this.now();
    const sql = `
      UPDATE budgets 
      SET is_active = 0, updated_at = ? 
      WHERE end_date < ? AND is_active = 1 AND deleted_at IS NULL
    `;
    const result = await this.execute(sql, [now, now]);
    return result.changes;
  }
}

export const budgetRepository = new BudgetRepository();
