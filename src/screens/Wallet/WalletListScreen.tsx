import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  FAB,
  IconButton,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wallet, walletService } from "../../api/walletService";
import { formatCurrency } from "../../utils/formatters";

export default function WalletListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [showAmounts, setShowAmounts] = useState(false);

  const fetchWallets = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await walletService.getWallets();
      if (response.success && response.data) {
        const walletsArray = response?.data;
        setWallets(Array.isArray(walletsArray) ? walletsArray : []);
      }
    } catch (error: any) {
      console.error("Error fetching wallets:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load wallets";
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallets();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets(false);
    setRefreshing(false);
  };

  const handleDelete = (wallet: Wallet) => {
    setWalletToDelete(wallet);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!walletToDelete) return;

    try {
      const response = await walletService.deleteWallet(walletToDelete.id);
      if (response.success) {
        setSnackbarMessage("Wallet deleted successfully");
        setSnackbarVisible(true);
        fetchWallets(false);
      }
    } catch (error: any) {
      console.error("Error deleting wallet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete wallet";
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setDeleteDialogVisible(false);
      setWalletToDelete(null);
    }
  };

  const handleEdit = (wallet: Wallet) => {
    router.push({
      pathname: "/wallets/[id]/edit",
      params: { id: wallet.id.toString() },
    } as any);
  };

  const getTotalBalance = () => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  };

  const getWalletIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case "bank":
        return "bank";
      case "cash":
        return "cash";
      case "credit card":
        return "credit-card";
      case "digital":
        return "tablet";
      case "investment":
        return "chart-line";
      case "savings":
        return "piggy-bank";
      default:
        return "wallet";
    }
  };

  const getWalletColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case "bank":
        return "#1976D2";
      case "cash":
        return "#4CAF50";
      case "credit card":
        return "#F44336";
      case "digital":
        return "#9C27B0";
      case "investment":
        return "#FF9800";
      case "savings":
        return "#00BCD4";
      default:
        return "#607D8B";
    }
  };

  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const walletColor = getWalletColor(item.type);
    const walletIcon = getWalletIcon(item.type);

    return (
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
        mode="elevated"
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: walletColor + "20" },
              ]}
            >
              <IconButton
                icon={walletIcon}
                iconColor={walletColor}
                size={24}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.walletInfo}>
              <View style={styles.walletNameRow}>
                <Text variant="titleMedium" style={styles.walletName}>
                  {item.name}
                </Text>
                <Chip icon="wallet" compact mode="flat">
                  {item.currency}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.walletType}>
                {item.type}
                {item.bank_name && ` • ${item.bank_name}`}
              </Text>
            </View>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text variant="bodySmall" style={styles.balanceLabel}>
                Balance
              </Text>
              <Text
                variant="headlineMedium"
                style={[styles.balanceValue, { color: walletColor }]}
              >
                {showAmounts ? formatCurrency(item.balance) : "••••••"}
              </Text>
            </View>

            {item.account_no && (
              <View style={styles.accountSection}>
                <Text variant="labelSmall" style={styles.accountLabel}>
                  Account: ****{item.account_no.slice(-4)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={18}
              iconColor={theme.colors.primary}
              onPress={() => handleEdit(item)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={18}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(item)}
              style={styles.actionButton}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTotalBalanceCard = () => (
    <Card style={styles.totalBalanceCard}>
      <Card.Content style={styles.totalBalanceContent}>
        <View style={styles.totalBalanceLeft}>
          <View style={[styles.totalIcon]}>
            <IconButton
              icon="wallet-outline"
              iconColor="#eeeeee"
              size={32}
              style={{ margin: 0 }}
            />
          </View>
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text variant="bodyMedium" style={styles.totalLabel}>
                Total Balance
              </Text>
              <IconButton
                icon={showAmounts ? "eye-outline" : "eye-off-outline"}
                size={20}
                iconColor="#FFFFFF"
                onPress={() => setShowAmounts(!showAmounts)}
                style={styles.toggleAmountButton}
              />
            </View>
            <Text variant="headlineMedium" style={styles.totalValue}>
              {showAmounts ? formatCurrency(getTotalBalance()) : "••••••"}
            </Text>
            <Text variant="bodySmall" style={styles.walletCount}>
              {wallets.length} {wallets.length === 1 ? "Wallet" : "Wallets"}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="wallet-outline"
        size={80}
        iconColor={theme.colors.outline}
      />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No Wallets Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        Create your first wallet to track your assets
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
          Wallets
        </Text>
      </View>

      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {wallets.length > 0 && renderTotalBalanceCard()}

        {wallets.length > 0
          ? wallets.map((item) => (
              <View key={item.id}>{renderWalletItem({ item })}</View>
            ))
          : renderEmptyList()}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: "#1f6a79ff" }]}
        onPress={() => router.push("/wallets/add" as any)}
        color="white"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "Close",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Wallet</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{walletToDelete?.name}"? This
              action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={confirmDelete}
              mode="contained"
              style={{ backgroundColor: "#F44336" }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  totalBalanceCard: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: "#1f6a79ff",
    elevation: 8,
  },
  totalBalanceContent: {
    padding: 20,
  },
  totalBalanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  totalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  totalLabel: {
    color: "#FFFFFF",
    opacity: 0.85,
    marginBottom: 4,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  totalValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 2,
  },
  walletCount: {
    color: "#FFFFFF",
    opacity: 0.7,
    fontSize: 13,
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#1f6a79ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    margin: 0,
  },
  headerTextSection: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeLabel: {
    color: "#FFF",
    opacity: 0.85,
    marginBottom: 4,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  userName: {
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    letterSpacing: 0.3,
    fontSize: 20,
  },
  greetingSubtext: {
    color: "#FFF",
    opacity: 0.8,
    fontSize: 14,
    marginTop: 2,
    fontWeight: "500",
  },
  toggleAmountButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  walletName: {
    fontWeight: "600",
    fontSize: 16,
  },
  walletType: {
    opacity: 0.6,
    fontSize: 13,
  },
  balanceSection: {
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    opacity: 0.7,
    fontSize: 13,
  },
  balanceValue: {
    fontWeight: "bold",
    fontSize: 20,
  },
  accountSection: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 6,
  },
  accountLabel: {
    opacity: 0.6,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
    gap: 4,
  },
  actionButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptyMessage: {
    opacity: 0.6,
    textAlign: "center",
    maxWidth: 250,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 16,
    shadowColor: "#1f6a79ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
