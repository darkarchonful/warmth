import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system/legacy';

// Keep the app-icon badge in sync with the in-app unread total. Called after
// every /me so reading plans/memories (which zeroes the server counts) clears
// the icon badge, and cleared outright on logout. Best-effort — never throws
// into a request flow.
export function syncBadge(count) {
  Notifications.setBadgeCountAsync(Math.max(0, count | 0)).catch(() => {});
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://81.200.154.252:3001' : 'https://warmth-api.dbtvault-solutions.tech');

let token = null;

// Registered once by the root layout. Fired when a request that carried a
// session token comes back 401 — i.e. the session is genuinely dead (token
// expired, or the user was deleted server-side). Lets any screen self-heal:
// the handler clears the token and routes to login, so background polls that
// swallow their own errors no longer strand the user on a stale screen.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Latest known OS notification-permission status, set by registerForPush().
// Sent on requests as X-Notif-Permission so the server can record who's
// reachable by push (persisted only on /me). Null until first read.
let notifPermission = null;
export function setNotifPermission(status) {
  notifPermission = status;
}

export async function loadToken() {
  token = await SecureStore.getItemAsync('token');
  return token;
}

export async function saveToken(t) {
  token = t;
  await SecureStore.setItemAsync('token', t);
}

export async function clearToken() {
  token = null;
  await SecureStore.deleteItemAsync('token');
  syncBadge(0);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Report the device timezone so the server can fire scheduled notifications
  // in the user's local time. Persisted server-side only on /me; harmless
  // elsewhere.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) headers['X-Timezone'] = tz;
  } catch {}
  if (notifPermission) headers['X-Notif-Permission'] = notifPermission;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: `HTTP ${res.status}` }; }
  if (!res.ok) {
    // A 401 on a request that carried a token means the session is dead. Fire
    // the global handler (clear token + go to login) BEFORE throwing, so even
    // callers that swallow the error — e.g. the deck's 5s /me poll — still get
    // logged out. Guarded on `token` so failed login attempts (no token yet)
    // don't trigger it, and so it only fires once (clearToken nulls the token).
    if (res.status === 401 && token && onUnauthorized) {
      onUnauthorized();
    }
    // Attach the HTTP status so callers can distinguish a genuine 401 (token
    // invalid -> log out) from a transient network/5xx error (-> retry). Without
    // this, init()/loadMe treat every failure — including a clean 401 — as a
    // connection error and show "Couldn't connect" instead of the login screen.
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.premiumRequired = !!data.premium_required;
    throw err;
  }
  return data;
}

// Build an <Image source> for an API-served image. Couple photos
// (/memories/:id/photo) require the auth header; the public activity art
// (/images/activities/*) ignores it. Passing the header for both is harmless
// and lets callers use one helper everywhere.
export function imageSource(url) {
  if (!url) return null;
  const uri = url.startsWith('http') ? url : `${API_URL}${url}`;
  return token ? { uri, headers: { Authorization: `Bearer ${token}` } } : { uri };
}

// Upload (or replace) a couple's own photo for a memory. Streams the resized
// JPEG file as the raw request body (matches the server's express.raw route).
export async function uploadMemoryPhoto(id, fileUri, width, height) {
  const res = await FileSystem.uploadAsync(`${API_URL}/memories/${id}/photo`, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': 'image/jpeg',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(width ? { 'X-Image-Width': String(width) } : {}),
      ...(height ? { 'X-Image-Height': String(height) } : {}),
    },
  });
  if (res.status < 200 || res.status >= 300) {
    let msg = `Upload failed (${res.status})`;
    try { const j = JSON.parse(res.body); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  try { return JSON.parse(res.body); } catch { return {}; }
}

export const api = {
  // Auth
  authGoogle: (idToken) => request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  }),
  authApple: (identityToken, fullName) => request('/auth/apple', {
    method: 'POST',
    body: JSON.stringify({ identityToken, fullName }),
  }),
  requestEmailCode: (email) => request('/auth/email/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyEmailCode: (email, code) => request('/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),

  // User
  me: async () => {
    const d = await request('/me');
    syncBadge((d.unreadCount || 0) + (d.unreadMemories || 0));
    return d;
  },
  updateName: (name) => request('/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }),
  markIntroSeen: () => request('/me/intro-seen', { method: 'POST' }),
  deleteAccount: () => request('/me', { method: 'DELETE' }),

  // Couple
  createCouple: () => request('/couple/create', { method: 'POST' }),
  joinCouple: (inviteCode) => request('/couple/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  }),
  unpair: () => request('/couple/unpair', { method: 'POST' }),

  // Activities
  nextActivity: () => request('/activities/next'),
  swipe: (activityId, liked) => request(`/activities/${activityId}/swipe`, {
    method: 'POST',
    body: JSON.stringify({ liked }),
  }),
  createCustom: (payload) => request('/activities/custom', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Checklist
  getChecklist: () => request('/checklist'),
  approve: (id) => request(`/checklist/${id}/approve`, { method: 'POST' }),
  complete: (id) => request(`/checklist/${id}/complete`, { method: 'POST' }),
  deleteChecklist: (id) => request(`/checklist/${id}`, { method: 'DELETE' }),
  addCustomSubstep: (id, title, tagline) => request(`/checklist/${id}/custom-substep`, {
    method: 'POST',
    body: JSON.stringify({ title, tagline }),
  }),

  // Memories
  getMemories: () => request('/memories'),
  updateMemory: (id, patch) => request(`/memories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }),
  requestRepeat: (id) => request(`/memories/${id}/repeat`, { method: 'POST' }),
  cancelRepeat: (id) => request(`/memories/${id}/cancel-repeat`, { method: 'POST' }),
  acceptRepeat: (id) => request(`/memories/${id}/accept-repeat`, { method: 'POST' }),
  nudgeSwipe: (id, liked) => request(`/memories/${id}/nudge-swipe`, {
    method: 'POST',
    body: JSON.stringify({ liked }),
  }),
  uploadMemoryPhoto: (id, fileUri, width, height) => uploadMemoryPhoto(id, fileUri, width, height),
  deleteMemoryPhoto: (id) => request(`/memories/${id}/photo`, { method: 'DELETE' }),

  // Comments
  getComments: (parentType, id) => request(`/comments/${parentType}/${id}`),
  addComment: (parentType, id, text) => request(`/comments/${parentType}/${id}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  // Push
  registerPush: (token, platform) => request('/push/register', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  }),

  // Premium (couple-level). Real IAP replaces mockSubscribe at launch.
  premiumStatus: () => request('/premium/status'),
  mockSubscribe: (plan) => request('/premium/mock-subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }),
  mockCancelPremium: () => request('/premium/mock-cancel', { method: 'POST' }),
  restorePremium: () => request('/premium/restore', { method: 'POST' }),

  // Health (includes backend version)
  health: () => request('/health'),
};
