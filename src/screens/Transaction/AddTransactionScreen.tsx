import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    HelperText,
    SegmentedButtons,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { Bank, bankRepository } from '../../database/BankRepository';
import { Category, categoryRepository } from '../../database/CategoryRepository';
import { transactionRepository } from '../../database/TransactionRepository';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Form state
  const [transactionType, setTransactionType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
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
      const [categoriesData, banksData] = await Promise.all([
        categoryRepository.findAll(),
        bankRepository.findAll(),
      ]);

      setCategories(categoriesData);
      setBanks(banksData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load categories and banks');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    if (!selectedBank) {
      newErrors.bank = 'Please select a bank';
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

      await transactionRepository.create({
        bank_id: selectedBank!,
        category_id: selectedCategory!,
        amount: parseFloat(amount),
        description: description.trim(),
        date: date.toISOString(),
        transaction_type: transactionType === 'Income' ? 1 : 2,
      });

      Alert.alert('Success', 'Transaction created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', 'Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface} elevation={1}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Add Transaction
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Record your income or expense
            </Text>
          </View>

          <View style={styles.form}>
            {/* Transaction Type Selector */}
            <Text variant="labelLarge" style={styles.label}>
              Transaction Type
            </Text>
            <SegmentedButtons
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as 'Income' | 'Expense')}
              buttons={[
                {
                  value: 'Income',
                  label: 'Income',
                  icon: 'arrow-up',
                  style: transactionType === 'Income' ? { backgroundColor: '#4CAF50' } : {},
                },
                {
                  value: 'Expense',
                  label: 'Expense',
                  icon: 'arrow-down',
                  style: transactionType === 'Expense' ? { backgroundColor: '#F44336' } : {},
                },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Amount Input */}
            <TextInput
              label="Amount *"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setErrors({ ...errors, amount: '' });
              }}
              mode="outlined"
              keyboardType="numeric"
              disabled={loading}
              error={!!errors.amount}
              left={<TextInput.Icon icon="currency-usd" />}
              style={styles.input}
              placeholder="0.00"
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>

            {/* Category Picker */}
            <Text variant="labelLarge" style={styles.label}>
              Category *
            </Text>
            <View style={styles.pickerContainer}>
              {categories.map((category) => (
                <Button
                  key={category.remote_id}
                  mode={selectedCategory === category.remote_id ? 'contained' : 'outlined'}
                  onPress={() => {
                    setSelectedCategory(category.remote_id);
                    setErrors({ ...errors, category: '' });
                  }}
                  style={styles.pickerButton}
                  compact
                >
                  {category.category_name}
                </Button>
              ))}
            </View>
            <HelperText type="error" visible={!!errors.category}>
              {errors.category}
            </HelperText>

            {/* Bank Picker */}
            <Text variant="labelLarge" style={styles.label}>
              Bank *
            </Text>
            <View style={styles.pickerContainer}>
              {banks.map((bank) => (
                <Button
                  key={bank.remote_id}
                  mode={selectedBank === bank.remote_id ? 'contained' : 'outlined'}
                  onPress={() => {
                    setSelectedBank(bank.remote_id);
                    setErrors({ ...errors, bank: '' });
                  }}
                  style={styles.pickerButton}
                  compact
                >
                  {bank.bank_name}
                </Button>
              ))}
            </View>
            <HelperText type="error" visible={!!errors.bank}>
              {errors.bank}
            </HelperText>

            {/* Date Picker */}
            <Text variant="labelLarge" style={styles.label}>
              Date
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              style={styles.dateButton}
            >
              {date.toLocaleDateString()}
            </Button>

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

            {/* Description Input */}
            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              disabled={loading}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" />}
              style={styles.input}
              placeholder="Add notes about this transaction"
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                disabled={loading}
                style={styles.button}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : 'Create'}
              </Button>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  surface: {
    padding: 24,
    borderRadius: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pickerButton: {
    marginBottom: 4,
  },
  dateButton: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    height: 40,
  },
});
