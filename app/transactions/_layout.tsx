import { Stack } from 'expo-router';
import React from 'react';

export default function TransactionsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Transactions',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Transaction',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
