/**
 * Helper function to seed sample banks and categories
 * Called during app initialization if master data is missing
 */

import { bankRepository } from '../database/BankRepository';
import { categoryRepository } from '../database/CategoryRepository';

export const SAMPLE_BANKS = [
  { remote_id: 1, bank_name: 'Bank BCA', color: '#0066CC' },
  { remote_id: 2, bank_name: 'Bank Mandiri', color: '#FFB800' },
  { remote_id: 3, bank_name: 'Bank BNI', color: '#FF6600' },
  { remote_id: 4, bank_name: 'Bank BRI', color: '#003D79' },
  { remote_id: 5, bank_name: 'Bank CIMB Niaga', color: '#D32F2F' },
  { remote_id: 6, bank_name: 'GoPay', color: '#00AA13' },
  { remote_id: 7, bank_name: 'OVO', color: '#4C3494' },
  { remote_id: 8, bank_name: 'Dana', color: '#118EEA' },
  { remote_id: 9, bank_name: 'ShopeePay', color: '#EE4D2D' },
  { remote_id: 10, bank_name: 'Cash', color: '#4CAF50' },
];

export const SAMPLE_CATEGORIES = [
  { remote_id: 1, category_name: 'Food & Dining', type: 2 },
  { remote_id: 2, category_name: 'Transportation', type: 2 },
  { remote_id: 3, category_name: 'Shopping', type: 2 },
  { remote_id: 4, category_name: 'Entertainment', type: 2 },
  { remote_id: 5, category_name: 'Bills & Utilities', type: 2 },
  { remote_id: 6, category_name: 'Healthcare', type: 2 },
  { remote_id: 7, category_name: 'Education', type: 2 },
  { remote_id: 8, category_name: 'Salary', type: 1 },
  { remote_id: 9, category_name: 'Freelance', type: 1 },
  { remote_id: 10, category_name: 'Investment', type: 1 },
];

export async function seedMasterData(): Promise<void> {
  try {
    console.log('🌱 Seeding master data...');
    
    // Seed banks
    for (const bank of SAMPLE_BANKS) {
      await bankRepository.upsert({
        remote_id: bank.remote_id,
        bank_name: bank.bank_name,
        color: bank.color,
        image: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      });
    }
    console.log(`✅ Seeded ${SAMPLE_BANKS.length} banks`);
    
    // Seed categories
    for (const category of SAMPLE_CATEGORIES) {
      await categoryRepository.upsert({
        remote_id: category.remote_id,
        category_name: category.category_name,
        type: category.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      });
    }
    console.log(`✅ Seeded ${SAMPLE_CATEGORIES.length} categories`);
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}
