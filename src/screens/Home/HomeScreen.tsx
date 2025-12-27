import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetAlert, alertService } from '../../api/alertService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recentAlerts, setRecentAlerts] = useState<BudgetAlert[]>([]);

  // Fetch recent alerts
  const fetchRecentAlerts = async () => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await alertService.getAlerts({ unread_only: true });
      if (response.success && response.data) {
        // Get only the 3 most recent alerts
        setRecentAlerts(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentAlerts();
    }, [isAuthenticated])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAlertColor = (percentage: number): string => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    return '#4CAF50';
  };

  const getAlertIcon = (percentage: number): string => {
    if (percentage >= 100) return 'alert-circle';
    if (percentage >= 80) return 'alert';
    return 'information';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Welcome Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16, backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text variant="labelLarge" style={styles.welcomeLabel}>
              Welcome back
            </Text>
            <Text variant="headlineLarge" style={[styles.userName, { color: '#FFF' }]}>
              {user?.username || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.greetingSubtext}>
              Let's manage your finances today 💰
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
              onPress={() => router.push('/alerts' as any)}
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
                style={[styles.alertCard, { borderLeftWidth: 4, borderLeftColor: alertColor }]}
                onPress={() => router.push('/alerts' as any)}
              >
                <Card.Content style={styles.alertContent}>
                  <View style={[styles.alertIcon, { backgroundColor: alertColor + '20' }]}>
                    <IconButton
                      icon={alertIcon}
                      iconColor={alertColor}
                      size={20}
                      style={{ margin: 0 }}
                    />
                  </View>
                  <View style={styles.alertTextContainer}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                      {alert.category_name}
                    </Text>
                    <Text variant="bodySmall" numberOfLines={2} style={{ marginTop: 4 }}>
                      {alert.message}
                    </Text>
                    <View style={styles.alertFooter}>
                      <Text variant="bodySmall" style={[{ color: alertColor, fontWeight: 'bold' }]}>
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

      {/* Quick Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content style={styles.statContent}>
            <IconButton icon="folder" size={32} iconColor="#FFF" style={styles.statIcon} />
            <View style={styles.statTextContainer}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Categories
              </Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                View
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, { backgroundColor: '#2196F3' }]} onPress={() => router.push('/transactions' as any)}>
          <Card.Content style={styles.statContent}>
            <IconButton icon="chart-line" size={32} iconColor="#FFF" style={styles.statIcon} />
            <View style={styles.statTextContainer}>
              <Text variant="labelMedium" style={styles.statLabel}>
                Transactions
              </Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                View
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <Card style={styles.actionCard} onPress={() => router.push('/(tabs)/categories' as any)}>
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
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
                Create and organize your expense categories
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        <Card style={styles.actionCard} onPress={() => router.push('/transactions' as any)}>
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
              <IconButton 
                icon="format-list-bulleted" 
                size={28} 
                iconColor={theme.colors.secondary}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">View Transactions</Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                See all your income and expenses
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        <Card style={styles.actionCard} onPress={() => router.push('/transactions/add' as any)}>
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF5020' }]}>
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

        <Card style={styles.actionCard} onPress={() => router.push('/budgets' as any)}>
          <Card.Content style={styles.actionContent}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
              <IconButton 
                icon="wallet-outline" 
                size={28} 
                iconColor={theme.colors.tertiary}
                style={{ margin: 0 }}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="titleMedium">Set Budget</Text>
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
      </View>

      {/* Getting Started Guide */}
      {/* <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Getting Started
        </Text>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>1</Text>
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyLarge" style={{ fontWeight: '600' }}>Create Categories</Text>
                <Text variant="bodySmall" style={styles.stepDescription}>
                  Set up expense categories like Food, Transport, etc.
                </Text>
              </View>
              <IconButton 
                icon="check-circle" 
                size={24} 
                iconColor="#4CAF50"
              />
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text variant="labelLarge" style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>2</Text>
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyLarge" style={{ fontWeight: '600' }}>Track Transactions</Text>
                <Text variant="bodySmall" style={styles.stepDescription}>
                  Add your daily income and expenses
                </Text>
              </View>
              <IconButton 
                icon="check-circle" 
                size={24} 
                iconColor="#4CAF50"
              />
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Text variant="labelLarge" style={{ color: theme.colors.tertiary, fontWeight: 'bold' }}>3</Text>
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyLarge" style={{ fontWeight: '600' }}>Monitor Budgets</Text>
                <Text variant="bodySmall" style={styles.stepDescription}>
                  Stay on top of your spending goals
                </Text>
              </View>
              <IconButton 
                icon="check-circle" 
                size={24} 
                iconColor="#4CAF50"
              />
            </View>
          </Card.Content>
        </Card>
      </View> */}

      {/* Account Section */}
      <View style={styles.section}>
        <Card style={styles.accountCard}>
          <Card.Content>
            <View style={styles.accountHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>Account</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  welcomeSection: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeLabel: {
    color: '#FFF',
    opacity: 0.85,
    marginBottom: 6,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  greetingSubtext: {
    color: '#FFF',
    opacity: 0.75,
    fontSize: 13,
    marginTop: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    margin: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  statIcon: {
    margin: 0,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    color: '#FFF',
    opacity: 0.9,
    fontSize: 12,
  },
  statValue: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  alertCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 4,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertFooter: {
    marginTop: 8,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepText: {
    flex: 1,
  },
  stepDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  accountCard: {
    borderRadius: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountEmail: {
    opacity: 0.6,
    marginTop: 4,
  },
});
