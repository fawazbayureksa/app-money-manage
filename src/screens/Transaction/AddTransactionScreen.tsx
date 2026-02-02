import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  HelperText,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import {
  DatePickerModal,
  enGB,
  registerTranslation,
} from "react-native-paper-dates";
import { Category, categoryService } from "../../api/categoryService";
import { transactionService } from "../../api/transactionService";
import { Wallet, walletService } from "../../api/walletService";
import { formatCurrency, getCurrencySymbol } from "../../utils/formatters";

// Register the locale for date picker
registerTranslation("en", enGB);

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Form state
  const [transactionType, setTransactionType] = useState<"Income" | "Expense">(
    "Expense",
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI State
  const [openModal, setOpenModal] = useState<"category" | "wallet" | null>(
    null,
  );

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load categories and banks
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, walletsRes] = await Promise.all([
        categoryService.getCategories(),
        walletService.getWallets({ page: 1, page_size: 100 }),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (walletsRes.success && walletsRes.data) {
        setWallets(walletsRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load categories and wallets");
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!selectedCategory) {
      newErrors.category = "Please select a category";
    }
    if (!selectedBank) {
      newErrors.wallet =
        wallets.length === 0
          ? "Please create a wallet first"
          : "Please select a wallet";
    }
    if (!description || description.trim() === "") {
      newErrors.description = "Please add a note";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const transactionData = {
        asset_id: selectedBank!,
        category_id: selectedCategory!,
        amount: parseInt(amount),
        description: description.trim(),
        date: date.toISOString().split("T")[0],
        transaction_type: transactionType,
      };

      const response =
        await transactionService.createTransaction(transactionData);

      if (response.success) {
        Alert.alert("Success", "Transaction created successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to create transaction",
        );
      }
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create transaction. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderSelectionModal = () => {
    const isCategory = openModal === "category";
    const items = isCategory ? categories : wallets;
    const title = isCategory ? "Select Category" : "Select Wallet";

    return (
      <Portal>
        <Modal
          visible={!!openModal}
          onDismiss={() => setOpenModal(null)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">{title}</Text>
            <IconButton icon="close" onPress={() => setOpenModal(null)} />
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item: any) => {
              const id = isCategory ? item.ID : item.id;
              const label = isCategory ? item.CategoryName : item.name;
              const selected = isCategory
                ? selectedCategory === id
                : selectedBank === id;

              return (
                <React.Fragment key={id}>
                  <TouchableRipple
                    onPress={() => {
                      if (isCategory) {
                        setSelectedCategory(id);
                        setErrors({ ...errors, category: "" });
                      } else {
                        setSelectedBank(id);
                        setErrors({ ...errors, wallet: "" });
                      }
                      setOpenModal(null);
                    }}
                  >
                    <View style={styles.modalItem}>
                      <View style={styles.modalItemContent}>
                        <View
                          style={[
                            styles.iconPlaceholder,
                            {
                              backgroundColor: theme.colors.secondaryContainer,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              isCategory ? "grid-outline" : "wallet-outline"
                            }
                            size={24}
                            color={theme.colors.onSecondaryContainer}
                          />
                        </View>
                        <Text variant="bodyLarge">{label}</Text>
                      </View>
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                  </TouchableRipple>
                  <Divider />
                </React.Fragment>
              );
            })}
            {!isCategory && wallets.length === 0 && (
              <View style={[styles.modalItem, { justifyContent: "center" }]}>
                <Text variant="bodyMedium">No wallets found.</Text>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    );
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerContainer}>
        <IconButton icon="arrow-left" onPress={handleCancel} />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Add Transaction
        </Text>
        <Button onPress={handleSubmit} loading={loading} disabled={loading}>
          Save
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.typeSelectorContainer}>
          <SegmentedButtons
            value={transactionType}
            onValueChange={(value) =>
              setTransactionType(value as "Income" | "Expense")
            }
            buttons={[
              {
                value: "Expense",
                label: "Expense",
                style:
                  transactionType === "Expense"
                    ? { backgroundColor: theme.colors.errorContainer }
                    : {},
                checkedColor: theme.colors.onErrorContainer,
              },
              {
                value: "Income",
                label: "Income",
                style:
                  transactionType === "Income"
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : {},
                checkedColor: theme.colors.onPrimaryContainer,
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.amountContainer}>
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Amount
          </Text>
          <View style={styles.amountInputRow}>
            <Text
              variant="headlineLarge"
              style={{
                color:
                  transactionType === "Income"
                    ? theme.colors.primary
                    : theme.colors.error,
                fontWeight: "bold",
              }}
            >
              {selectedBank
                ? getCurrencySymbol(
                    wallets.find((w) => w.id === selectedBank)?.currency ||
                      "USD",
                  )
                : "$"}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setErrors({ ...errors, amount: "" });
              }}
              placeholder="0"
              keyboardType="numeric"
              style={[
                styles.amountInput,
                {
                  color:
                    transactionType === "Income"
                      ? theme.colors.primary
                      : theme.colors.error,
                },
              ]}
              contentStyle={[
                styles.amountInputContent,
                {
                  color:
                    transactionType === "Income"
                      ? theme.colors.primary
                      : theme.colors.error,
                },
              ]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor={
                transactionType === "Income"
                  ? theme.colors.primary
                  : theme.colors.error
              }
            />
          </View>
          {errors.amount && (
            <HelperText type="error">{errors.amount}</HelperText>
          )}
        </View>

        <Surface
          style={[
            styles.formSurface,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          elevation={0}
        >
          <TouchableRipple onPress={() => setOpenModal("category")}>
            <View style={styles.formRow}>
              <View style={styles.formRowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                >
                  <Ionicons
                    name="grid-outline"
                    size={22}
                    color={theme.colors.onSecondaryContainer}
                  />
                </View>
                <View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Category
                  </Text>
                  <Text variant="bodyLarge">
                    {selectedCategory
                      ? categories.find((c) => c.ID === selectedCategory)
                          ?.CategoryName
                      : "Select Category"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </TouchableRipple>
          <Divider style={styles.divider} />
          {errors.category && (
            <HelperText type="error">{errors.category}</HelperText>
          )}

          <TouchableRipple onPress={() => setOpenModal("wallet")}>
            <View style={styles.formRow}>
              <View style={styles.formRowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.colors.tertiaryContainer },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={22}
                    color={theme.colors.onTertiaryContainer}
                  />
                </View>
                <View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Wallet
                  </Text>
                  <Text variant="bodyLarge">
                    {selectedBank
                      ? wallets.find((w) => w.id === selectedBank)?.name
                      : "Select Wallet"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </TouchableRipple>
          <Divider style={styles.divider} />
          {errors.wallet && (
            <HelperText type="error">{errors.wallet}</HelperText>
          )}

          <TouchableRipple onPress={() => setShowDatePicker(true)}>
            <View style={styles.formRow}>
              <View style={styles.formRowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={theme.colors.onPrimaryContainer}
                  />
                </View>
                <View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Date
                  </Text>
                  <Text variant="bodyLarge">{date.toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          </TouchableRipple>
          <Divider style={styles.divider} />

          <View style={styles.inputContainer}>
            <View style={styles.formRowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <TextInput
                placeholder="Note *"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrors({ ...errors, description: "" });
                }}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                style={styles.noteInput}
                multiline
                textColor={theme.colors.onSurface}
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
              {errors.description && (
                <HelperText type="error" visible={!!errors.description}>
                  {errors.description}
                </HelperText>
              )}
            </View>
          </View>
        </Surface>

        {selectedBank &&
          (() => {
            const selectedWallet = wallets.find((w) => w.id === selectedBank);
            if (!selectedWallet) return null;
            const amountValue = parseFloat(amount) || 0;
            const isIncome = transactionType === "Income";
            const newBalance = isIncome
              ? selectedWallet.balance + amountValue
              : selectedWallet.balance - amountValue;

            return (
              <Surface
                style={[
                  styles.balancePreviewCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                elevation={0}
              >
                <Text
                  variant="titleSmall"
                  style={{
                    marginBottom: 8,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Balance Preview
                </Text>
                <View style={styles.balanceRow}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Current:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {formatCurrency(
                      selectedWallet.balance,
                      selectedWallet.currency,
                    )}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    New:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "bold",
                      color: isIncome ? "#4CAF50" : "#F44336",
                    }}
                  >
                    {formatCurrency(newBalance, selectedWallet.currency)}
                  </Text>
                </View>
              </Surface>
            );
          })()}
      </ScrollView>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={date}
        onConfirm={(params) => {
          setShowDatePicker(false);
          if (params.date) {
            setDate(params.date);
          }
        }}
      />
      {renderSelectionModal()}
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  typeSelectorContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  segmentedButtons: {
    // Custom style if needed
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  amountInput: {
    backgroundColor: "transparent",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    minWidth: 100,
    height: 80,
  },
  amountInputContent: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 0,
  },
  formSurface: {
    borderRadius: 16,
    // backgroundColor handled by style prop
    paddingVertical: 8,
    borderWidth: 1,
    // borderColor handled by style prop
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  formRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  divider: {
    marginLeft: 72,
  },
  inputContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  noteInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 16,
  },
  balancePreviewCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    // backgroundColor handled by style prop
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    paddingBottom: 20,
    maxHeight: "80%",
    // backgroundColor handled by style prop
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
});
