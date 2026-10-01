import { Alert, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// "Rate Warmth" prompt. Shown once per device, on the second plan the user
// completes (the first completion already shows the memory/photo coach, and
// a couple that has finished two things together is the one that likes it).
//
// Opens the App Store write-review sheet via the store URL rather than the
// native SKStoreReviewController: expo-store-review is not in build 6, and
// adding it changes the runtime fingerprint, so this version works over OTA.
// Swap to StoreReview.requestReview() when a native build ships with it.
const ASKED_KEY = 'review_asked';
const COUNT_KEY = 'completions_count';
const ASK_AT = 2;
const STORE_URL = process.env.EXPO_PUBLIC_INVITE_URL || '';

export async function maybeAskForReview() {
  if (!STORE_URL) return;
  try {
    if (await SecureStore.getItemAsync(ASKED_KEY)) return;
    const n = parseInt((await SecureStore.getItemAsync(COUNT_KEY)) || '0', 10) + 1;
    await SecureStore.setItemAsync(COUNT_KEY, String(n));
    if (n < ASK_AT) return;
    await SecureStore.setItemAsync(ASKED_KEY, '1');
  } catch {
    return;
  }
  Alert.alert(
    'Enjoying Warmth?',
    'A short rating on the App Store helps other couples find it 💛',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Rate Warmth',
        onPress: () => Linking.openURL(`${STORE_URL}?action=write-review`).catch(() => {}),
      },
    ],
  );
}
