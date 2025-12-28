import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { alertService } from '@/src/api/alertService';
import AlertBadge from '@/src/components/AlertBadge';

// Custom Add Button Component
function AddButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const primaryColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Pressable
      onPress={() => router.push('/transactions/add' as any)}
      style={[styles.addButton, { backgroundColor: primaryColor }]}
    >
      <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await alertService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="format-list-bulleted" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: '',
          tabBarIcon: () => <AddButton />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-bar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialCommunityIcons name="bell" size={24} color={color} />
              <AlertBadge count={unreadCount} visible={unreadCount > 0} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            // Refresh count when alerts tab is pressed
            fetchUnreadCount();
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20, // Elevate the button above the tab bar
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
