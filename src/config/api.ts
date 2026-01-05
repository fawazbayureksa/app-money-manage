/**
 * API Configuration
 * Uses environment variables injected during EAS build
 * Falls back to development defaults if not set
 */
import Constants from 'expo-constants';

// Get API URL from multiple sources (priority order):
// 1. Expo Constants (from app.config.js extra field) - set during EAS build
// 2. Environment variable EXPO_PUBLIC_API_URL - available at build time
// 3. Hardcoded fallback for local development
const getApiUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // Backend routes: /api/login, /api/register, /api/transactions, etc.
  const fallbackUrl = 'http://34.158.34.129:8080/api';

  const apiUrl = configUrl || envUrl || fallbackUrl;

  // Log the API URL being used (helpful for debugging APK issues)
  console.log('🌐 API Configuration Loaded:');
  console.log('  - Build Profile:', Constants.expoConfig?.extra?.buildProfile || 'local');
  console.log('  - API Base URL:', apiUrl);
  console.log('  - Source:', configUrl ? 'app.config.js' : envUrl ? 'env var' : 'fallback');

  return apiUrl;
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 10000, // 10 seconds
};

// Runtime validation
if (API_CONFIG.BASE_URL.includes('localhost') || API_CONFIG.BASE_URL.includes('127.0.0.1')) {
  console.error('⚠️  WARNING: API URL contains localhost/127.0.0.1');
  console.error('⚠️  This will NOT work on physical devices or in built APKs');
  console.error('⚠️  Update EXPO_PUBLIC_API_URL in eas.json to use a publicly accessible URL');
}

// Validate URL format
try {
  new URL(API_CONFIG.BASE_URL);
} catch (error) {
  console.error('❌ Invalid API URL format:', API_CONFIG.BASE_URL);
}

export default API_CONFIG;
