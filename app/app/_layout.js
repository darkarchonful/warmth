import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
const colors = { bg: '#FDF6EE' };

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
