// Firebase Category Service
// Firestore implementation for category management

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface FirebaseCategory {
  id: string;
  userId: string;
  name: string;
  description: string;
  iconName?: string;
  color?: string;
  isDefault: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CategoryData {
  categoryName: string;
  description?: string;
  iconName?: string;
  color?: string;
}

// Convert Firestore category to API format for compatibility
const convertToAPIFormat = (firebaseCategory: FirebaseCategory) => {
  return {
    ID: parseInt(firebaseCategory.id) || 0, // For compatibility
    CategoryName: firebaseCategory.name,
    Description: firebaseCategory.description,
    UserID: 0, // Not exposed
    CreatedAt: firebaseCategory.created_at?.toDate().toISOString() || new Date().toISOString(),
    UpdatedAt: firebaseCategory.updated_at?.toDate().toISOString(),
  };
};

export const firebaseCategoryService = {
  // Get all categories for the authenticated user
  getCategories: async () => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const categoriesRef = collection(db, 'categories');
      
      // Query for user's categories or default categories
      const q = query(
        categoriesRef,
        where('userId', '==', userId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      const categories: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<FirebaseCategory, 'id'>;
        const category = { id: doc.id, ...data } as FirebaseCategory;
        categories.push(convertToAPIFormat(category));
      });

      return {
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Get categories with real-time updates
  subscribeToCategories: (
    onUpdate: (categories: any[]) => void,
    onError: (error: Error) => void
  ): (() => void) => {
    if (!db || !auth?.currentUser) {
      onError(new Error('Firebase not initialized or user not authenticated'));
      return () => {};
    }

    const userId = auth.currentUser.uid;
    const categoriesRef = collection(db, 'categories');
    
    const q = query(
      categoriesRef,
      where('userId', '==', userId),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const categories: any[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<FirebaseCategory, 'id'>;
          const category = { id: doc.id, ...data } as FirebaseCategory;
          categories.push(convertToAPIFormat(category));
        });

        onUpdate(categories);
      },
      (error) => {
        console.error('Error in categories subscription:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  },

  // Create a new category
  createCategory: async (categoryData: CategoryData) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const categoriesRef = collection(db, 'categories');

      const newCategory = {
        userId,
        name: categoryData.categoryName,
        description: categoryData.description || '',
        iconName: categoryData.iconName,
        color: categoryData.color,
        isDefault: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(categoriesRef, newCategory);

      const createdCategory = {
        id: docRef.id,
        ...newCategory,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      } as FirebaseCategory;

      return {
        success: true,
        message: 'Category created successfully',
        data: convertToAPIFormat(createdCategory),
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update a category
  updateCategory: async (categoryId: string, categoryData: CategoryData) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const categoryRef = doc(db, 'categories', categoryId);

      // Verify ownership
      const categoryDoc = await getDoc(categoryRef);
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      const categoryInfo = categoryDoc.data() as Omit<FirebaseCategory, 'id'>;
      if (categoryInfo.userId !== userId) {
        throw new Error('Unauthorized');
      }

      const updates = {
        name: categoryData.categoryName,
        description: categoryData.description || '',
        iconName: categoryData.iconName,
        color: categoryData.color,
        updated_at: serverTimestamp(),
      };

      await updateDoc(categoryRef, updates);

      const updatedCategory = {
        id: categoryId,
        ...categoryInfo,
        ...updates,
        updated_at: Timestamp.now(),
      } as FirebaseCategory;

      return {
        success: true,
        message: 'Category updated successfully',
        data: convertToAPIFormat(updatedCategory),
      };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete a category
  deleteCategory: async (categoryId: string) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const categoryRef = doc(db, 'categories', categoryId);

      // Verify ownership
      const categoryDoc = await getDoc(categoryRef);
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      const categoryData = categoryDoc.data() as Omit<FirebaseCategory, 'id'>;
      if (categoryData.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (categoryData.isDefault) {
        throw new Error('Cannot delete default categories');
      }

      await deleteDoc(categoryRef);

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Get a single category by ID
  getCategory: async (categoryId: string) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const categoryRef = doc(db, 'categories', categoryId);
      const categoryDoc = await getDoc(categoryRef);

      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      const categoryData = categoryDoc.data() as Omit<FirebaseCategory, 'id'>;
      if (categoryData.userId !== userId && !categoryData.isDefault) {
        throw new Error('Unauthorized');
      }

      const category = {
        id: categoryDoc.id,
        ...categoryData,
      } as FirebaseCategory;

      return {
        success: true,
        message: 'Category retrieved successfully',
        data: convertToAPIFormat(category),
      };
    } catch (error) {
      console.error('Error getting category:', error);
      throw error;
    }
  },
};

export default firebaseCategoryService;
