import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View
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

      if (response.success && response.data) {
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
        style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]}
        mode="elevated"
        onPress={() => handleBudgetPress(item)}
      >
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
                <IconButton
                  icon={getStatusIcon(item.status || 'safe')}
                  iconColor={statusColor}
                  size={20}
                  style={{ margin: 0 }}
                />
              </View>
              <View>
                <Text variant="titleMedium" style={styles.categoryName}>
                  {item.category_name || 'No Category'}
                </Text>
                <Text variant="labelSmall" style={styles.periodText}>
                  {item.period === 'monthly' ? 'Monthly' : 'Yearly'} • {remaining < 0 ? 'Over by' : 'Left:'} {formatCurrency(Math.abs(remaining))}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
              <Text variant="labelSmall" style={{ color: statusColor, fontWeight: '600' }}>
                {item.status === 'exceeded' ? 'Over' : item.status === 'warning' ? 'Warning' : 'Good'}
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text variant="bodyMedium" style={styles.spentText}>
                {formatCurrency(item.spent_amount || 0)}
                <Text variant="bodySmall" style={styles.totalText}> / {formatCurrency(item.amount)}</Text>
              </Text>
              <Text variant="labelMedium" style={{ color: statusColor, fontWeight: '600' }}>
                {percentageUsed.toFixed(0)}%
              </Text>
            </View>

            <ProgressBar
              progress={Math.min(percentageUsed / 100, 1)}
              color={statusColor}
              style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>

          {/* Alert Footer (Optional - only show if warning/exceeded or set) */}
          {item.alert_at && (
            <View style={styles.footer}>
              <Text variant="labelSmall" style={styles.alertText}>
                Alert at {item.alert_at}%
              </Text>
            </View>
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
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0, // Cleaner look
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  periodText: {
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  spentText: {
    fontWeight: '700',
    fontSize: 16,
  },
  totalText: {
    opacity: 0.5,
    fontWeight: '400',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  alertText: {
    opacity: 0.5,
    fontStyle: 'italic',
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
    shadowColor: '#6200EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
