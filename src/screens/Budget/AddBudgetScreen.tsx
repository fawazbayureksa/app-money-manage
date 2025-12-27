import Slider from '@react-native-community/slider';
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
import { budgetService } from '../../api/budgetService';
import { Category, categoryService } from '../../api/categoryService';

export default function AddBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingData(true);
      const response = await categoryService.getCategories();

      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Budget amount must be greater than 0';
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

      const budgetData = {
        category_id: selectedCategory!,
        amount: parseFloat(amount),
        period,
        start_date: startDate.toISOString().split('T')[0],
        alert_at: alertThreshold,
      };

      const response = await budgetService.createBudget(budgetData);

      if (response.success) {
        Alert.alert('Success', 'Budget created successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create budget');
      }
    } catch (error: any) {
      console.error('Error creating budget:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create budget. Please try again.';
      Alert.alert('Error', errorMessage);
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
              Create Budget
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Set spending limits for your categories
            </Text>
          </View>

          <View style={styles.form}>
            {/* Category Picker */}
            <Text variant="labelLarge" style={styles.label}>
              Category *
            </Text>
            <View style={styles.pickerContainer}>
              {categories.map((category) => (
                <Button
                  key={category.ID}
                  mode={selectedCategory === category.ID ? 'contained' : 'outlined'}
                  onPress={() => {
                    setSelectedCategory(category.ID);
                    setErrors({ ...errors, category: '' });
                  }}
                  style={styles.pickerButton}
                  compact
                >
                  {category.CategoryName}
                </Button>
              ))}
            </View>
            <HelperText type="error" visible={!!errors.category}>
              {errors.category}
            </HelperText>

            {/* Amount Input */}
            <TextInput
              label="Budget Amount *"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setErrors({ ...errors, amount: '' });
              }}
              mode="outlined"
              keyboardType="numeric"
              disabled={loading}
              error={!!errors.amount}
              left={<Text style={{ paddingLeft: 14, paddingTop: 18, fontSize: 16, fontWeight: 'bold' }}>Rp</Text>}
              style={styles.input}
              placeholder="0"
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>

            {/* Period Selector */}
            <Text variant="labelLarge" style={styles.label}>
              Period
            </Text>
            <SegmentedButtons
              value={period}
              onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}
              buttons={[
                {
                  value: 'monthly',
                  label: 'Monthly',
                  icon: 'calendar-month',
                },
                {
                  value: 'yearly',
                  label: 'Yearly',
                  icon: 'calendar',
                },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Start Date Picker */}
            <Text variant="labelLarge" style={styles.label}>
              Start Date
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              style={styles.dateButton}
            >
              {startDate.toLocaleDateString()}
            </Button>

            <DatePickerModal
              locale="en"
              mode="single"
              visible={showDatePicker}
              onDismiss={() => setShowDatePicker(false)}
              date={startDate}
              onConfirm={(params) => {
                setShowDatePicker(false);
                if (params.date) {
                  setStartDate(params.date);
                }
              }}
            />

            {/* Alert Threshold Slider */}
            <Text variant="labelLarge" style={styles.label}>
              Alert Threshold: {alertThreshold}%
            </Text>
            <View style={styles.sliderContainer}>
              <Text variant="bodySmall">50%</Text>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={100}
                step={5}
                value={alertThreshold}
                onValueChange={setAlertThreshold}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="#ddd"
                thumbTintColor={theme.colors.primary}
              />
              <Text variant="bodySmall">100%</Text>
            </View>
            <Text variant="bodySmall" style={styles.helperText}>
              Get notified when you reach this percentage of your budget
            </Text>

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
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pickerButton: {
    marginBottom: 4,
  },
  input: {
    marginBottom: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  helperText: {
    opacity: 0.6,
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
