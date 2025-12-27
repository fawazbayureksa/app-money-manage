import { useRouter } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Welcome Header */}
      <View style={styles.headerContainer}>
        <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.primary }]} elevation={4}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text variant="labelLarge" style={styles.welcomeLabel}>
                Welcome back
              </Text>
              <Text variant="headlineMedium" style={[styles.userName, { color: theme.colors.onPrimary }]}>
                {user?.username || user?.email?.split('@')[0] || 'User'} 👋
              </Text>
            </View>
            <IconButton
              icon="account-circle"
              size={40}
              iconColor={theme.colors.onPrimary}
              style={styles.avatarButton}
            />
          </View>
        </Surface>
      </View>

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

        <Card style={styles.actionCard} onPress={() => router.push('/categories' as any)}>
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
      <View style={styles.section}>
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
      </View>

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
    marginBottom: 16,
  },
  headerSurface: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 8,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeLabel: {
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  avatarButton: {
    margin: 0,
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
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
