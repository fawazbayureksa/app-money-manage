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
    IconButton,
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';
import { Bank, bankRepository } from '../../database/BankRepository';
import { syncService } from '../../services/syncService';
import { seedMasterData } from '../../utils/seedData';

export default function BankListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch banks from local database (master data)
  const fetchBanks = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await bankRepository.findAll();
      setBanks(data);
    } catch (error: any) {
      console.error('Error fetching banks:', error);
      setSnackbarMessage('Failed to load banks');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load banks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBanks();
    }, [])
  );

  // Handle pull to refresh (triggers sync)
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Try to sync banks from backend
      const results = await syncService.syncAll();
      const successCount = results.filter(r => r.success).length;
      
      if (successCount === 0) {
        // If sync failed, seed local data
        console.log('📥 Sync failed, seeding local data...');
        await seedMasterData();
        setSnackbarMessage('Using local sample data');
      } else {
        setSnackbarMessage('Banks synced successfully');
      }
      setSnackbarVisible(true);
    } catch (error) {
      console.log('⚠️  Sync error, seeding local data...');
      try {
        await seedMasterData();
        setSnackbarMessage('Using local sample data');
        setSnackbarVisible(true);
      } catch (seedError) {
        console.error('Failed to seed data:', seedError);
      }
    }
    await fetchBanks(false);
  };

  // Banks are master data - cannot be deleted locally
  const handleInfo = () => {
    Alert.alert(
      'Master Data',
      'Banks are synchronized from the backend. They are read-only on the mobile app.',
      [{ text: 'OK' }]
    );
  };

  // Render bank item
  const renderBankItem = ({ item }: { item: Bank }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.bankInfo}>
          <View style={styles.bankHeader}>
            {item.color && (
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: item.color || theme.colors.primary },
                ]}
              />
            )}
            <Text variant="titleMedium" style={styles.bankName}>
              {item.bank_name}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.syncInfo}>
            {item.last_synced_at
              ? `Synced ${new Date(item.last_synced_at).toLocaleDateString()}`
              : 'Not synced yet'}
          </Text>
        </View>
        <IconButton
          icon="information"
          iconColor={theme.colors.primary}
          size={24}
          onPress={handleInfo}
        />
      </Card.Content>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="bank" size={80} iconColor={theme.colors.outline} />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Banks Yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Pull down to sync banks from the backend
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
      <View style={styles.infoBar}>
        <IconButton icon="information" size={20} iconColor={theme.colors.primary} />
        <Text variant="bodySmall" style={styles.infoText}>
          Banks are synced from backend (read-only)
        </Text>
      </View>

      <FlatList
        data={banks}
        renderItem={renderBankItem}
        keyExtractor={(item, index) => item?.remote_id?.toString() || `bank-${index}`}
        contentContainerStyle={[
          styles.listContent,
          banks.length === 0 && styles.emptyListContent,
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
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(98, 0, 234, 0.1)',
  },
  infoText: {
    flex: 1,
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 16,
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
  bankInfo: {
    flex: 1,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  bankName: {
    fontWeight: 'bold',
  },
  syncInfo: {
    marginTop: 4,
    marginLeft: 36,
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
});
