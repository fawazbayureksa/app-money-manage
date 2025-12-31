// Feature Flags Configuration
// Control which services use Firebase vs REST API during migration

import Constants from 'expo-constants';

export interface FeatureFlags {
  useFirebaseAuth: boolean;
  useFirebaseCategories: boolean;
  useFirebaseTransactions: boolean;
  useFirebaseBudgets: boolean;
  useFirebaseAlerts: boolean;
  useFirebaseBanks: boolean;
}

// Read feature flags from app.json extra.features
const features = Constants.expoConfig?.extra?.features || {};

export const FEATURE_FLAGS: FeatureFlags = {
  // Phase 1: Authentication
  useFirebaseAuth: features.useFirebaseAuth ?? false,
  
  // Phase 2: Categories
  useFirebaseCategories: features.useFirebaseCategories ?? false,
  
  // Phase 3: Transactions
  useFirebaseTransactions: features.useFirebaseTransactions ?? false,
  
  // Phase 4: Budgets
  useFirebaseBudgets: features.useFirebaseBudgets ?? false,
  
  // Phase 4: Alerts
  useFirebaseAlerts: features.useFirebaseAlerts ?? false,
  
  // Phase 5: Banks
  useFirebaseBanks: features.useFirebaseBanks ?? false,
};

// Helper to check if all Firebase features are enabled
export const isFullyMigrated = (): boolean => {
  return Object.values(FEATURE_FLAGS).every(flag => flag === true);
};

// Helper to log current feature flag status
export const logFeatureFlags = () => {
  console.log('🎛️ Feature Flags Status:');
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    const emoji = value ? '✅' : '⏸️';
    console.log(`  ${emoji} ${key}: ${value}`);
  });
};

// Call on app start
if (__DEV__) {
  logFeatureFlags();
}

export default FEATURE_FLAGS;
