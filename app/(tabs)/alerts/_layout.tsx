import { Stack } from 'expo-router';
import React from 'react';

export default function AlertsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Alerts',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
