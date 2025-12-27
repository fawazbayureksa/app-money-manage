import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { authApi } from '../api/client';
import { storage } from '../utils/storage';

interface User {
  id?: string;
  username?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUserData();

      if (storedToken && storedUser) {
        // Restore auth state from storage
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        // Optionally verify token with backend (don't logout on failure)
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            const updatedUser = {
              id: response.data.id?.toString(),
              username: response.data.name,
              email: response.data.email,
            };
            setUser(updatedUser);
            await storage.saveUserData(updatedUser);
          }
        } catch (error) {
          // Just log the error, keep user logged in with stored data
          console.log('Could not verify token with backend, using stored data');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't logout on error, just keep current state
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);

      if (response.success && response.data?.token) {
        const { token: authToken, user: userData } = response.data;

        // Save token
        await storage.saveToken(authToken);
        setToken(authToken);

        // Save user data from response
        const userInfo = {
          id: userData.id?.toString(),
          username: userData.name,
          email: userData.email,
        };
        await storage.saveUserData(userInfo);
        setUser(userInfo);

        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      Alert.alert('Login Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(username, email, password);

      if (response.success && response.data) {
        // Registration successful - now auto-login
        Alert.alert('Success', 'Account created successfully! Logging you in...');
        
        // Automatically login after registration
        await login(email, password);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await storage.clearAll();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Call logout endpoint to invalidate token on backend
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
      }
      // Clear local storage and state
      await handleLogout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'An error occurred while logging out.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
