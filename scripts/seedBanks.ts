/**
 * Seed Script: Insert Sample Banks
 * Run this to populate local database with test bank data
 */

import { DatabaseManager } from '../src/database';
import { bankRepository } from '../src/database/BankRepository';

const SAMPLE_BANKS = [
  { remote_id: 1, bank_name: 'Bank BCA', color: '#0066CC', image: null },
  { remote_id: 2, bank_name: 'Bank Mandiri', color: '#FFB800', image: null },
  { remote_id: 3, bank_name: 'Bank BNI', color: '#FF6600', image: null },
  { remote_id: 4, bank_name: 'Bank BRI', color: '#003D79', image: null },
  { remote_id: 5, bank_name: 'Bank CIMB Niaga', color: '#D32F2F', image: null },
  { remote_id: 6, bank_name: 'Bank Danamon', color: '#00A651', image: null },
  { remote_id: 7, bank_name: 'Bank Permata', color: '#E53935', image: null },
  { remote_id: 8, bank_name: 'Bank BTPN', color: '#673AB7', image: null },
  { remote_id: 9, bank_name: 'Bank Syariah Indonesia', color: '#4CAF50', image: null },
  { remote_id: 10, bank_name: 'Bank Mega', color: '#FF5722', image: null },
  { remote_id: 11, bank_name: 'Bank OCBC NISP', color: '#D32F2F', image: null },
  { remote_id: 12, bank_name: 'Bank Panin', color: '#1976D2', image: null },
  { remote_id: 13, bank_name: 'Bank UOB', color: '#0D47A1', image: null },
  { remote_id: 14, bank_name: 'Bank HSBC', color: '#C62828', image: null },
  { remote_id: 15, bank_name: 'GoPay', color: '#00AA13', image: null },
  { remote_id: 16, bank_name: 'OVO', color: '#4C3494', image: null },
  { remote_id: 17, bank_name: 'Dana', color: '#118EEA', image: null },
  { remote_id: 18, bank_name: 'ShopeePay', color: '#EE4D2D', image: null },
  { remote_id: 19, bank_name: 'LinkAja', color: '#FF0000', image: null },
  { remote_id: 20, bank_name: 'Cash', color: '#4CAF50', image: null },
];

async function seedBanks() {
  try {
    console.log('🌱 Starting bank seed...');
    
    // Initialize database
    const db = await DatabaseManager.getInstance().getDatabase();
    console.log('✅ Database connected');

    // Insert banks
    let successCount = 0;
    for (const bankData of SAMPLE_BANKS) {
      try {
        await bankRepository.upsert({
          remote_id: bankData.remote_id,
          bank_name: bankData.bank_name,
          color: bankData.color,
          image: bankData.image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
        });
        console.log(`  ✓ ${bankData.bank_name}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed to insert ${bankData.bank_name}:`, error);
      }
    }

    console.log(`\n✅ Seed completed: ${successCount}/${SAMPLE_BANKS.length} banks inserted`);
    
    // Verify
    const allBanks = await bankRepository.findAll();
    console.log(`📊 Total banks in database: ${allBanks.length}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedBanks()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
