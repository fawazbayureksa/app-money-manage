/**
 * Transaction Repository
 * Handles CRUD operations for local transactions
 */

import { BaseRepository, LocalEntity } from './BaseRepository';
import { TableName } from './schema';

export interface Transaction extends LocalEntity {
  bank_id: number;
  category_id: number;
  amount: number;
  description: string;
  transaction_type: 1 | 2; // 1=income, 2=expense
  date: string;
  
  // Joined data (not stored)
  bank_name?: string;
  category_name?: string;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  transactionType?: 1 | 2;
  bankId?: number;
  categoryId?: number;
  limit?: number;
  offset?: number;
}

export interface TransactionStats {
  total_income: number;
  total_expense: number;
  net_amount: number;
  count: number;
}

class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(TableName.TRANSACTIONS);
  }

  /**
   * Find transaction by local_id
   */
  async findById(localId: string): Promise<Transaction | null> {
    const sql = `
      SELECT 
        t.*,
        b.bank_name,
        c.category_name
      FROM transactions t
      LEFT JOIN banks b ON t.bank_id = b.remote_id
      LEFT JOIN categories c ON t.category_id = c.remote_id
      WHERE t.local_id = ? AND t.deleted_at IS NULL
    `;
    return await this.queryFirst<Transaction>(sql, [localId]);
  }

  /**
   * Create a new transaction
   */
  async create(data: Omit<Transaction, keyof LocalEntity | 'bank_name' | 'category_name'>): Promise<Transaction> {
    const transaction: Transaction = {
      local_id: this.generateId(),
      bank_id: data.bank_id,
      category_id: data.category_id,
      amount: data.amount,
      description: data.description,
      transaction_type: data.transaction_type,
      date: data.date,
      created_at: this.now(),
      updated_at: this.now(),
      sync_status: 'local',
      version: 1,
    };

    const sql = `
      INSERT INTO transactions (
        local_id, bank_id, category_id, amount, description, 
        transaction_type, date, created_at, updated_at, sync_status, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(sql, [
      transaction.local_id,
      transaction.bank_id,
      transaction.category_id,
      transaction.amount,
      transaction.description,
      transaction.transaction_type,
      transaction.date,
      transaction.created_at,
      transaction.updated_at,
      transaction.sync_status,
      transaction.version,
    ]);

    return (await this.findById(transaction.local_id))!;
  }

  /**
   * Update a transaction
   */
  async update(localId: string, data: Partial<Omit<Transaction, keyof LocalEntity>>): Promise<Transaction | null> {
    const existing = await this.findById(localId);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.bank_id !== undefined) {
      updates.push('bank_id = ?');
      values.push(data.bank_id);
    }
    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(data.category_id);
    }
    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.transaction_type !== undefined) {
      updates.push('transaction_type = ?');
      values.push(data.transaction_type);
    }
    if (data.date !== undefined) {
      updates.push('date = ?');
      values.push(data.date);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?', 'version = version + 1');
    values.push(this.now(), localId);

    const sql = `UPDATE transactions SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`;
    await this.execute(sql, values);

    return await this.findById(localId);
  }

  /**
   * Get transactions with filters
   */
  async findWithFilters(filter: TransactionFilter = {}): Promise<Transaction[]> {
    const conditions: string[] = ['t.deleted_at IS NULL'];
    const params: any[] = [];

    if (filter.startDate) {
      conditions.push('t.date >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('t.date <= ?');
      params.push(filter.endDate);
    }
    if (filter.transactionType) {
      conditions.push('t.transaction_type = ?');
      params.push(filter.transactionType);
    }
    if (filter.bankId) {
      conditions.push('t.bank_id = ?');
      params.push(filter.bankId);
    }
    if (filter.categoryId) {
      conditions.push('t.category_id = ?');
      params.push(filter.categoryId);
    }

    let sql = `
      SELECT 
        t.*,
        b.bank_name,
        c.category_name
      FROM transactions t
      LEFT JOIN banks b ON t.bank_id = b.remote_id
      LEFT JOIN categories c ON t.category_id = c.remote_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.date DESC, t.created_at DESC
    `;

    if (filter.limit) {
      sql += ` LIMIT ${filter.limit}`;
      if (filter.offset) {
        sql += ` OFFSET ${filter.offset}`;
      }
    }

    return await this.query<Transaction>(sql, params);
  }

  /**
   * Get transaction statistics
   */
  async getStats(filter?: { start_date?: string; end_date?: string; startDate?: string; endDate?: string }): Promise<TransactionStats> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];

    const startDate = filter?.start_date || filter?.startDate;
    const endDate = filter?.end_date || filter?.endDate;

    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 1 THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN transaction_type = 2 THEN amount ELSE 0 END), 0) as totalExpense,
        COUNT(*) as count
      FROM transactions
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.queryFirst<{
      totalIncome: number;
      totalExpense: number;
      count: number;
    }>(sql, params);

    return {
      total_income: result?.totalIncome || 0,
      total_expense: result?.totalExpense || 0,
      net_amount: (result?.totalIncome || 0) - (result?.totalExpense || 0),
      count: result?.count || 0,
    };
  }

  /**
   * Get transactions grouped by date
   */
  async findGroupedByDate(filter: TransactionFilter = {}): Promise<{ date: string; transactions: Transaction[] }[]> {
    const transactions = await this.findWithFilters(filter);
    
    const grouped = transactions.reduce((acc, transaction) => {
      const date = transaction.date.split('T')[0]; // Get date part only
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return Object.entries(grouped)
      .map(([date, transactions]) => ({ date, transactions }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get spending by category
   */
  async getSpendingByCategory(filter?: { startDate?: string; endDate?: string }): Promise<Array<{
    category_id: number;
    category_name: string;
    total: number;
    count: number;
  }>> {
    const conditions: string[] = ['t.deleted_at IS NULL', 't.transaction_type = 2'];
    const params: any[] = [];

    if (filter?.startDate) {
      conditions.push('t.date >= ?');
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      conditions.push('t.date <= ?');
      params.push(filter.endDate);
    }

    const sql = `
      SELECT 
        t.category_id,
        c.category_name,
        SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.remote_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.category_id, c.category_name
      ORDER BY total DESC
    `;

    return await this.query(sql, params);
  }
}

export const transactionRepository = new TransactionRepository();
