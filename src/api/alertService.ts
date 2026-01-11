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
  markAsReadAll: async (): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/budget-alerts/read-all`);
    return response.data;
  },

  // Mark all alerts as read
  markAllAsReadOld: async (): Promise<ApiResponse> => {
    try {
      const unreadAlerts = await alertService.getAlerts({ unread_only: true });

      if (!unreadAlerts.data || unreadAlerts.data.length === 0) {
        return { success: true, message: 'No unread alerts to mark' };
      }

      // Mark each alert as read
      await Promise.all(
        unreadAlerts.data.map(alert => alertService.markAsRead(alert.id))
      );

      return {
        success: true,
        message: `Marked ${unreadAlerts.data.length} alert${unreadAlerts.data.length > 1 ? 's' : ''} as read`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to mark all alerts as read'
      };
    }
  },
  markAllAsRead: async (): Promise<ApiResponse> => {
    try {
      const unreadAlerts = await alertService.getAlerts({ unread_only: true });

      if (!unreadAlerts.data || unreadAlerts.data.length === 0) {
        return { success: true, message: 'No unread alerts to mark' };
      }

      // Mark all alerts as read
      await alertService.markAsReadAll();

      return {
        success: true,
        message: 'Marked all alerts as read'
      };
    } catch {
      return {
        success: false,
        message: 'Failed to mark all alerts as read'
      };
    }
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await alertService.getAlerts({ unread_only: true });
    return response.data?.length || 0;
  },
};

export default alertService;
