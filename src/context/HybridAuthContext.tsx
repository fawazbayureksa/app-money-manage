// Hybrid Authentication Context
// Switches between REST API and Firebase Auth based on feature flag
// This allows gradual migration without breaking existing functionality

import React, { ReactNode } from 'react';
import { FEATURE_FLAGS } from '../config/features';
import { AuthProvider as RestAuthProvider } from './AuthContext';
import { FirebaseAuthProvider } from './FirebaseAuthContext';

interface HybridAuthProviderProps {
  children: ReactNode;
}

export const HybridAuthProvider = ({ children }: HybridAuthProviderProps) => {
  if (FEATURE_FLAGS.useFirebaseAuth) {
    console.log('🔥 Using Firebase Authentication');
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  } else {
    console.log('🌐 Using REST API Authentication');
    return <RestAuthProvider>{children}</RestAuthProvider>;
  }
};

// Export the appropriate hook based on feature flag
export const useAuth = FEATURE_FLAGS.useFirebaseAuth
  ? require('./FirebaseAuthContext').useFirebaseAuth
  : require('./AuthContext').useAuth;

export default HybridAuthProvider;
