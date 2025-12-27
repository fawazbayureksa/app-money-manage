import { Stack } from 'expo-router';

export default function BudgetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '',
      }}
    >
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
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
