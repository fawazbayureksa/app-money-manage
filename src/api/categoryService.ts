import apiClient, { ApiResponse } from './client';

export interface Category {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface CategoryData {
  name: string;
}

export const categoryService = {
  // Get all categories for the authenticated user
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },

  // Create a new category
  createCategory: async (categoryData: CategoryData): Promise<ApiResponse<Category>> => {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', categoryData);
    return response.data;
  },

  // Update a category
  updateCategory: async (
    categoryId: number,
    categoryData: CategoryData
  ): Promise<ApiResponse<Category>> => {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  },

  // Delete a category
  deleteCategory: async (categoryId: number): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/categories/${categoryId}`);
    return response.data;
  },

  // Get a single category by ID
  getCategory: async (categoryId: number): Promise<ApiResponse<Category>> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${categoryId}`);
    return response.data;
  },
};

export default categoryService;
