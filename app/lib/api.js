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

  // Health (includes backend version)
  health: () => request('/health'),
};
