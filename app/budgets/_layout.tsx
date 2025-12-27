import { Stack } from 'expo-router';

export default function BudgetsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'modal',
          headerTitle: 'Add Budget',
        }}
      />
    </Stack>
  );
}
