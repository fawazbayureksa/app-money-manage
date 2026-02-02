import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alertService, BudgetAlert } from "../../api/alertService";
import {
  analyticsService,
  DashboardSummary,
  RecentTransaction,
} from "../../api/analyticsService";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDateRelative } from "../../utils/formatters";

export default function HomeScreen() {
  const theme = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recentAlerts, setRecentAlerts] = useState<BudgetAlert[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showAmounts, setShowAmounts] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(
    async (showLoader = true) => {
      if (!isAuthenticated) return;

      try {
        if (showLoader) setLoading(true);

        // Fetch dashboard analytics and alerts
        const [analyticsResponse, alertsResponse] = await Promise.all([
          analyticsService.getDashboardSummary(),
          alertService.getAlerts({ unread_only: true, page_size: 3 }),
        ]);

        if (analyticsResponse.success && analyticsResponse.data) {
          setDashboardData(analyticsResponse.data);
          // Recent transactions are now included in the analytics response
          setRecentTransactions(
            analyticsResponse.data.recent_transactions || [],
          );
        }

        if (alertsResponse.success && alertsResponse.data) {
          setRecentAlerts(alertsResponse.data.data);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to load dashboard data";
        setSnackbarMessage(errorMessage);
        setSnackbarVisible(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getAlertColor = (percentage: number): string => {
    if (percentage >= 100) return "#F44336";
    if (percentage >= 80) return "#FF9800";
    return "#4CAF50";
  };

  const getAlertIcon = (percentage: number): string => {
    if (percentage >= 100) return "alert-circle";
    if (percentage >= 80) return "alert";
    return "information";
  };

  // Show loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          variant="bodyMedium"
          style={{ marginTop: 16, color: theme.colors.onSurface }}
        >
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Welcome Header */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 16, backgroundColor: "#1f6a79ff" },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text variant="labelLarge" style={styles.welcomeLabel}>
              Welcome back
            </Text>
            <Text
              variant="headlineLarge"
              style={[styles.userName, { color: "#FFF" }]}
            >
              {user?.username || user?.email?.split("@")[0] || "User"}
            </Text>
            <Text variant="bodyMedium" style={styles.greetingSubtext}>
              Let&apos;s manage your finances today 💰
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <IconButton
              icon="account-circle"
              size={48}
              iconColor="#FFF"
              style={styles.avatarButton}
            />
          </View>
        </View>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.statsHeaderContainer}>
        <Text variant="titleMedium" style={styles.statsHeaderTitle}>
          Quick Stats
        </Text>
        <IconButton
          icon={showAmounts ? "eye-outline" : "eye-off-outline"}
          size={20}
          iconColor={theme.colors.primary}
          onPress={() => setShowAmounts(!showAmounts)}
          style={styles.eyeButton}
        />
      </View>
      {dashboardData ? (
        <View style={styles.statsContainer}>
          <Card
            style={[styles.statCard, { backgroundColor: "#4CAF50" }]}
            onPress={() =>
              router.push({
                pathname: "/transactions",
                params: { type: "Income" },
              } as any)
            }
          >
            <Card.Content style={styles.statContent}>
              <IconButton
                icon="arrow-up"
                size={16}
                iconColor="#FFF"
                style={styles.statIcon}
              />
              <View style={styles.statTextContainer}>
                <Text variant="labelMedium" style={styles.statLabel}>
                  Income
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {showAmounts
                    ? formatCurrency(dashboardData.current_month.total_income)
                    : "••••••"}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[styles.statCard, { backgroundColor: "#F44336" }]}
            onPress={() =>
              router.push({
                pathname: "/transactions",
                params: { type: "Expense" },
              } as any)
            }
          >
            <Card.Content style={styles.statContent}>
              <IconButton
                icon="arrow-down"
                size={16}
                iconColor="#FFF"
                style={styles.statIcon}
              />
              <View style={styles.statTextContainer}>
                <Text variant="labelMedium" style={styles.statLabel}>
                  Expenses
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {showAmounts
                    ? formatCurrency(dashboardData.current_month.total_expense)
                    : "••••••"}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <View style={styles.statsContainer}>
          <Card
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Card.Content style={styles.statContent}>
              <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                No data available
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Additional Stats */}
      {dashboardData && (
        <View style={styles.additionalStats}>
          <Card style={styles.additionalStatCard}>
            <Card.Content style={styles.additionalStatContent}>
              <View style={styles.additionalStatItem}>
                <IconButton
                  icon="wallet-outline"
                  size={18}
                  iconColor={theme.colors.primary}
                />
                <View>
                  <Text variant="bodySmall" style={styles.additionalStatLabel}>
                    Net Savings
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color:
                        dashboardData.current_month.net_amount >= 0
                          ? "#4CAF50"
                          : "#F44336",
                    }}
                  >
                    {showAmounts
                      ? formatCurrency(dashboardData.current_month.net_amount)
                      : "••••••"}
                  </Text>
                </View>
              </View>
              <View style={styles.additionalStatItem}>
                <IconButton
                  icon="chart-bar"
                  size={18}
                  iconColor={theme.colors.primary}
                />
                <View>
                  <Text variant="bodySmall" style={styles.additionalStatLabel}>
                    Active Budgets
                  </Text>
                  <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                    {dashboardData.budget_summary.active_budgets}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Top Categories Section */}
      {dashboardData &&
        dashboardData.top_categories &&
        dashboardData.top_categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Top Spending Categories
              </Text>
              <Chip
                icon="chart-pie"
                compact
                onPress={() => router.push("/(tabs)/categories" as any)}
              >
                View All
              </Chip>
            </View>

            <Card style={styles.categoriesCard}>
              <Card.Content style={{ padding: 16 }}>
                {dashboardData.top_categories.map((category, index) => {
                  // Generate distinct colors for each category
                  const colors = [
                    "#E91E63",
                    "#9C27B0",
                    "#3F51B5",
                    "#00BCD4",
                    "#FF9800",
                  ];
                  const categoryColor = colors[index % colors.length];

                  return (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryNameRow}>
                          <View
                            style={[
                              styles.categoryColorDot,
                              { backgroundColor: categoryColor },
                            ]}
                          />
                          <Text
                            variant="titleSmall"
                            style={styles.categoryName}
                          >
                            {category.category_name}
                          </Text>
                        </View>
                        <Text
                          variant="titleSmall"
                          style={[
                            styles.categoryAmount,
                            { color: categoryColor },
                          ]}
                        >
                          {showAmounts
                            ? formatCurrency(category.total_amount)
                            : "••••••"}
                        </Text>
                      </View>

                      <View style={styles.categoryProgressContainer}>
                        <View style={styles.categoryProgressBackground}>
                          <View
                            style={[
                              styles.categoryProgressBar,
                              {
                                width: `${Math.min(category.percentage, 100)}%`,
                                backgroundColor: categoryColor,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          variant="bodySmall"
                          style={styles.categoryPercentage}
                        >
                          {category.percentage.toFixed(1)}%
                        </Text>
                      </View>

                      <Text variant="bodySmall" style={styles.categoryCount}>
                        {category.count} transaction
                        {category.count !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          </View>
        )}

      {/* Budget Summary Section */}
      {dashboardData && dashboardData.budget_summary && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Budget Overview
            </Text>
            <Chip
              icon="wallet"
              compact
              onPress={() => router.push("/budgets" as any)}
            >
              Manage
            </Chip>
          </View>

          <Card style={styles.budgetSummaryCard}>
            <Card.Content style={{ padding: 16 }}>
              {/* Budget Utilization Progress */}
              <View style={styles.budgetUtilizationContainer}>
                <View style={styles.budgetUtilizationHeader}>
                  <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                    Overall Utilization
                  </Text>
                  <Text
                    variant="headlineSmall"
                    style={{
                      fontWeight: "bold",
                      color:
                        dashboardData.budget_summary.average_utilization >= 100
                          ? "#F44336"
                          : dashboardData.budget_summary.average_utilization >=
                              80
                            ? "#FF9800"
                            : "#4CAF50",
                    }}
                  >
                    {dashboardData.budget_summary.average_utilization.toFixed(
                      1,
                    )}
                    %
                  </Text>
                </View>

                <View style={styles.budgetProgressBackground}>
                  <View
                    style={[
                      styles.budgetProgressBar,
                      {
                        width: `${Math.min(dashboardData.budget_summary.average_utilization, 100)}%`,
                        backgroundColor:
                          dashboardData.budget_summary.average_utilization >=
                          100
                            ? "#F44336"
                            : dashboardData.budget_summary
                                  .average_utilization >= 80
                              ? "#FF9800"
                              : "#4CAF50",
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetAmountsRow}>
                  <View>
                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                      Spent
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={{ fontWeight: "bold", color: "#F44336" }}
                    >
                      {showAmounts
                        ? formatCurrency(
                            dashboardData.budget_summary.total_spent,
                          )
                        : "••••••"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                      Budget
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={{
                        fontWeight: "bold",
                        color: theme.colors.primary,
                      }}
                    >
                      {showAmounts
                        ? formatCurrency(
                            dashboardData.budget_summary.total_budgeted,
                          )
                        : "••••••"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Budget Status Cards */}
              <View style={styles.budgetStatsGrid}>
                <View
                  style={[
                    styles.budgetStatItem,
                    { backgroundColor: "#4CAF5015" },
                  ]}
                >
                  <IconButton
                    icon="check-circle"
                    iconColor="#4CAF50"
                    size={24}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="headlineSmall"
                    style={{ fontWeight: "bold", color: "#4CAF50" }}
                  >
                    {dashboardData.budget_summary.active_budgets}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    Active
                  </Text>
                </View>

                <View
                  style={[
                    styles.budgetStatItem,
                    { backgroundColor: "#FF980015" },
                  ]}
                >
                  <IconButton
                    icon="alert"
                    iconColor="#FF9800"
                    size={24}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="headlineSmall"
                    style={{ fontWeight: "bold", color: "#FF9800" }}
                  >
                    {dashboardData.budget_summary.warning_budgets}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    Warning
                  </Text>
                </View>

                <View
                  style={[
                    styles.budgetStatItem,
                    { backgroundColor: "#F4433615" },
                  ]}
                >
                  <IconButton
                    icon="alert-circle"
                    iconColor="#F44336"
                    size={24}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="headlineSmall"
                    style={{ fontWeight: "bold", color: "#F44336" }}
                  >
                    {dashboardData.budget_summary.exceeded_budgets}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    Exceeded
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Recent Alerts Section */}
      {recentAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Alerts
            </Text>
            <Chip
              icon="bell"
              compact
              onPress={() => router.push("/alerts" as any)}
            >
              View All
            </Chip>
          </View>

          {recentAlerts.map((alert) => {
            const alertColor = getAlertColor(alert.percentage);
            const alertIcon = getAlertIcon(alert.percentage);

            return (
              <Card
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderLeftWidth: 4, borderLeftColor: alertColor },
                ]}
                onPress={() => router.push("/alerts" as any)}
              >
                <Card.Content style={styles.alertContent}>
                  <View
                    style={[
                      styles.alertIcon,
                      { backgroundColor: alertColor + "20" },
                    ]}
                  >
                    <IconButton
                      icon={alertIcon}
                      iconColor={alertColor}
                      size={20}
                      style={{ margin: 0 }}
                    />
                  </View>
                  <View style={styles.alertTextContainer}>
                    <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
                      {alert.category_name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      numberOfLines={2}
                      style={{ marginTop: 4 }}
                    >
                      {alert.message}
                    </Text>
                    <View style={styles.alertFooter}>
                      <Text
                        variant="bodySmall"
                        style={[{ color: alertColor, fontWeight: "bold" }]}
                      >
                        {alert.percentage.toFixed(0)}% used
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Transactions
            </Text>
            <Chip
              icon="format-list-bulleted"
              compact
              onPress={() => router.push("/transactions" as any)}
            >
              View All
            </Chip>
          </View>

          {recentTransactions.map((transaction) => {
            const isIncome = transaction.transaction_type === 1;
            const typeColor = isIncome ? "#4CAF50" : "#F44336";

            return (
              <Card key={transaction.id} style={styles.transactionCard}>
                <Card.Content style={styles.transactionContent}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: typeColor + "20" },
                    ]}
                  >
                    <IconButton
                      icon={isIncome ? "arrow-up" : "arrow-down"}
                      iconColor={typeColor}
                      size={20}
                      style={{ margin: 0 }}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
                      {transaction.category_name || "No Category"}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                      {formatDateRelative(transaction.date)}
                    </Text>
                  </View>
                  <Text
                    variant="titleMedium"
                    style={[{ fontWeight: "bold", color: typeColor }]}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {!dashboardData && recentTransactions.length === 0 && (
        <View style={styles.emptyState}>
          <IconButton
            icon="chart-line"
            size={80}
            iconColor={theme.colors.outline}
          />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Data Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Start by adding your first transaction or budget
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/transactions/add" as any)}
            style={{ marginTop: 16 }}
            icon="plus"
          >
            Add Transaction
          </Button>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <Card
          style={styles.actionCard}
          onPress={() => router.push("/transactions/add" as any)}
        >
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: "#4CAF5020" }]}>
              <IconButton
                icon="plus-circle"
                size={28}
                iconColor="#4CAF50"
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">Add Transaction</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Record your income or expenses
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        <Card
          style={styles.actionCard}
          onPress={() => router.push("/budgets" as any)}
        >
          <Card.Content style={styles.actionContent}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.tertiaryContainer },
              ]}
            >
              <IconButton
                icon="wallet-outline"
                size={28}
                iconColor={theme.colors.tertiary}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">Manage Budgets</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Create and track spending limits
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        <Card
          style={styles.actionCard}
          onPress={() => router.push("/wallets" as any)}
        >
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: "#FF980020" }]}>
              <IconButton
                icon="wallet"
                size={28}
                iconColor="#FF9800"
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">Wallets</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Manage your assets and accounts
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        <Card
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/categories" as any)}
        >
          <Card.Content style={styles.actionContent}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <IconButton
                icon="folder-multiple"
                size={28}
                iconColor={theme.colors.primary}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">Manage Categories</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Organize your expense categories
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Card style={styles.accountCard}>
          <Card.Content>
            <View style={styles.accountHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                  Account
                </Text>
                <Text variant="bodySmall" style={styles.accountEmail}>
                  {user?.email}
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={handleLogout}
                icon="logout"
                compact
              >
                Logout
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={{ height: 24 }} />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  welcomeSection: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeLabel: {
    color: "#FFF",
    opacity: 0.85,
    marginBottom: 6,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  userName: {
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  greetingSubtext: {
    color: "#FFF",
    opacity: 0.75,
    fontSize: 13,
    marginTop: 2,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButton: {
    margin: 0,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statsHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsHeaderTitle: {
    fontWeight: "600",
  },
  eyeButton: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  statIcon: {
    margin: 0,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    color: "#FFF",
    opacity: 0.9,
    fontSize: 12,
  },
  statValue: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  additionalStats: {
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  additionalStatCard: {
    borderRadius: 16,
  },
  additionalStatContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
  },
  additionalStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  additionalStatLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  alertCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 4,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertFooter: {
    marginTop: 8,
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  transactionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    maxWidth: 300,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  accountCard: {
    borderRadius: 12,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountEmail: {
    opacity: 0.6,
    marginTop: 4,
  },
  // Top Categories Styles
  categoriesCard: {
    borderRadius: 16,
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontWeight: "600",
  },
  categoryAmount: {
    fontWeight: "bold",
  },
  categoryProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryProgressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  categoryPercentage: {
    fontWeight: "600",
    minWidth: 45,
    textAlign: "right",
  },
  categoryCount: {
    opacity: 0.6,
    fontSize: 12,
  },
  // Budget Summary Styles
  budgetSummaryCard: {
    borderRadius: 16,
  },
  budgetUtilizationContainer: {
    marginBottom: 20,
  },
  budgetUtilizationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetProgressBackground: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  budgetProgressBar: {
    height: "100%",
    borderRadius: 6,
  },
  budgetAmountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetStatsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  budgetStatItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
});
