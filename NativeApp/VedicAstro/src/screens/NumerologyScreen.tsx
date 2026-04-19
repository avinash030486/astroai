import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { DatePickerField } from '../components/DatePickerField';
import { PaymentModal } from '../components/PaymentModal';
import { paymentsApi, numerologyApi } from '../api/services';
import { theme } from '../theme/theme';
import { useCurrency } from '../hooks/useCurrency';

function getNumerologyNumber(name: string): number {
  const pythagorean: Record<string, number> = {
    a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
    j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
    s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8,
  };
  const sum = name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((acc, c) => acc + (pythagorean[c] ?? 0), 0);
  let n = sum;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}

function getLifePathNumber(dob: string): number {
  const digits = dob.replace(/\D/g, '');
  let n = digits.split('').reduce((a, d) => a + parseInt(d), 0);
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}

const NUMBER_MEANINGS: Record<number, string> = {
  1:'Leadership, independence, innovation. You are a pioneer.',
  2:'Harmony, diplomacy, sensitivity. You are a peacemaker.',
  3:'Creativity, communication, joy. You are an artist.',
  4:'Stability, discipline, hard work. You are a builder.',
  5:'Freedom, adventure, change. You are an explorer.',
  6:'Responsibility, nurturing, love. You are a caregiver.',
  7:'Spirituality, wisdom, introspection. You are a seeker.',
  8:'Abundance, authority, success. You are an achiever.',
  9:'Compassion, humanitarianism, completion. You are a healer.',
  11:'Intuition, spiritual insight, illumination. You are a master.',
  22:'Master builder, practical idealism. You achieve great things.',
  33:'Master teacher, compassion, healing. You uplift humanity.',
};

export const NumerologyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { format, ready } = useCurrency();
  const [form, setForm] = useState({ name: '', dateOfBirth: '' });
  const [result, setResult] = useState<{ lifePath: number; nameNumber: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Premium state
  const [showPayment, setShowPayment]     = useState(false);
  const [detailedResult, setDetailedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const calculate = () => {
    if (!form.name.trim() || !form.dateOfBirth.trim()) { setError('Please enter your name and date of birth.'); return; }
    setError(''); setLoading(true);
    setTimeout(() => {
      setResult({ lifePath: getLifePathNumber(form.dateOfBirth), nameNumber: getNumerologyNumber(form.name) });
      setDetailedResult(null);
      setLoading(false);
    }, 600);
  };

  const handlePaymentSuccess = async (pmId: string, _planId: string, amountUsd: number, name: string, email: string) => {
    const res = await paymentsApi.chargeForNumerology({
      amountUsd, name, email, paymentMethodId: pmId,
      birthDate: form.dateOfBirth,
    });
    if (!res.success) throw new Error(res.error ?? 'Payment failed. Please try again.');

    setShowPayment(false);
    setDetailLoading(true);
    setDetailError('');
    try {
      const detail = await numerologyApi.getDetails(form.dateOfBirth);
      setDetailedResult(detail);
    } catch (e: any) {
      setDetailError('Payment succeeded, but details fetch failed. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <ScreenLayout title="Numerology" subtitle="The science of numbers" onBack={() => navigation.goBack()}>
      {(loading || detailLoading) && (
        <LoadingOverlay message={detailLoading ? 'Fetching your cosmic reading…' : 'Calculating your numbers…'} />
      )}
      <FormField label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Your full name" autoCapitalize="words" />
      <DatePickerField label="Date of Birth" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} maximumDate={new Date()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Reveal My Numbers" onPress={calculate} loading={loading} style={styles.btn} />

      {/* ── Free basic result ──────────────────────────────────── */}
      {result && (
        <View>
          <View style={styles.numRow}>
            <View style={styles.numCard}>
              <LinearGradient colors={['#D4A843', theme.colors.gold]} style={styles.numOrb}>
                <Text style={styles.numBig}>{result.lifePath}</Text>
              </LinearGradient>
              <Text style={styles.numLabel}>Life Path</Text>
              <Text style={styles.numMeaning}>{NUMBER_MEANINGS[result.lifePath]}</Text>
            </View>
            <View style={styles.numCard}>
              <LinearGradient colors={[theme.colors.teal, '#18A88E']} style={styles.numOrb}>
                <Text style={styles.numBig}>{result.nameNumber}</Text>
              </LinearGradient>
              <Text style={styles.numLabel}>Destiny Number</Text>
              <Text style={styles.numMeaning}>{NUMBER_MEANINGS[result.nameNumber]}</Text>
            </View>
          </View>

          {/* ── Premium paywall ──────────────────────────────────── */}
          {!detailedResult && (
            <LinearGradient colors={['rgba(201,150,58,0.15)', 'rgba(201,150,58,0.04)']} style={styles.premiumBanner}>
              <Text style={styles.premiumTitle}>✨ Full Cosmic Reading</Text>
              <Text style={styles.premiumSub}>
                Career, love, money predictions, lucky numbers & Vedic remedies
              </Text>
              {detailError ? <Text style={styles.error}>{detailError}</Text> : null}
              <TouchableOpacity style={styles.premiumBtn} onPress={() => setShowPayment(true)}>
                <Text style={styles.premiumBtnText}>{`Unlock Detailed Reading — ${ready ? format(1.99) : '...'}`}</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── Premium detailed result ────────────────────────────── */}
      {detailedResult && (
        <View>
          {detailedResult.soulUrgeNumber && (
            <View style={styles.triRow}>
              {[
                { label: 'Life Path', value: detailedResult.lifePathNumber },
                { label: 'Destiny', value: detailedResult.destinyNumber },
                { label: 'Soul Urge', value: detailedResult.soulUrgeNumber },
              ].map(item => (
                <View key={item.label} style={styles.triTile}>
                  <Text style={styles.triNum}>{item.value}</Text>
                  <Text style={styles.triLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}

          {detailedResult.luckyNumbers?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🍀 Lucky Numbers</Text>
              <Text style={styles.cardText}>{(detailedResult.luckyNumbers as number[]).join('  ·  ')}</Text>
            </View>
          )}

          {detailedResult.careerDirection && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💼 Career Direction</Text>
              <Text style={styles.cardText}>{detailedResult.careerDirection}</Text>
            </View>
          )}

          {detailedResult.lovePrediction && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>❤️ Love & Relationships</Text>
              <Text style={styles.cardText}>{detailedResult.lovePrediction}</Text>
            </View>
          )}

          {detailedResult.moneyPrediction && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💰 Money & Wealth</Text>
              <Text style={styles.cardText}>{detailedResult.moneyPrediction}</Text>
            </View>
          )}

          {detailedResult.remedies?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🙏 Vedic Remedies</Text>
              {(detailedResult.remedies as string[]).map((r, i) => (
                <Text key={i} style={[styles.cardText, { marginBottom: 6 }]}>• {r}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <PaymentModal
        visible={showPayment}
        title="Full Numerology Reading"
        subtitle="Career, love, money insights & Vedic remedies based on your numbers"
        fixedAmountUsd={1.99}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  numRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  numCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, alignItems: 'center' },
  numOrb: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  numBig: { color: theme.colors.navy, fontFamily: theme.fonts.heading, fontSize: 32 },
  numLabel: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  numMeaning: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  // Premium banner
  premiumBanner: { borderRadius: theme.radius.xl, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 16 },
  premiumTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 20, marginBottom: 6 },
  premiumSub: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  premiumBtn: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingVertical: 10, paddingHorizontal: 24 },
  premiumBtnText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  // Detailed result
  triRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  triTile: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.goldDim, alignItems: 'center' },
  triNum: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 28, marginBottom: 4 },
  triLabel: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 18, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 14 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 17, marginBottom: 10 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
});
