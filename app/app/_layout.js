import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { setUnauthorizedHandler, clearToken } from '../lib/api';

export default function RootLayout() {
  const router = useRouter();
  const handled = useRef(new Set());

  // Self-heal dead sessions app-wide: any request that 401s with a token in
  // hand clears the session and drops to login, even from screens whose polls
  // swallow their own errors.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearToken();
      router.replace('/');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    function handleResponse(response) {
      const id = response?.notification?.request?.identifier;
      if (id && handled.current.has(id)) return;
      if (id) handled.current.add(id);
      const route = response?.notification?.request?.content?.data?.route;
      if (route) router.push(route);
    }

    // Defer touching the notifications native module until after the app has
    // mounted. Calling it during the launch window aborts on the New
    // Architecture (iOS SIGABRT in the TurboModule queue).
    let sub;
    const task = InteractionManager.runAfterInteractions(() => {
      Notifications.getLastNotificationResponseAsync().then(r => r && handleResponse(r));
      sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    });

    return () => {
      task.cancel?.();
      sub?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
