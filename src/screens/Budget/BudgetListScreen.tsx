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
  FAB,
  IconButton,
  ProgressBar,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { Budget, budgetService } from '../../api/budgetService';

export default function BudgetListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch budgets with status
  const fetchBudgets = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await budgetService.getBudgets();

      console.log('Budgets Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('Budgets data:', JSON.stringify(response.data, null, 2));
        // Extract the budgets array from the nested data structure
        const budgetsArray = response?.data?.data;
        setBudgets(Array.isArray(budgetsArray) ? budgetsArray : []);
      }
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load budgets';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets(false);
    setRefreshing(false);
  };

  const handleDelete = (budgetId: number) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await budgetService.deleteBudget(budgetId);
              if (response.success) {
                setSnackbarMessage('Budget deleted successfully');
                setSnackbarVisible(true);
                fetchBudgets();
              }
            } catch (error: any) {
              console.error('Error deleting budget:', error);
              const errorMessage =
                error.response?.data?.message || 'Failed to delete budget';
              setSnackbarMessage(errorMessage);
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'safe':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'exceeded':
        return '#F44336';
      default:
        return theme.colors.onSurface;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'safe':
        return 'check-circle';
      case 'warning':
        return 'alert';
      case 'exceeded':
        return 'alert-circle';
      default:
        return 'information';
    }
  };

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const statusColor = getStatusColor(item.status || 'safe');
    const remaining = item.remaining_amount || 0;
    const percentageUsed = item.percentage_used || 0;

    return (
      <Card
        style={styles.card}
        mode="elevated"
        onPress={() => handleBudgetPress(item)}
      >
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.categoryInfo}>
                <IconButton
                  icon={getStatusIcon(item.status || 'safe')}
                  iconColor={statusColor}
                  size={24}
                  style={{ margin: 0 }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                    {item.category_name || 'No Category'}
                  </Text>
                  <Text variant="bodySmall" style={styles.periodText}>
                    {item.period === 'monthly' ? 'Monthly' : 'Yearly'} Budget
                  </Text>
                </View>
              </View>
            </View>

            <IconButton
              icon="delete"
              iconColor={theme.colors.error}
              onPress={() => handleDelete(item.id)}
              style={{ margin: 0 }}
            />
          </View>

          {/* Amounts */}
          <View style={styles.amountsContainer}>
            <View style={styles.amountItem}>
              <Text variant="bodySmall" style={styles.amountLabel}>
                Budget
              </Text>
              <Text variant="titleMedium" style={[styles.amountValue, { color: theme.colors.primary }]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text variant="bodySmall" style={styles.amountLabel}>
                Spent
              </Text>
              <Text variant="titleMedium" style={[styles.amountValue, { color: statusColor }]}>
                {formatCurrency(item.spent_amount || 0)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text variant="bodySmall" style={styles.amountLabel}>
                Remaining
              </Text>
              <Text variant="titleMedium" style={[styles.amountValue, { color: '#4CAF50' }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.min(percentageUsed / 100, 1)}
              color={statusColor}
              style={styles.progressBar}
            />
            <Text variant="labelLarge" style={[styles.percentageText, { color: statusColor }]}>
              {percentageUsed.toFixed(0)}%
            </Text>
          </View>

          {/* Alert Threshold */}
          {item.alert_at && (
            <Text variant="bodySmall" style={styles.alertText}>
              Alert at {item.alert_at}% • {item.status === 'exceeded' ? 'Over budget!' : item.status === 'warning' ? 'Approaching limit' : 'Within budget'}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const handleBudgetPress = (budget: Budget) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (budget.period === 'monthly') {
      // Start of current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      // End of current month
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else {
      // Yearly
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);

      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    router.push({
      pathname: '/transactions',
      params: {
        category_id: budget.category_id,
        start_date: startDate,
        end_date: endDate,
        type: 'Expense' // Budgets are typically for expenses
      }
    } as any);
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No Budgets Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        Create your first budget to track your spending
      </Text>
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
      <FlatList
        data={budgets}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        renderItem={renderBudgetItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.listContent,
          budgets.length === 0 && styles.emptyListContent,
        ]}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#6200EA' }]}
        onPress={() => router.push('/budgets/add')}
        color="white"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Close',
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodText: {
    opacity: 0.6,
    marginTop: 2,
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  amountValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  alertText: {
    opacity: 0.7,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyMessage: {
    opacity: 0.6,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
