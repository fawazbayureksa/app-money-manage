import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { Transaction, transactionService } from '../../api/transactionService';
import { Bank, bankService } from '../../api/bankService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

export default function TransactionListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
    bank_id?: string;
  }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [banks, setBanks] = useState<Bank[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  // Sync param with filterType
  React.useEffect(() => {
    if (params.type && (params.type === 'Income' || params.type === 'Expense')) {
      setFilterType(params.type);
    }
  }, [params.type]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [filterType, params.category_id, params.start_date, params.end_date, params.bank_id]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (pageNum === 1 && !shouldRefresh) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      // Use current filterType state
      // Use current filterType state
      const queryParams: any = filterType !== 'All' ? { transaction_type: filterType } : {};

      // Page params
      queryParams.page = pageNum;
      queryParams.page_size = PAGE_SIZE;

      // Add other filters from params if they exist
      if (params.category_id) queryParams.category_id = parseInt(params.category_id);
      if (params.bank_id) queryParams.bank_id = parseInt(params.bank_id);
      if (params.start_date) queryParams.start_date = params.start_date;
      if (params.end_date) queryParams.end_date = params.end_date;

      const response = await transactionService.getTransactions(queryParams);

      if (response.success && response.data) {
        const newData = response.data;

        if (pageNum === 1) {
          setTransactions(newData);
        } else {
          setTransactions(prev => [...prev, ...newData]);
        }

        // Check if we have more data
        setHasMore(newData.length >= PAGE_SIZE);
        setPage(pageNum);
      } else {
        if (pageNum === 1) setTransactions([]);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load transactions';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
      if (pageNum === 1) setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filterType, params.category_id, params.start_date, params.end_date]);

  // Load transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1);
      fetchBanks();
    }, [fetchTransactions])
  );

  const fetchBanks = async () => {
    try {
      const response = await bankService.getBanks();
      if (response.success && response.data) {
        setBanks(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, true);
  };

  // Handle load more
  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchTransactions(page + 1);
    }
  };

  // Handle delete transaction
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
              const response = await transactionService.deleteTransaction(transaction.id);
              if (response.success) {
                setSnackbarMessage('Transaction deleted successfully');
                setSnackbarVisible(true);
                fetchTransactions(1, false);
              }
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              const errorMessage =
                error.response?.data?.message || 'Failed to delete transaction';
              Alert.alert('Error', errorMessage);
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
            {item.bank_name && (
              <Chip icon="bank" compact style={styles.chip}>
                {item.bank_name}
              </Chip>
            )}
            <Chip icon="calendar" compact style={styles.chip}>
              {formatDateShort(item.date)}
            </Chip>
          </View>

          {item.description && (
            <Text variant="bodySmall" style={styles.description}>
              {item.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="receipt-text-outline"
        size={80}
        iconColor={theme.colors.outline}
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Transactions Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Start tracking your income and expenses
      </Text>
    </View>
  );

  // Render filter chips
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filterType === 'All'}
        onPress={() => {
          setFilterType('All');
          router.setParams({
            category_id: undefined,
            bank_id: undefined,
            start_date: undefined,
            end_date: undefined
          });
        }}
        style={styles.filterChip}
      >
        All
      </Chip>
      <Chip
        selected={filterType === 'Income'}
        onPress={() => setFilterType('Income')}
        style={[styles.filterChip, filterType === 'Income' && styles.incomeChip]}
        textStyle={filterType === 'Income' && styles.incomeChipText}
      >
        Income
      </Chip>
      <Chip
        selected={filterType === 'Expense'}
        onPress={() => setFilterType('Expense')}
        style={[styles.filterChip, filterType === 'Expense' && styles.expenseChip]}
        textStyle={filterType === 'Expense' && styles.expenseChipText}
      >
        Expense
      </Chip>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderActiveFilters = () => {
    const hasActiveFilter = params.category_id || params.bank_id || params.start_date || params.end_date;
    if (!hasActiveFilter) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <Text variant="labelSmall" style={styles.activeFilterLabel}>Active Filters:</Text>
        {params.category_id && (
          <Chip icon="tag" onClose={() => router.setParams({ category_id: undefined })} compact mode="flat">
            Category #{params.category_id}
          </Chip>
        )}
        {params.bank_id && (
          <Chip icon="bank" onClose={() => router.setParams({ bank_id: undefined })} compact mode="flat">
            {banks.find(b => b.id === parseInt(params.bank_id!))?.bank_name || `Bank #${params.bank_id}`}
          </Chip>
        )}
        {params.start_date && params.end_date && (
          <Chip icon="calendar" onClose={() => router.setParams({ start_date: undefined, end_date: undefined })} compact mode="flat">
            {params.start_date} - {params.end_date}
          </Chip>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderFilters()}
      {renderActiveFilters()}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item, index) => item?.id?.toString() || `transaction-${index}`}
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={handleAddTransaction}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  activeFilterLabel: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  incomeChip: {
    backgroundColor: '#4CAF50',
  },
  incomeChipText: {
    color: '#FFFFFF',
  },
  expenseChip: {
    backgroundColor: '#F44336',
  },
  expenseChipText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 18,
  },
  category: {
    marginTop: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    marginRight: 4,
  },
  description: {
    marginTop: 8,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 300,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200EA',
    elevation: 8,
    shadowColor: '#6200EA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
