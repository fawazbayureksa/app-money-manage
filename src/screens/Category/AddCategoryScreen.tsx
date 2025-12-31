import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { categoryRepository } from '../../database/CategoryRepository';

export default function AddCategoryScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!name.trim()) {
      setError('Category name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters');
      return false;
    }
    if (name.trim().length > 50) {
      setError('Category name must not exceed 50 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await categoryRepository.createLocal({
        category_name: name.trim(),
        description: name.trim(),
      });

      router.back();
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage =
        error.message || 
        'Failed to create category. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
              Add New Category
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Create a local category to organize your transactions
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Category Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              mode="outlined"
              autoCapitalize="words"
              disabled={loading}
              error={!!error}
              left={<TextInput.Icon icon="folder" />}
              style={styles.input}
              placeholder="e.g., Food, Transport, Entertainment"
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

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
                {loading ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  'Create'
                )}
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
  scrollContent: {
    padding: 16,
    justifyContent: 'center',
    minHeight: '100%',
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
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
  input: {
    marginBottom: 4,
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
