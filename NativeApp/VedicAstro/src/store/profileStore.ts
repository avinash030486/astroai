import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

export interface NativeUserProfile {
  id: string;
  email?: string;
  full_name?: string;
  date_of_birth?: string;    // 'YYYY-MM-DD'
  time_of_birth?: string;    // 'HH:MM'
  birth_place_label?: string;
  updated_at?: string;
}

interface ProfileState {
  profile: NativeUserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string;
  loadProfile: (userId: string, userEmail?: string, userName?: string) => Promise<void>;
  updateProfile: (updates: Partial<NativeUserProfile>) => Promise<boolean>;
  clearProfile: () => void;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('access_token');
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  saving: false,
  error: '',

  loadProfile: async (userId, userEmail, userName) => {
    set({ loading: true, error: '' });
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        { headers },
      );
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const rows: NativeUserProfile[] = await res.json();

      if (rows.length > 0) {
        set({ profile: rows[0] });
      } else {
        // Row doesn't exist yet — create it
        const newProfile: NativeUserProfile = {
          id: userId,
          email: userEmail,
          full_name: userName,
          updated_at: new Date().toISOString(),
        };
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(newProfile),
        });
        if (insertRes.ok) {
          const created: NativeUserProfile[] = await insertRes.json();
          set({ profile: created[0] ?? newProfile });
        } else {
          // Insert failed (e.g. row created by another tab) — try reading again
          set({ profile: newProfile });
        }
      }
    } catch (e: any) {
      set({ error: e.message || 'Failed to load profile' });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile?.id) return false;
    set({ saving: true, error: '' });
    try {
      const headers = await getAuthHeaders();
      const payload: Partial<NativeUserProfile> = {
        ...updates,
        id: profile.id,
        updated_at: new Date().toISOString(),
      };
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(`Failed to save profile (${res.status})`);
      set(s => ({ profile: s.profile ? { ...s.profile, ...updates } : s.profile }));
      return true;
    } catch (e: any) {
      set({ error: e.message || 'Failed to save profile' });
      return false;
    } finally {
      set({ saving: false });
    }
  },

  clearProfile: () => set({ profile: null, error: '' }),
}));
