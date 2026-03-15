import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers });
  if (!response.ok) throw new Error(`API Error ${response.status}: ${await response.text()}`);
  return response.json();
}

export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API Error ${response.status}: ${await response.text()}`);
  return response.json();
}
