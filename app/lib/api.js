import * as SecureStore from 'expo-secure-store';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://81.200.154.252:3001' : 'https://warmth-api.dbtvault-solutions.tech');

let token = null;

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
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: `HTTP ${res.status}` }; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  authGoogle: (idToken) => request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  }),

  // User
  me: () => request('/me'),

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

  // Checklist
  getChecklist: () => request('/checklist'),
  approve: (id) => request(`/checklist/${id}/approve`, { method: 'POST' }),
  complete: (id) => request(`/checklist/${id}/complete`, { method: 'POST' }),

  // Memories
  getMemories: () => request('/memories'),

  // Health (includes backend version)
  health: () => request('/health'),
};
