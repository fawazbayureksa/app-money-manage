import apiClient, { ApiResponse } from "./client";

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

export interface PaginatedAlerts {
  data: BudgetAlert[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface AlertParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
  budget_id?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const alertService = {
  // Get paginated budget alerts
  getAlerts: async (
    params?: AlertParams,
  ): Promise<ApiResponse<PaginatedAlerts>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.page_size) {
      queryParams.append("page_size", params.page_size.toString());
    }
    if (params?.unread_only) {
      queryParams.append("unread_only", "true");
    }
    if (params?.budget_id) {
      queryParams.append("budget_id", params.budget_id.toString());
    }
    if (params?.sort_by) {
      queryParams.append("sort_by", params.sort_by);
    }
    if (params?.sort_dir) {
      queryParams.append("sort_dir", params.sort_dir);
    }

    const url = `/budget-alerts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get<ApiResponse<PaginatedAlerts>>(url);
    return response.data;
  },

  // Mark alert as read
  markAsRead: async (alertId: number): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(
      `/budget-alerts/${alertId}/read`,
    );
    return response.data;
  },
  markAsReadAll: async (): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(
      `/budget-alerts/read-all`,
    );
    return response.data;
  },

  // Mark all alerts as read (old method - marks each individually)
  markAllAsReadOld: async (): Promise<ApiResponse> => {
    try {
      const unreadAlerts = await alertService.getAlerts({ unread_only: true });

      if (!unreadAlerts.data || unreadAlerts.data.data.length === 0) {
        return { success: true, message: "No unread alerts to mark" };
      }

      // Mark each alert as read
      await Promise.all(
        unreadAlerts.data.data.map((alert: BudgetAlert) =>
          alertService.markAsRead(alert.id),
        ),
      );

      return {
        success: true,
        message: `Marked ${unreadAlerts.data.data.length} alert${unreadAlerts.data.data.length > 1 ? "s" : ""} as read`,
      };
    } catch {
      return {
        success: false,
        message: "Failed to mark all alerts as read",
      };
    }
  },
  markAllAsRead: async (): Promise<ApiResponse> => {
    try {
      const unreadAlerts = await alertService.getAlerts({ unread_only: true });

      if (!unreadAlerts.data || unreadAlerts.data.total_items === 0) {
        return { success: true, message: "No unread alerts to mark" };
      }

      // Mark all alerts as read
      await alertService.markAsReadAll();

      return {
        success: true,
        message: "Marked all alerts as read",
      };
    } catch {
      return {
        success: false,
        message: "Failed to mark all alerts as read",
      };
    }
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await alertService.getAlerts({
      unread_only: true,
      page_size: 1,
    });
    return response.data?.total_items || 0;
  },
};

export default alertService;
