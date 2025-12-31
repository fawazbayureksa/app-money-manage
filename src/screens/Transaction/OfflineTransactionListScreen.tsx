/**
 * Example: Updated Transaction List Screen using Offline-First Architecture
 * This demonstrates how to update existing screens to use local repositories
 */

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Card,
    Chip,
    FAB,
    IconButton,
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';
import { useOfflineAuth } from '../../context/OfflineAuthContext';
import { Transaction, TransactionFilter, transactionRepository } from '../../database/TransactionRepository';
import { syncService } from '../../services/syncService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

export default function OfflineTransactionListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isSyncing } = useOfflineAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterType, setFilterType] = useState<'All' | 1 | 2>('All');
  const [stats, setStats] = useState({ total_income: 0, total_expense: 0, net_amount: 0, count: 0 });

  // Fetch transactions from local database
  const fetchTransactions = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      // Build filter
      const filter: TransactionFilter = {};
      if (filterType !== 'All') {
        filter.transactionType = filterType;
      }

      // Get transactions from local database
      const data = await transactionRepository.findWithFilters(filter);
      setTransactions(data);

      // Get statistics
      const statsData = await transactionRepository.getStats();
      setStats(statsData);

      console.log(`✅ Loaded ${data.length} transactions from local database`);
    } catch (error: any) {
      console.error('❌ Error fetching transactions:', error);
      setSnackbarMessage('Failed to load transactions');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [filterType])
  );

  // Handle pull to refresh (triggers master data sync + local reload)
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Sync master data in background
      await syncService.syncAll();
    } catch (error) {
      console.log('⚠️  Sync failed during refresh, continuing with local data');
    }
    
    // Reload local data
    await fetchTransactions(false);
  };

  // Handle delete transaction (local only)
  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this transaction?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from local database (soft delete)
              const success = await transactionRepository.delete(transaction.local_id);
              
              if (success) {
                setSnackbarMessage('Transaction deleted successfully');
                setSnackbarVisible(true);
                fetchTransactions(false);
              } else {
                throw new Error('Failed to delete transaction');
              }
            } catch (error: any) {
              console.error('❌ Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  // Navigate to add transaction screen
  const handleAddTransaction = () => {
    router.push('/transactions/add' as any);
  };

  // Filter chips
  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filterType === 'All'}
        onPress={() => setFilterType('All')}
        style={styles.chip}
      >
        All
      </Chip>
      <Chip
        selected={filterType === 1}
        onPress={() => setFilterType(1)}
        style={styles.chip}
      >
        Income
      </Chip>
      <Chip
        selected={filterType === 2}
        onPress={() => setFilterType(2)}
        style={styles.chip}
      >
        Expense
      </Chip>
    </View>
  );

  // Render statistics card
  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Income</Text>
            <Text variant="titleMedium" style={[styles.statValue, { color: '#4CAF50' }]}>
              {formatCurrency(stats.total_income)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Expense</Text>
            <Text variant="titleMedium" style={[styles.statValue, { color: '#F44336' }]}>
              {formatCurrency(stats.total_expense)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Balance</Text>
            <Text variant="titleMedium" style={[
              styles.statValue, 
              { color: stats.net_amount >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {formatCurrency(Math.abs(stats.net_amount))}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.transaction_type === 1;
    const typeColor = isIncome ? '#4CAF50' : '#F44336';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.typeIndicator}>
              <View
                style={[
                  styles.typeIcon,
                  { backgroundColor: typeColor + '20' },
                ]}
              >
                <IconButton
                  icon={isIncome ? 'arrow-up' : 'arrow-down'}
                  iconColor={typeColor}
                  size={20}
                />
              </View>
              <View style={styles.mainInfo}>
                <Text variant="titleMedium" style={[styles.amount, { color: typeColor }]}>
                  {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                </Text>
                <Text variant="bodyMedium" style={styles.category}>
                  {item.category_name || 'No Category'}
                </Text>
              </View>
            </View>
            <IconButton
              icon="delete"
              iconColor={theme.colors.error}
              size={20}
              onPress={() => handleDelete(item)}
            />
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <IconButton icon="text" size={16} />
              <Text variant="bodySmall">{item.description}</Text>
            </View>
            <View style={styles.detailRow}>
              <IconButton icon="bank" size={16} />
              <Text variant="bodySmall">{item.bank_name || 'No Bank'}</Text>
            </View>
            <View style={styles.detailRow}>
              <IconButton icon="calendar" size={16} />
              <Text variant="bodySmall">{formatDateShort(item.date)}</Text>
            </View>
          </View>

          {/* Offline indicator */}
          {item.sync_status === 'local' && (
            <View style={styles.offlineIndicator}>
              <Chip icon="cloud-off-outline" compact>
                Local Only
              </Chip>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="receipt-text-outline" size={64} />
      <Text variant="titleMedium" style={styles.emptyText}>
        No transactions yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtext}>
        Tap the + button to add your first transaction
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sync indicator */}
      {isSyncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={styles.syncText}>Syncing...</Text>
        </View>
      )}

      {renderFilterChips()}
      {renderStats()}

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.local_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddTransaction}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#2196F3',
  },
  syncText: {
    color: '#fff',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    borderRadius: 8,
    marginRight: 12,
  },
  mainInfo: {
    flex: 1,
  },
  amount: {
    fontWeight: 'bold',
  },
  category: {
    opacity: 0.7,
  },
  cardDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineIndicator: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
