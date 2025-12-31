// Firebase Authentication Context
// Drop-in replacement for existing AuthContext with Firebase backend

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { storage } from '../utils/storage';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  createdAt?: string;
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
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const FirebaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to authentication state changes
  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not initialized');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const idToken = await firebaseUser.getIdToken();
          
          // Get user profile from Firestore
          let username = firebaseUser.displayName || '';
          
          if (db) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              username = userDoc.data()?.username || username;
            }
          }

          const userData: User = {
            id: firebaseUser.uid,
            username,
            email: firebaseUser.email || '',
            emailVerified: firebaseUser.emailVerified,
          };

          setUser(userData);
          setToken(idToken);
          setIsAuthenticated(true);

          // Save to local storage for persistence
          await storage.saveToken(idToken);
          await storage.saveUserData(userData);

          console.log('✅ User authenticated:', userData.email);
        } else {
          // User is signed out
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
          await storage.clearAll();
          console.log('👋 User signed out');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    // Auth state is automatically managed by onAuthStateChanged
    // This function exists for compatibility with the existing interface
    if (!auth?.currentUser) {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      setIsLoading(true);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: username,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username,
        email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_verified: false,
        settings: {
          currency: 'USD',
          notifications_enabled: true,
        },
      });

      // Send verification email (optional)
      try {
        await sendEmailVerification(firebaseUser);
        Alert.alert(
          'Success',
          'Account created! Please check your email for verification link.',
          [{ text: 'OK' }]
        );
      } catch (emailError) {
        console.warn('Could not send verification email:', emailError);
        Alert.alert('Success', 'Account created successfully!');
      }

      console.log('✅ User registered:', email);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }
      
      Alert.alert('Registration Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User logged in:', email);
      
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      Alert.alert('Login Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await signOut(auth);
      await storage.clearAll();
      console.log('👋 User logged out');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'Password reset link sent to your email. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      Alert.alert('Password Reset Error', errorMessage);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth?.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        'Verification Email Sent',
        'Please check your email for verification link.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Send verification error:', error);
      Alert.alert('Error', 'Failed to send verification email.');
      throw error;
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
    resetPassword,
    sendVerificationEmail,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export default FirebaseAuthContext;
