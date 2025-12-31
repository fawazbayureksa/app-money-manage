// Firebase Transaction Service
// Firestore implementation for transaction management with real-time updates

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface FirebaseTransaction {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  bankId: string;
  bankName: string;
  amount: number;
  type: 'income' | 'expense';
  date: Timestamp;
  description: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TransactionData {
  BankID: number;
  CategoryID: number;
  Amount: number;
  Description: string;
  Date: string;
  TransactionType: 'Income' | 'Expense';
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: 'Income' | 'Expense';
}

// Convert Firestore transaction to API format
const convertToAPIFormat = (firebaseTransaction: FirebaseTransaction) => {
  return {
    id: parseInt(firebaseTransaction.id.slice(-8), 16) || 0, // Hash ID to number
    description: firebaseTransaction.description,
    amount: firebaseTransaction.amount,
    transaction_type: firebaseTransaction.type === 'income' ? 1 : 2,
    date: firebaseTransaction.date?.toDate().toISOString().split('T')[0] || '',
    category_name: firebaseTransaction.categoryName,
    bank_name: firebaseTransaction.bankName,
  };
};

export const firebaseTransactionService = {
  // Get transactions with filtering and pagination
  getTransactions: async (params?: TransactionListParams) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const transactionsRef = collection(db, 'transactions');
      
      let q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      // Apply filters
      if (params?.transaction_type) {
        const type = params.transaction_type.toLowerCase() as 'income' | 'expense';
        q = query(q, where('type', '==', type));
      }

      // Apply pagination
      const pageSize = params?.page_size || 50;
      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const transactions: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<FirebaseTransaction, 'id'>;
        const transaction = { id: doc.id, ...data } as FirebaseTransaction;
        
        // Apply date filter in memory (Firestore doesn't support range + inequality)
        const transactionDate = transaction.date.toDate();
        if (params?.start_date && transactionDate < new Date(params.start_date)) {
          return;
        }
        if (params?.end_date && transactionDate > new Date(params.end_date)) {
          return;
        }
        
        transactions.push(convertToAPIFormat(transaction));
      });

      return {
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
      };
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // Subscribe to real-time transaction updates
  subscribeToTransactions: (
    onUpdate: (transactions: any[]) => void,
    onError: (error: Error) => void,
    filters?: TransactionListParams
  ): (() => void) => {
    if (!db || !auth?.currentUser) {
      onError(new Error('Firebase not initialized or user not authenticated'));
      return () => {};
    }

    const userId = auth.currentUser.uid;
    const transactionsRef = collection(db, 'transactions');
    
    let q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(filters?.page_size || 50)
    );

    if (filters?.transaction_type) {
      const type = filters.transaction_type.toLowerCase() as 'income' | 'expense';
      q = query(q, where('type', '==', type));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactions: any[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<FirebaseTransaction, 'id'>;
          const transaction = { id: doc.id, ...data } as FirebaseTransaction;
          transactions.push(convertToAPIFormat(transaction));
        });

        onUpdate(transactions);
      },
      (error) => {
        console.error('Error in transactions subscription:', error);
        onError(error as Error);
      }
    );

    return unsubscribe;
  },

  // Create a new transaction
  createTransaction: async (transactionData: TransactionData) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const transactionsRef = collection(db, 'transactions');

      // Get category and bank names (denormalization)
      const categoryRef = doc(db, 'categories', transactionData.CategoryID.toString());
      const bankRef = doc(db, 'banks', transactionData.BankID.toString());
      
      const [categoryDoc, bankDoc] = await Promise.all([
        getDoc(categoryRef),
        getDoc(bankRef),
      ]);

      const categoryName = categoryDoc.exists() ? categoryDoc.data().name : 'Unknown';
      const bankName = bankDoc.exists() ? bankDoc.data().name : 'Unknown';

      const newTransaction = {
        userId,
        categoryId: transactionData.CategoryID.toString(),
        categoryName,
        bankId: transactionData.BankID.toString(),
        bankName,
        amount: transactionData.Amount,
        type: transactionData.TransactionType.toLowerCase() as 'income' | 'expense',
        date: Timestamp.fromDate(new Date(transactionData.Date)),
        description: transactionData.Description,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = await addDoc(transactionsRef, newTransaction);

      const createdTransaction = {
        id: docRef.id,
        ...newTransaction,
        date: Timestamp.fromDate(new Date(transactionData.Date)),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      } as FirebaseTransaction;

      return {
        success: true,
        message: 'Transaction created successfully',
        data: convertToAPIFormat(createdTransaction),
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Get a single transaction by ID
  getTransaction: async (transactionId: string) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data() as Omit<FirebaseTransaction, 'id'>;
      if (transactionData.userId !== userId) {
        throw new Error('Unauthorized');
      }

      const transaction = {
        id: transactionDoc.id,
        ...transactionData,
      } as FirebaseTransaction;

      return {
        success: true,
        message: 'Transaction retrieved successfully',
        data: convertToAPIFormat(transaction),
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  },

  // Delete a transaction
  deleteTransaction: async (transactionId: string) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const transactionRef = doc(db, 'transactions', transactionId);

      // Verify ownership
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data() as Omit<FirebaseTransaction, 'id'>;
      if (transactionData.userId !== userId) {
        throw new Error('Unauthorized');
      }

      await deleteDoc(transactionRef);

      return {
        success: true,
        message: 'Transaction deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Get transaction statistics
  getTransactionStats: async (startDate?: string, endDate?: string) => {
    if (!db || !auth?.currentUser) {
      throw new Error('Firebase not initialized or user not authenticated');
    }

    try {
      const userId = auth.currentUser.uid;
      const transactionsRef = collection(db, 'transactions');
      
      const q = query(
        transactionsRef,
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      
      let totalIncome = 0;
      let totalExpense = 0;
      let transactionCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<FirebaseTransaction, 'id'>;
        const transactionDate = data.date.toDate();
        
        // Apply date filters
        if (startDate && transactionDate < new Date(startDate)) return;
        if (endDate && transactionDate > new Date(endDate)) return;
        
        transactionCount++;
        if (data.type === 'income') {
          totalIncome += data.amount;
        } else {
          totalExpense += data.amount;
        }
      });

      return {
        success: true,
        data: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount,
        },
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  },
};

export default firebaseTransactionService;
