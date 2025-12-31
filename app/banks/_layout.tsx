import { Stack } from 'expo-router';

export default function BanksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Banks',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
