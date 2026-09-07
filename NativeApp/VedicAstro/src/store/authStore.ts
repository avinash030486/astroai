import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';
import { useCreditsStore } from './creditsStore';

WebBrowser.maybeCompleteAuthSession();

// ─── PKCE helpers ────────────────────────────────────────────────────────────
function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  bytes.forEach(b => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const randomBytes = Crypto.getRandomBytes(32);
  const verifier = base64UrlEncode(randomBytes);
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const challenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return { verifier, challenge };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  handleOAuthRedirect: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  storePendingReferral: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      const expoUrl = Linking.createURL('/');
      const { verifier, challenge } = await generatePKCE();
      await SecureStore.setItemAsync('pkce_verifier', verifier);

      // Redirect to the HTTPS relay page — Supabase only accepts HTTPS redirect_to.
      // We embed the Expo URL as `expo_url` query param in the redirect_to so the
      // relay page knows where to send the code back. No `state` param — Supabase
      // owns that internally and overwriting it causes bad_oauth_state errors.
      const relay = `https://vedicastro.app/auth-callback?expo_url=${encodeURIComponent(expoUrl)}`;

      const authUrl =
        `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
        `&redirect_to=${encodeURIComponent(relay)}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`;

      // Open full Chrome (Linking.openURL, NOT WebBrowser Custom Tab).
      // The relay page fires an Android Intent URL → Chrome asks "Open with Expo Go?"
      // → Expo Go receives exp://...?code= → App.tsx listener → handleOAuthRedirect.
      await Linking.openURL(authUrl);
      set({ loading: false });
    } catch (e: any) {
      console.error('Google sign in failed:', e.message);
      set({ loading: false });
    }
  },

  handleOAuthRedirect: async (url: string) => {
    try {
      // PKCE code flow — ?code= in query string
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

      if (code) {
        const storedVerifier = await SecureStore.getItemAsync('pkce_verifier');
        await SecureStore.deleteItemAsync('pkce_verifier');

        const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ auth_code: code, code_verifier: storedVerifier }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.msg || tokenData.error_description || 'Token exchange failed');

        await SecureStore.setItemAsync('access_token', tokenData.access_token);
        if (tokenData.refresh_token) await SecureStore.setItemAsync('refresh_token', tokenData.refresh_token);
        const u = tokenData.user;
        const userId = u.id;
        set({
          user: {
            id: userId,
            email: u.email,
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            avatarUrl: u.user_metadata?.avatar_url,
          },
          token: tokenData.access_token,
          loading: false,
        });
        // Process pending referral then load credit balance
        const { processReferral, loadCredits } = useCreditsStore.getState();
        const pendingRef = await SecureStore.getItemAsync('pending_referral_code');
        if (pendingRef) {
          await processReferral(userId, pendingRef);
          await SecureStore.deleteItemAsync('pending_referral_code');
        } else {
          loadCredits(userId);
        }
        return;
      }

      // Implicit flow fallback — #access_token= in fragment
      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      if (!accessToken) throw new Error('Sign in failed — please try again.');

      await SecureStore.setItemAsync('access_token', accessToken);
      const refreshToken = params.get('refresh_token');
      if (refreshToken) await SecureStore.setItemAsync('refresh_token', refreshToken);

      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
      });
      const u = await userRes.json();
      set({
        user: {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
          avatarUrl: u.user_metadata?.avatar_url,
        },
        token: accessToken,
        loading: false,
      });
    } catch (e: any) {
      console.error('OAuth redirect failed:', e.message);
      set({ loading: false });
    }
  },

  signOut: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      }).catch(() => {});
    }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    useCreditsStore.getState().clear();
    set({ user: null, token: null });
  },

  loadSession: async () => {
    set({ loading: true });
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) { set({ loading: false }); return; }
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      if (!res.ok) { await SecureStore.deleteItemAsync('access_token'); set({ loading: false }); return; }
      const u = await res.json();
      const uid = u.id;
      set({
        user: { id: uid, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0], avatarUrl: u.user_metadata?.avatar_url },
        token,
        loading: false,
      });
      useCreditsStore.getState().loadCredits(uid);
    } catch {
      set({ loading: false });
    }
  },

  // Call on app start if a deep-link ref param is detected
  storePendingReferral: async (code: string) => {
    await SecureStore.setItemAsync('pending_referral_code', code);
  },
}));
