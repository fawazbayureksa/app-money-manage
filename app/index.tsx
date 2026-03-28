import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useLocalSearchParams<{
    email_sync?: string;
    reason?: string;
  }>();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (params.email_sync) {
      return (
        <Redirect
          href={{
            pathname: "/(tabs)/alerts",
            params: {
              email_sync: params.email_sync,
              ...(params.reason ? { reason: params.reason } : {}),
            },
          }}
        />
      );
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
