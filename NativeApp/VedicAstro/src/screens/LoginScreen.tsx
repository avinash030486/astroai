import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StarField } from '../components/StarField';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuthStore();

  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
      <StarField />
      <View style={styles.center}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoOrb}>
            <Text style={styles.logoIcon}>☽</Text>
          </View>
          <Text style={styles.appName}>VedicAstro AI</Text>
          <Text style={styles.tagline}>Ancient Wisdom · Modern Guidance</Text>
        </View>

        {/* Sign-in card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardSub}>Sign in to begin your cosmic journey</Text>

          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={signInWithGoogle}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <Text style={styles.googleBtnIcon}>G</Text>
            )}
            <Text style={styles.googleBtnText}>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footNote}>Your cosmic journey begins here</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  logoWrap: { alignItems: 'center', marginBottom: 44 },
  logoOrb: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(201,150,58,0.15)',
    borderWidth: 1.5, borderColor: theme.colors.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoIcon: { fontSize: 40, color: theme.colors.gold },
  appName: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 30, letterSpacing: 1 },
  tagline: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 6, letterSpacing: 1.2 },
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    alignItems: 'center',
  },
  cardTitle: { color: theme.colors.textPrimary, fontFamily: theme.fonts.heading, fontSize: 22, marginBottom: 6 },
  cardSub: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 28, textAlign: 'center' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff', borderRadius: theme.radius.lg,
    paddingVertical: 14, paddingHorizontal: 24, gap: 12, width: '100%',
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: '#1f1f1f' },
  footNote: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, textAlign: 'center', marginTop: 32, opacity: 0.6, letterSpacing: 1 },
});
