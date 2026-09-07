import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

export interface CreditTransaction {
  id: string;
  amount_usd: number;
  type: 'referral_reward' | 'referral_signup' | 'spend' | 'manual';
  description: string;
  created_at: string;
}

interface CreditsState {
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  loadCredits: (userId: string) => Promise<void>;
  processReferral: (refereeId: string, code: string) => Promise<void>;
  spendCredits: (userId: string, amountUsd: number, description: string) => Promise<boolean>;
  clear: () => void;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,

  loadCredits: async (userId: string) => {
    set({ loading: true });
    try {
      const token = await SecureStore.getItemAsync('access_token');

      // Load balance
      const balRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}&select=balance_usd`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const balData = await balRes.json();
      const balance = balData?.[0]?.balance_usd ?? 0;

      // Load transactions (latest 30)
      const txRes = await fetch(
        `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=30`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const transactions = await txRes.json();
      set({ balance: parseFloat(balance) || 0, transactions: Array.isArray(transactions) ? transactions : [] });
    } catch (e) {
      console.warn('loadCredits error:', e);
    } finally {
      set({ loading: false });
    }
  },

  processReferral: async (refereeId: string, code: string) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      // 1. Look up the referral row by code
      const refRes = await fetch(
        `${SUPABASE_URL}/rest/v1/referrals?referral_code=eq.${code}&select=referrer_id,reward_paid`,
        {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
        }
      );
      const refData = await refRes.json();
      const referral = refData?.[0];
      if (!referral || referral.reward_paid || referral.referrer_id === refereeId) return;

      // 2. Call Supabase RPC to award credits atomically
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/award_referral_credit`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_referrer_id: referral.referrer_id,
          p_referee_id: refereeId,
          p_referral_code: code,
        }),
      });

      await get().loadCredits(refereeId);
    } catch (e) {
      console.warn('processReferral error:', e);
    }
  },

  spendCredits: async (userId: string, amountUsd: number, description: string): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/spend_credits`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_user_id: userId, p_amount_usd: amountUsd, p_description: description }),
      });
      const result = await res.json();
      if (result === true) {
        await get().loadCredits(userId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clear: () => set({ balance: 0, transactions: [] }),
}));
