/**
 * streakStore.ts
 *
 * Persists Graha-Gazing streak data using expo-secure-store (already installed).
 * Each planet has: { lastDate: 'YYYY-MM-DD', count: number }
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORE_KEY = 'graha_streaks_v1';

interface StreakEntry {
  lastDate: string; // 'YYYY-MM-DD'
  count: number;
}

interface StreakStore {
  streaks: Record<string, StreakEntry>;
  loaded: boolean;
  loadStreaks: () => Promise<void>;
  addStreak: (planet: string) => Promise<void>;
  getStreak: (planet: string) => number;
  isCompletedToday: (planet: string) => boolean;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export const useStreakStore = create<StreakStore>((set, get) => ({
  streaks: {},
  loaded: false,

  loadStreaks: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) set({ streaks: JSON.parse(raw), loaded: true });
      else      set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addStreak: async (planet) => {
    const existing = get().streaks[planet];
    const t = todayStr();
    if (existing?.lastDate === t) return; // already done today
    const count = existing?.lastDate === yesterdayStr() ? existing.count + 1 : 1;
    const updated = { ...get().streaks, [planet]: { lastDate: t, count } };
    set({ streaks: updated });
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updated));
    } catch {}
  },

  getStreak:       (planet) => get().streaks[planet]?.count ?? 0,
  isCompletedToday: (planet) => get().streaks[planet]?.lastDate === todayStr(),
}));
