import apiClient, { ApiResponse } from './client';

export interface Bank {
  id: number;
  bank_name: string;
  color?: string;
  image?: string;
}

export interface BankListResponse {
  data: Bank[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export const bankService = {
  // Get all banks for the authenticated user
  getBanks: async (): Promise<ApiResponse<BankListResponse>> => {
    const response = await apiClient.get<ApiResponse<BankListResponse>>('/banks?page=1&page_size=100');
    return response.data;
  },

  // Get a single bank by ID
  getBank: async (bankId: number): Promise<ApiResponse<Bank>> => {
    const response = await apiClient.get<ApiResponse<Bank>>(`/banks/${bankId}`);
    return response.data;
  },
};

export default bankService;
