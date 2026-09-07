import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarField } from '../components/StarField';
import { useAuthStore } from '../store/authStore';
import { useCreditsStore, CreditTransaction } from '../store/creditsStore';
import { useReferral } from '../hooks/useReferral';
import { theme } from '../theme/theme';

const TX_COLORS: Record<string, string> = {
  referral_reward: theme.colors.teal,
  referral_signup: theme.colors.teal,
  spend: theme.colors.error,
  manual: theme.colors.gold,
};

export const CreditsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { balance, transactions, loading, loadCredits } = useCreditsStore();
  const { referralLink, copyLink, shareLink } = useReferral();

  useEffect(() => {
    if (user?.id) loadCredits(user.id);
  }, [user?.id]);

  const renderTx = ({ item, index, data }: { item: CreditTransaction; index: number; data: CreditTransaction[] }) => (
    <View style={[styles.txRow, index < data.length - 1 && styles.txBorder]}>
      <View style={styles.txLeft}>
        <Text style={styles.txSign}>
          {item.amount_usd > 0 ? '↑' : '↓'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc}>{item.description || item.type}</Text>
        <Text style={styles.txDate}>
          {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: TX_COLORS[item.type] ?? theme.colors.gold }]}>
        {item.amount_usd > 0 ? '+' : ''}${Math.abs(item.amount_usd).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
      <StarField />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Credits & Referrals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
      >
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>YOUR CREDIT BALANCE</Text>
          {loading
            ? <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 12 }} />
            : <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          }
          <Text style={styles.balanceSub}>Usable on any paid feature</Text>
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>🎁 Earn Free Credits</Text>
          <View style={styles.howRow}>
            <Text style={styles.howStep}>1.</Text>
            <Text style={styles.howText}>Share your link with a friend</Text>
          </View>
          <View style={styles.howRow}>
            <Text style={styles.howStep}>2.</Text>
            <Text style={styles.howText}>They sign up via your link</Text>
          </View>
          <View style={styles.howRow}>
            <Text style={styles.howStep}>3.</Text>
            <Text style={styles.howText}>
              You get <Text style={styles.howHighlight}>$5.00</Text> · they get <Text style={[styles.howHighlight, { color: theme.colors.teal }]}>$2.00</Text> welcome bonus
            </Text>
          </View>
        </View>

        {/* Referral link */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>YOUR REFERRAL LINK</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={copyLink} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>📋 Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={shareLink} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>↗ Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction history */}
        <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>
        <View style={styles.txCard}>
          {loading ? (
            <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.{'\n'}Invite a friend to earn your first credit!</Text>
          ) : (
            <FlatList
              data={transactions}
              scrollEnabled={false}
              keyExtractor={t => t.id}
              renderItem={({ item, index }) => renderTx({ item, index, data: transactions })}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { color: theme.colors.gold, fontSize: 32, lineHeight: 36 },
  topTitle: {
    color: theme.colors.gold, fontFamily: theme.fonts.heading,
    fontSize: 20, textAlign: 'center',
  },

  balanceCard: {
    backgroundColor: theme.colors.goldPale,
    borderWidth: 1, borderColor: theme.colors.goldDim,
    borderRadius: theme.radius.xl,
    padding: 28, alignItems: 'center', marginBottom: 16,
  },
  balanceLabel: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 11, letterSpacing: 1.5, marginBottom: 10,
  },
  balanceAmount: {
    color: theme.colors.gold, fontFamily: theme.fonts.heading,
    fontSize: 56, lineHeight: 60, marginBottom: 6,
  },
  balanceSub: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12 },

  howCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.xl,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  howTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 12 },
  howRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  howStep: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 13, width: 22 },
  howText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, flex: 1, lineHeight: 19 },
  howHighlight: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold },

  refCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.xl,
    padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  refLabel: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 11, letterSpacing: 1.5, marginBottom: 10,
  },
  linkBox: {
    backgroundColor: theme.colors.w08, borderRadius: theme.radius.md,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: theme.colors.w15,
  },
  linkText: { color: theme.colors.w70, fontFamily: theme.fonts.body, fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1, paddingVertical: 13, borderRadius: theme.radius.md, alignItems: 'center',
    backgroundColor: theme.colors.w08, borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  btnSecondaryText: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  btnPrimary: {
    flex: 1, paddingVertical: 13, borderRadius: theme.radius.md, alignItems: 'center',
    backgroundColor: theme.colors.gold,
  },
  btnPrimaryText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 14 },

  sectionLabel: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 11, letterSpacing: 1.5, marginBottom: 10,
  },
  txCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.xl,
    paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.w08 },
  txLeft: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.w08,
    alignItems: 'center', justifyContent: 'center',
  },
  txSign: { color: theme.colors.textSecondary, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  txDesc: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13 },
  txDate: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 2 },
  txAmount: { fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  emptyText: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 13, textAlign: 'center', paddingVertical: 24, lineHeight: 20,
  },
});
