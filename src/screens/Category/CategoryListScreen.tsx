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
import { Category, categoryService } from '../../api/categoryService';

export default function CategoryListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch categories
  const fetchCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await categoryService.getCategories();
      if (response.status && response.data) {
        setCategories(response.data);
      }
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
  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await categoryService.deleteCategory(category.id);
              if (response.status) {
                setSnackbarMessage('Category deleted successfully');
                setSnackbarVisible(true);
                fetchCategories(false);
              }
            } catch (error: any) {
              console.error('Error deleting category:', error);
              const errorMessage =
                error.response?.data?.message || 'Failed to delete category';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  // Navigate to add category screen
  const handleAddCategory = () => {
    router.push('/categories/add' as any);
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.categoryInfo}>
          <Text variant="titleMedium">{item.name}</Text>
          <Text variant="bodySmall" style={styles.dateText}>
            Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
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
        keyExtractor={(item) => item.id.toString()}
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
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddCategory}
        label="Add Category"
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
    bottom: 16,
  },
});
