import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SectionList,
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
import { Bank, bankService } from '../../api/bankService';
import { Transaction, transactionService } from '../../api/transactionService';
import { formatCurrency, formatDateRelative } from '../../utils/formatters';
import { groupTransactionsByDate, TransactionSection } from '../../utils/transactionUtils';

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

  // Derived sections
  const sections = React.useMemo(() => groupTransactionsByDate(transactions), [transactions]);

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
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardRow}>
            <View style={styles.leftContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE' },
                ]}
              >
                <IconButton
                  icon={item.category_name ? 'tag' : 'cash'}
                  iconColor={typeColor}
                  size={24}
                  style={{ margin: 0 }}
                />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.categoryText}>
                  {item.category_name || 'Uncategorized'}
                </Text>
                {item.description ? (
                  <Text variant="bodySmall" numberOfLines={1} style={styles.descriptionText}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.metaContainer}>
                  {item.bank_name && (
                    <Text variant="labelSmall" style={styles.bankText}>
                      {item.bank_name}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.rightContent}>
              <Text variant="titleMedium" style={{ color: typeColor, fontWeight: 'bold' }}>
                {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
              </Text>
              <IconButton
                icon="delete-outline"
                iconColor={theme.colors.error}
                size={20}
                onPress={() => handleDelete(item)}
                style={{ margin: 0, alignSelf: 'flex-end' }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSectionHeader = ({ section: { title, summary } }: { section: TransactionSection }) => (
    <View style={styles.sectionHeader}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        {formatDateRelative(title)}
      </Text>
      <View style={styles.sectionSummary}>
        {summary.income > 0 && (
          <Text style={[styles.summaryText, { color: '#4CAF50' }]}>
            +{formatCurrency(summary.income)}
          </Text>
        )}
        {summary.expense > 0 && (
          <Text style={[styles.summaryText, { color: '#F44336', marginLeft: 8 }]}>
            -{formatCurrency(summary.expense)}
          </Text>
        )}
      </View>
    </View>
  );

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
      <SectionList
        sections={sections}
        renderItem={renderTransactionItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id.toString()}
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
        stickySectionHeadersEnabled={false}
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
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  categoryText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  descriptionText: {
    color: '#666',
    marginBottom: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankText: {
    color: '#999',
    fontSize: 10,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: 'bold',
    opacity: 0.6,
  },
  sectionSummary: {
    flexDirection: 'row',
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
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
