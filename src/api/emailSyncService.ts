import apiClient, { ApiResponse } from "./client";

export type EmailSyncLogStatus = "imported" | "skipped" | "failed";

export interface EmailSyncAuthData {
  auth_url: string;
}

export interface EmailSyncResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

export interface EmailSyncLog {
  id: number;
  gmail_message_id: string;
  subject: string;
  from_email: string;
  bank_name: string;
  amount: number;
  asset_id: number | null;
  transaction_id: number | null;
  status: EmailSyncLogStatus;
  error_message: string;
  email_date: string;
  created_at: string;
}

export interface EmailSyncStatusData {
  connected: boolean;
  logs: EmailSyncLog[];
  total: number;
  page: number;
  limit: number;
}

export const emailSyncService = {
  getAuthUrl: async (): Promise<ApiResponse<EmailSyncAuthData>> => {
    const response = await apiClient.get<ApiResponse<EmailSyncAuthData>>(
      "/v2/email-sync/auth",
    );
    return response.data;
  },

  sync: async (): Promise<ApiResponse<EmailSyncResult>> => {
    const response = await apiClient.post<ApiResponse<EmailSyncResult>>(
      "/v2/email-sync/sync",
    );
    return response.data;
  },

  getStatus: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<EmailSyncStatusData>> => {
    const response = await apiClient.get<ApiResponse<EmailSyncStatusData>>(
      `/v2/email-sync/status?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  disconnect: async (): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      "/v2/email-sync/disconnect",
    );
    return response.data;
  },
};

export default emailSyncService;
