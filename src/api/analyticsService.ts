import apiClient, { ApiResponse } from './client';

export interface MonthSummary {
    total_income: number;
    total_expense: number;
    net_amount: number;
    income_count: number;
    expense_count: number;
    savings_rate: number;
}

export interface TopCategory {
    category_id: number;
    category_name: string;
    total_amount: number;
    percentage: number;
    count: number;
}

export interface RecentTransaction {
    id: number;
    description: string;
    amount: number;
    transaction_type: number; // 1=income, 2=expense
    date: string;
    category_name: string;
    bank_name: string;
}

export interface BudgetSummary {
    total_budgets: number;
    active_budgets: number;
    exceeded_budgets: number;
    warning_budgets: number;
    total_budgeted: number;
    total_spent: number;
    average_utilization: number;
}

export interface DashboardSummary {
    current_month: MonthSummary;
    last_month: MonthSummary;
    top_categories: TopCategory[];
    recent_transactions: RecentTransaction[];
    budget_summary: BudgetSummary;
}

export interface DashboardParams {
    start_date?: string; // Format: YYYY-MM-DD
    end_date?: string; // Format: YYYY-MM-DD
}

export const analyticsService = {
    // Get dashboard summary with analytics data
    getDashboardSummary: async (
        params?: DashboardParams
    ): Promise<ApiResponse<DashboardSummary>> => {
        const response = await apiClient.get<ApiResponse<DashboardSummary>>(
            '/analytics/dashboard',
            { params }
        );
        return response.data;
    },
};
