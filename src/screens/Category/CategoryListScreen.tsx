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
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';
import { categoryRepository } from '../../database/CategoryRepository';

export default function CategoryListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch categories from local database (master data)
  const fetchCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await categoryRepository.findAll();
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load categories';
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories(false);
  };

  // Handle delete category
  const handleDelete = (category: any) => {
    // Check if it's a locally created category (negative remote_id)
    if (category.remote_id < 0) {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.category_name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Note: Since delete is overridden, we'll need to implement soft delete
                setSnackbarMessage('Local category deletion coming soon');
                setSnackbarVisible(true);
              } catch (error) {
                setSnackbarMessage('Failed to delete category');
                setSnackbarVisible(true);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Cannot Delete',
        'Categories synchronized from the backend cannot be deleted locally.',
        [{ text: 'OK' }]
      );
    }
  };

  // Navigate to add category screen
  const handleAddCategory = () => {
    router.push('/(tabs)/categories/add' as any);
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.categoryInfo}>
          <Text variant="titleMedium">{item.category_name}</Text>
          <Text variant="bodySmall" style={styles.dateText}>
            Synced from backend • {item.type === 1 ? 'Income' : 'Expense'}
          </Text>
        </View>
        <IconButton
          icon="information"
          iconColor={theme.colors.primary}
          size={24}
          onPress={() => handleDelete(item)}
        />
      </Card.Content>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="folder-outline" size={80} iconColor={theme.colors.outline} />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Categories Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Create your first category to start organizing your transactions
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
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item, index) => item?.remote_id?.toString() || `category-${index}`}
        contentContainerStyle={[
          styles.listContent,
          categories.length === 0 && styles.emptyListContent,
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

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={handleAddCategory}
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flex: 1,
  },
  dateText: {
    marginTop: 4,
    opacity: 0.6,
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
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 300,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 50,
    backgroundColor: '#4192d5ff',
    elevation: 4,
    shadowColor: '#8bb0ceff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
