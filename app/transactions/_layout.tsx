import { Stack } from 'expo-router';
import React from 'react';

export default function TransactionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="Transaction"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Transaction',
          headerShown: false,
          presentation: 'modal',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
