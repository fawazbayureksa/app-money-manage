import { Stack } from 'expo-router';
import React from 'react';

export default function CategoriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Categories',
          headerShown: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Category',
          headerShown: true,
          presentation: 'modal',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
