import { Stack } from 'expo-router';

export default function BudgetsLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: true,title:"Budgets" }} />
            <Stack.Screen name="add" options={{ title: 'Add Budget', headerShown: true }} />
        </Stack>
    );
}
