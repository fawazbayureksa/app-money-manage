import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { BudgetAlert, alertService } from '../../api/alertService';

export default function AlertListScreen() {
  const theme = useTheme();
  // const router = useRouter();

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');

  // Fetch alerts
  const fetchAlerts = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const params = filterType === 'unread' ? { unread_only: true } : {};
      const response = await alertService.getAlerts(params);

      console.log('Alerts Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('Alerts data:', JSON.stringify(response.data, null, 2));
        setAlerts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load alerts';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  // Load alerts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [filterType])
  );

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts(false);
  };

  // Mark alert as read
  const handleMarkAsRead = async (alertId: number) => {
    try {
      const response = await alertService.markAsRead(alertId);
      if (response.success) {
        setSnackbarMessage('Alert marked as read');
        setSnackbarVisible(true);
        fetchAlerts(false);
      }
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to mark alert as read';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get alert color based on percentage
  const getAlertColor = (percentage: number): string => {
    if (percentage >= 100) return '#F44336'; // Red - exceeded
    if (percentage >= 80) return '#FF9800'; // Orange - warning
    return '#4CAF50'; // Green - safe
  };

  // Get alert icon based on percentage
  const getAlertIcon = (percentage: number): string => {
    if (percentage >= 100) return 'alert-circle';
    if (percentage >= 80) return 'alert';
    return 'information';
  };

  // Render alert item
  const renderAlertItem = ({ item }: { item: BudgetAlert }) => {
    const alertColor = getAlertColor(item.percentage);
    const alertIcon = getAlertIcon(item.percentage);

    return (
      <Card
        style={[
          styles.card,
          !item.is_read && { borderLeftWidth: 4, borderLeftColor: alertColor }
        ]}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <IconButton
                icon={alertIcon}
                iconColor={alertColor}
                size={24}
                style={[styles.alertIcon, { backgroundColor: alertColor + '20' }]}
              />
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.categoryName}>
                  {item.category_name}
                </Text>
                {!item.is_read && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.colors.error }]} />
                )}
              </View>

              <Text variant="bodyMedium" style={styles.message}>
                {item.message}
              </Text>

              <View style={styles.amountsRow}>
                <View style={styles.amountItem}>
                  <Text variant="bodySmall" style={styles.amountLabel}>
                    Spent
                  </Text>
                  <Text variant="bodyMedium" style={[styles.amountValue, { color: alertColor }]}>
                    {formatCurrency(item.spent_amount)}
                  </Text>
                </View>
                <View style={styles.amountItem}>
                  <Text variant="bodySmall" style={styles.amountLabel}>
                    Budget
                  </Text>
                  <Text variant="bodyMedium" style={styles.amountValue}>
                    {formatCurrency(item.budget_amount)}
                  </Text>
                </View>
                <View style={styles.amountItem}>
                  <Text variant="bodySmall" style={styles.amountLabel}>
                    Usage
                  </Text>
                  <Text variant="bodyMedium" style={[styles.amountValue, { color: alertColor }]}>
                    {item.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text variant="bodySmall" style={styles.timestamp}>
                  {formatDate(item.created_at)}
                </Text>
                {!item.is_read && (
                  <Button
                    icon="check-circle-outline"
                    mode="contained-tonal"
                    compact
                    onPress={() => handleMarkAsRead(item.id)}
                    style={styles.markReadButton}
                    labelStyle={styles.markReadButtonLabel}
                    contentStyle={{ flexDirection: 'row-reverse' }}
                  >
                    Mark Read
                  </Button>
                )}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="bell-outline"
        size={80}
        iconColor={theme.colors.outline}
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {filterType === 'unread' ? 'No Unread Alerts' : 'No Alerts Yet'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {filterType === 'unread'
          ? "You're all caught up!"
          : "You'll be notified when you approach your budget limits"}
      </Text>
    </View>
  );

  // Render filter chips
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filterType === 'all'}
        onPress={() => setFilterType('all')}
        style={styles.filterChip}
      >
        All
      </Chip>
      <Chip
        selected={filterType === 'unread'}
        onPress={() => setFilterType('unread')}
        style={styles.filterChip}
      >
        Unread
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
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item, index) => item?.id?.toString() || `alert-${index}`}
        contentContainerStyle={[
          styles.listContent,
          alerts.length === 0 && styles.emptyListContent,
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
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
  },
  alertIcon: {
    margin: 0,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontWeight: 'bold',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  message: {
    marginBottom: 12,
    lineHeight: 20,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    opacity: 0.6,
  },
  markReadButton: {
    borderRadius: 20,
    marginLeft: 8,
  },
  markReadButtonLabel: {
    fontSize: 11,
    marginVertical: 4,
    marginHorizontal: 8,
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
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 300,
  },
});
