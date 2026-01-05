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
import { formatCurrency, formatDateShort } from '../../utils/formatters';

export default function TransactionListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');

  // Sync param with filterType
  React.useEffect(() => {
    if (params.type && (params.type === 'Income' || params.type === 'Expense')) {
      setFilterType(params.type);
    }
  }, [params.type]);

  // Fetch transactions
  const fetchTransactions = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      // Use current filterType state
      const queryParams = filterType !== 'All' ? { transaction_type: filterType } : {};
      const response = await transactionService.getTransactions(queryParams);

      console.log('Transactions Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('Transactions data:', JSON.stringify(response.data, null, 2));
        setTransactions(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load transactions';
      setSnackbarMessage(errorMessage);
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

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(false);
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
                fetchTransactions(false);
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
        onPress={() => setFilterType('All')}
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderFilters()}

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
});
