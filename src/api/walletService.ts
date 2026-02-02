import apiClient, { ApiResponse } from "./client";

export interface Wallet {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bank_name: string | null;
  account_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWalletRequest {
  name: string;
  type: string;
  balance: number;
  currency: string;
  bank_name?: string;
  account_no?: string;
}

export interface UpdateWalletRequest {
  name?: string;
  type?: string;
  balance?: number;
  currency?: string;
  bank_name?: string;
  account_no?: string;
}

export interface WalletSummary {
  currency: string;
  total_balance: number;
  wallet_count: number;
}

export interface WalletListResponse {
  data: Wallet[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export const walletService = {
  getWallets: async (params?: {
    page?: number;
    page_size?: number;
    currency?: string;
    type?: string;
  }): Promise<ApiResponse<Wallet[]>> => {
    const response = await apiClient.get<ApiResponse<Wallet[]>>("/wallets", {
      params,
    });
    return response.data;
  },

  getWallet: async (walletId: number): Promise<ApiResponse<Wallet>> => {
    const response = await apiClient.get<ApiResponse<Wallet>>(
      `/wallets/${walletId}`,
    );
    return response.data;
  },

  getWalletSummary: async (): Promise<ApiResponse<WalletSummary[]>> => {
    const response =
      await apiClient.get<ApiResponse<WalletSummary[]>>("/wallets/summary");
    return response.data;
  },

  createWallet: async (
    data: CreateWalletRequest,
  ): Promise<ApiResponse<Wallet>> => {
    const response = await apiClient.post<ApiResponse<Wallet>>(
      "/wallets",
      data,
    );
    return response.data;
  },

  updateWallet: async (
    walletId: number,
    data: UpdateWalletRequest,
  ): Promise<ApiResponse<Wallet>> => {
    const response = await apiClient.put<ApiResponse<Wallet>>(
      `/wallets/${walletId}`,
      data,
    );
    return response.data;
  },

  deleteWallet: async (walletId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/wallets/${walletId}`,
    );
    return response.data;
  },
};

export default walletService;
