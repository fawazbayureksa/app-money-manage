import apiClient, { ApiResponse } from "./client";

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
  asset_id: number;
  category_id: number;
  amount: number;
  description: string;
  date: string;
  transaction_type: string;
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: "Income" | "Expense";
  category_id?: number;
  wallet_id?: number;
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
    params?: TransactionListParams,
  ): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      "/v2/transactions",
      {
        params,
      },
    );
    return response.data;
  },

  // Create a new transaction
  createTransaction: async (
    transactionData: TransactionData,
  ): Promise<ApiResponse<Transaction>> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      "/v2/transactions",
      transactionData,
    );
    return response.data;
  },

  // Get a single transaction by ID
  getTransaction: async (
    transactionId: number,
  ): Promise<ApiResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/v2/transactions/${transactionId}`,
    );
    return response.data;
  },

  // Delete a transaction
  deleteTransaction: async (transactionId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/v2/transactions/${transactionId}`,
    );
    return response.data;
  },
};

export default transactionService;
