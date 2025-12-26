import { Stack } from 'expo-router';
import React from 'react';

export default function CategoriesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Categories',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Category',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
