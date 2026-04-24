import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush() {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  let tokenResp;
  try {
    tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
  } catch (err) {
    console.warn('[push] token fetch failed', err?.message);
    return;
  }

  try {
    await api.registerPush(tokenResp.data, Platform.OS);
  } catch (err) {
    console.warn('[push] register failed', err?.message);
  }
}
