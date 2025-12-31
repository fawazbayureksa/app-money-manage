import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useOfflineAuth } from '../src/context/OfflineAuthContext';

export default function Index() {
  const { isInitialized, isLoading, setupComplete } = useOfflineAuth();
  const theme = useTheme();

  if (isLoading || !isInitialized) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Initializing app...
        </Text>
      </View>
    );
  }

  // Always redirect to tabs - no login required
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
