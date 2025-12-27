import apiClient, { ApiResponse } from './client';

export interface BudgetAlert {
  id: number;
  budget_id: number;
  percentage: number;
  spent_amount: number;
  message: string;
  is_read: boolean;
  created_at: string;
  category_id: number;
  category_name: string;
  budget_amount: number;
}

export interface AlertParams {
  unread_only?: boolean;
}

export const alertService = {
  // Get all budget alerts
  getAlerts: async (params?: AlertParams): Promise<ApiResponse<BudgetAlert[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.unread_only) {
      queryParams.append('unread_only', 'true');
    }
    
    const url = `/budget-alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<BudgetAlert[]>>(url);
    return response.data;
  },

  // Mark alert as read
  markAsRead: async (alertId: number): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/budget-alerts/${alertId}/read`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await alertService.getAlerts({ unread_only: true });
    return response.data?.length || 0;
  },
};

export default alertService;
