import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const DEFAULT_TIMEOUT_MS = 20000; // 20 seconds

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); },
    );
  });
}

export async function apiGet<T>(endpoint: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await withTimeout(
    fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers }),
    timeoutMs,
  );
  if (!response.ok) throw new Error(`API Error ${response.status}: ${await response.text()}`);
  return response.json();
}

export async function apiPost<T>(endpoint: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await withTimeout(
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    timeoutMs,
  );
  if (!response.ok) throw new Error(`API Error ${response.status}: ${await response.text()}`);
  return response.json();
}
