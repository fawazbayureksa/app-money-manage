import { Stack } from 'expo-router';

export default function WalletsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: 'Wallets' }}
      />
      <Stack.Screen
        name="add"
        options={{ headerShown: false, title: 'Add Wallet' }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{ headerShown: false, title: 'Edit Wallet' }}
      />
    </Stack>
  );
}
