/**
 * Simplified Auth Context for Offline-First Architecture
 * Single-device model with optional backend registration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import uuid from 'react-native-uuid';
import { dbManager } from '../database';
import { syncService } from '../services/syncService';
import { seedMasterData } from '../utils/seedData';

const DEVICE_ID_KEY = '@device_id';
const INITIAL_SETUP_KEY = '@initial_setup_done';
const USER_DATA_KEY = '@user_data';

interface DeviceInfo {
  deviceId: string;
  createdAt: string;
  lastActiveAt: string;
}

interface UserData {
  name?: string;
  email?: string;
}

interface OfflineAuthContextType {
  isInitialized: boolean;
  isLoading: boolean;
  deviceId: string | null;
  userData: UserData | null;
  setupComplete: boolean;
  
  // Initialization
  initialize: () => Promise<void>;
  
  // Optional user data (for future sync)
  updateUserData: (data: UserData) => Promise<void>;
  clearUserData: () => Promise<void>;
  
  // Database stats
  getDatabaseStats: () => Promise<any>;
  
  // Sync
  syncMasterData: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineAuthContext = createContext<OfflineAuthContextType | undefined>(undefined);

export const OfflineAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  /**
   * Initialize the app
   * - Generate device ID
   * - Initialize database
   * - Sync master data
   */
  const initialize = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Initializing offline-first app...');

      // Step 1: Get or create device ID
      let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!storedDeviceId) {
        storedDeviceId = uuid.v4() as string;
        await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
        await AsyncStorage.setItem(
          '@device_info',
          JSON.stringify({
            deviceId: storedDeviceId,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          } as DeviceInfo)
        );
        console.log('📱 Generated new device ID:', storedDeviceId);
      } else {
        // Update last active time
        const deviceInfo = await AsyncStorage.getItem('@device_info');
        if (deviceInfo) {
          const parsed = JSON.parse(deviceInfo);
          parsed.lastActiveAt = new Date().toISOString();
          await AsyncStorage.setItem('@device_info', JSON.stringify(parsed));
        }
        console.log('📱 Using existing device ID:', storedDeviceId);
      }
      setDeviceId(storedDeviceId);

      // Step 2: Initialize database
      console.log('🗄️  Initializing database...');
      await dbManager.getDatabase();
      console.log('✅ Database initialized');

      // Step 3: Load user data (if any)
      const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
        console.log('👤 User data loaded');
      }

      // Step 4: Check if initial setup is done
      const setupDone = await AsyncStorage.getItem(INITIAL_SETUP_KEY);
      
      if (!setupDone) {
        console.log('🔄 First launch detected, performing initial sync...');
        await performInitialSync();
        await AsyncStorage.setItem(INITIAL_SETUP_KEY, 'true');
        setSetupComplete(true);
      } else {
        setSetupComplete(true);
        // Perform incremental sync in background
        performBackgroundSync();
      }

      setIsInitialized(true);
      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      // Don't throw - allow app to continue with local data
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Perform initial sync (blocking)
   */
  const performInitialSync = async () => {
    try {
      setIsSyncing(true);
      const results = await syncService.syncAll();
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Initial sync: ${successCount}/${results.length} entities synced`);
      
      if (successCount === 0) {
        console.warn('⚠️  Sync failed, using local seed data...');
        // If sync fails (offline), seed with sample data
        await seedMasterData();
        console.log('✅ Sample data seeded successfully');
      }
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      console.log('⚠️  Sync error, using local seed data...');
      try {
        await seedMasterData();
        console.log('✅ Sample data seeded successfully');
      } catch (seedError) {
        console.error('❌ Failed to seed data:', seedError);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Perform background sync (non-blocking)
   */
  const performBackgroundSync = async () => {
    try {
      setIsSyncing(true);
      const needsSync = await syncService.needsInitialSync();
      
      if (needsSync) {
        console.log('📥 Master data missing, performing sync...');
        await syncService.syncAll();
      } else {
        console.log('🔄 Performing incremental sync...');
        await syncService.syncAll();
      }
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      // Silent failure - app continues with cached data
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Manual sync trigger
   */
  const syncMasterData = async () => {
    try {
      setIsSyncing(true);
      console.log('🔄 Manual sync triggered');
      await syncService.syncAll();
      console.log('✅ Manual sync complete');
    } catch (error) {
      // Silently handle - network errors expected in offline-first
      throw error; // Re-throw for manual sync so UI can show error
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Update user data (optional, for future sync)
   */
  const updateUserData = async (data: UserData) => {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
      setUserData(data);
      console.log('✅ User data updated');
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      throw error;
    }
  };

  /**
   * Clear user data
   */
  const clearUserData = async () => {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
      setUserData(null);
      console.log('✅ User data cleared');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      throw error;
    }
  };

  /**
   * Get database statistics
   */
  const getDatabaseStats = async () => {
    return await dbManager.getStats();
  };

  const value: OfflineAuthContextType = {
    isInitialized,
    isLoading,
    deviceId,
    userData,
    setupComplete,
    initialize,
    updateUserData,
    clearUserData,
    getDatabaseStats,
    syncMasterData,
    isSyncing,
  };

  return (
    <OfflineAuthContext.Provider value={value}>
      {children}
    </OfflineAuthContext.Provider>
  );
};

/**
 * Hook to use offline auth context
 */
export const useOfflineAuth = () => {
  const context = useContext(OfflineAuthContext);
  if (context === undefined) {
    throw new Error('useOfflineAuth must be used within OfflineAuthProvider');
  }
  return context;
};

// Export for backward compatibility (if needed)
export const AuthContext = OfflineAuthContext;
export const AuthProvider = OfflineAuthProvider;
export const useAuth = useOfflineAuth;
