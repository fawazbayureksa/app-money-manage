import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CreateWalletRequest,
  UpdateWalletRequest,
  walletService,
} from "../../api/walletService";

const WALLET_TYPES = [
  "Bank",
  "Cash",
  "Credit Card",
  "Digital Wallet",
  "Investment",
  "Savings",
];

const CURRENCIES = ["IDR", "USD", "EUR", "GBP", "SGD", "MYR"];

export default function WalletFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [formData, setFormData] = useState<CreateWalletRequest>({
    name: "",
    type: "Bank",
    balance: 0,
    currency: "IDR",
    bank_name: "",
    account_no: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateWalletRequest, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (params.id) {
      setIsEdit(true);
      fetchWalletDetails(parseInt(params.id));
    }
  }, [params.id]);

  const fetchWalletDetails = async (walletId: number) => {
    try {
      setLoading(true);
      const response = await walletService.getWallet(walletId);
      if (response.success && response.data) {
        const wallet = response.data;
        setFormData({
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance,
          currency: wallet.currency,
          bank_name: wallet.bank_name || "",
          account_no: wallet.account_no || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching wallet details:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load wallet details";
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateWalletRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Wallet name is required";
    }

    if (!formData.type) {
      newErrors.type = "Wallet type is required";
    }

    if (formData.balance < 0) {
      newErrors.balance = "Balance cannot be negative";
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      let response;

      if (isEdit && params.id) {
        const updateData: UpdateWalletRequest = {
          name: formData.name,
          type: formData.type,
          balance: formData.balance,
          currency: formData.currency,
        };

        if (formData.bank_name) updateData.bank_name = formData.bank_name;
        if (formData.account_no) updateData.account_no = formData.account_no;

        response = await walletService.updateWallet(
          parseInt(params.id),
          updateData,
        );
      } else {
        response = await walletService.createWallet(formData);
      }

      if (response.success) {
        setSnackbarMessage(
          isEdit
            ? "Wallet updated successfully"
            : "Wallet created successfully",
        );
        setSnackbarVisible(true);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error saving wallet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save wallet";
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerSection}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFF"
              style={styles.backButton}
              onPress={() => router.back()}
            />
            <View style={styles.titleSection}>
              <Text variant="labelLarge" style={styles.welcomeLabel}>
                {isEdit ? "Update" : "Create"}
              </Text>
              <Text variant="headlineLarge" style={styles.headerTitle}>
                Wallet
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Wallet Information
            </Text>

            <TextInput
              label="Wallet Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              error={!!errors.name}
              style={styles.input}
              mode="outlined"
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.name}
              </Text>
            )}

            <Text variant="bodySmall" style={styles.label}>
              Wallet Type *
            </Text>
            <View style={styles.typeContainer}>
              {WALLET_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={formData.type === type}
                  onPress={() => setFormData({ ...formData, type })}
                  mode={formData.type === type ? "flat" : "outlined"}
                  style={styles.typeChip}
                >
                  {type}
                </Chip>
              ))}
            </View>
            {errors.type && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.type}
              </Text>
            )}

            <Text variant="bodySmall" style={styles.label}>
              Currency *
            </Text>
            <View style={styles.currencyContainer}>
              {CURRENCIES.map((currency) => (
                <Chip
                  key={currency}
                  selected={formData.currency === currency}
                  onPress={() => setFormData({ ...formData, currency })}
                  mode={formData.currency === currency ? "flat" : "outlined"}
                  style={styles.currencyChip}
                >
                  {currency}
                </Chip>
              ))}
            </View>
            {errors.currency && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.currency}
              </Text>
            )}

            <TextInput
              label="Initial Balance"
              value={formData.balance.toString()}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  balance: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              error={!!errors.balance}
              style={styles.input}
              mode="outlined"
            />
            {errors.balance && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.balance}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Bank Details (Optional)
            </Text>

            <TextInput
              label="Bank Name"
              value={formData.bank_name}
              onChangeText={(text) =>
                setFormData({ ...formData, bank_name: text })
              }
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Account Number"
              value={formData.account_no}
              onChangeText={(text) =>
                setFormData({ ...formData, account_no: text })
              }
              keyboardType="number-pad"
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            {isEdit ? "Update Wallet" : "Create Wallet"}
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
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
  header: {
    backgroundColor: "#1f6a79ff",
    paddingTop: 0,
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
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleSection: {
    flex: 1,
  },
  welcomeLabel: {
    color: "#FFF",
    opacity: 0.85,
    marginBottom: 6,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    color: "#FFF",
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    marginBottom: 4,
  },
  currencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  currencyChip: {
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
  submitButton: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#1f6a79ff",
    shadowColor: "#1f6a79ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    borderRadius: 12,
    color: "#1f6a79ff",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
