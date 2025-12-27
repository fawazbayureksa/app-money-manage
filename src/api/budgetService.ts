import apiClient, { ApiResponse } from './client';

export interface Budget {
  id: number;
  category_id: number;
  category_name?: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  alert_at: number;
  description?: string;
  created_at: string;
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
  status?: 'safe' | 'warning' | 'exceeded';
  days_remaining?: number;
}

export interface BudgetData {
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  alert_at: number;
}

export interface PaginatedBudgetResponse {
  data: Budget[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export const budgetService = {
  // Get all budgets
  getBudgets: async (): Promise<ApiResponse<PaginatedBudgetResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedBudgetResponse>>('/budgets');
    return response.data;
  },

  // Get budget status (with spending data)
  getBudgetStatus: async (): Promise<ApiResponse<PaginatedBudgetResponse>> => {
    const response = await apiClient.get<ApiResponse<PaginatedBudgetResponse>>('/budgets/status');
    return response.data;
  },

  // Create a new budget
  createBudget: async (budgetData: BudgetData): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.post<ApiResponse<Budget>>('/budgets', budgetData);
    return response.data;
  },

  // Get a single budget by ID
  getBudget: async (budgetId: number): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.get<ApiResponse<Budget>>(`/budgets/${budgetId}`);
    return response.data;
  },

  // Delete a budget
  deleteBudget: async (budgetId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/budgets/${budgetId}`);
    return response.data;
  },
};

export default budgetService;
