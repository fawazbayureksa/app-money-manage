import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import API_CONFIG from '../config/api';
import { handleApiError, handleSessionExpired } from '../context/ToastContext';
import { storage } from '../utils/storage';


// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and log requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

    } catch (error) {
      console.error('Error adding token to request:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Endpoints that should NOT show error popups (auth endpoints handle their own errors)
const SILENT_ERROR_ENDPOINTS = ['/login', '/register'];

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response
    return response;
  },
  async (error: AxiosError) => {
    const requestUrl = error.config?.url || '';
    const isSilentEndpoint = SILENT_ERROR_ENDPOINTS.some(endpoint => requestUrl.includes(endpoint));

    // Detailed error logging for debugging
    if (error.response) {
      // Server responded with error status
      console.error(`❌ API Error Response:`, {
        status: error.response.status,
        url: error.config?.url,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        data: error.response.data,
      });

      // Special handling for 404 errors
      if (error.response.status === 404) {
        console.error('🔍 404 Not Found - Possible causes:');
        console.error('  1. Backend is not running');
        console.error('  2. Wrong API endpoint path');
        console.error('  3. Backend routes not properly configured');
        console.error('  4. Base URL is incorrect');
        console.error(`  5. Check if ${error.config?.baseURL}${error.config?.url} exists`);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error(`❌ Network Error - No response received:`, {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        message: error.message,
        code: error.code,
      });
      console.error('🔍 Check if backend is accessible from this device');
      console.error('🔍 Verify API URL is correct:', API_CONFIG.BASE_URL);
      console.error('🔍 Try: curl', `${error.config?.baseURL}${error.config?.url}`);
    } else {
      // Something else happened
      console.error('❌ Request setup error:', error.message);
    }

    // Handle 401 Unauthorized - Show session expired popup and redirect
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - Session expired');
      await handleSessionExpired();
    } else if (error.response && !isSilentEndpoint) {
      // Show general error popup for other server errors (except auth endpoints)
      handleApiError();
    } else if (!error.response && !isSilentEndpoint) {
      // Network error - show popup
      handleApiError();
    }

    return Promise.reject(error);
  }
);


// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  address?: string;
  is_verified?: boolean;
  is_admin?: boolean;
}

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/register', {
      name: username,
      email,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/logout');
    return response.data;
  },

  // Note: getCurrentUser endpoint (/user) is not available on the backend
  // User data is returned in the login response and stored locally
  // Token validation happens automatically when making API calls (401 = invalid token)
};

export default apiClient;
