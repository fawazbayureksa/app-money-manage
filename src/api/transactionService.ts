import apiClient, { ApiResponse } from './client';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_type: number; // 1=income, 2=expense
  date: string;
  category_name?: string;
  bank_name?: string;
}

export interface TransactionData {
  BankID: number;
  CategoryID: number;
  Amount: number;
  Description: string;
  Date: string;
  TransactionType: 'Income' | 'Expense';
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: 'Income' | 'Expense';
}

export interface PaginationData {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: PaginationData;
}

export const transactionService = {
  // Get all transactions with optional filtering
  getTransactions: async (
    params?: TransactionListParams
  ): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions', {
      params,
    });
    return response.data;
  },

  // Create a new transaction
  createTransaction: async (
    transactionData: TransactionData
  ): Promise<ApiResponse<Transaction>> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      '/transaction',
      transactionData
    );
    return response.data;
  },

  // Get a single transaction by ID
  getTransaction: async (transactionId: number): Promise<ApiResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/transactions/${transactionId}`
    );
    return response.data;
  },

  // Delete a transaction
  deleteTransaction: async (transactionId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/transactions/${transactionId}`);
    return response.data;
  },
};

export default transactionService;
