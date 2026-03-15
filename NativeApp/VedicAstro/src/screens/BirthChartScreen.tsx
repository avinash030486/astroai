import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { PlaceInput } from '../components/PlaceInput';
import { PaymentModal, PlanOption } from '../components/PaymentModal';
import { predictionsApi, paymentsApi, normalizeTime } from '../api/services';
import { theme } from '../theme/theme';

const PREMIUM_PLANS: PlanOption[] = [
  { id: 'one-time', label: 'One Time', price: '$3.99', amountUsd: 3.99, note: 'Single detailed report' },
  { id: 'weekly',   label: 'Weekly',   price: '$2.99', amountUsd: 2.99, note: 'Unlimited for a week', popular: true },
  { id: 'monthly',  label: 'Monthly',  price: '$5.99', amountUsd: 5.99, note: 'Unlimited for a month' },
];

export const BirthChartScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Premium prediction state
  const [showPremium, setShowPremium]       = useState(false);
  const [premiumResult, setPremiumResult]   = useState<any>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError]     = useState('');

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchChart = async () => {
    const { dateOfBirth, timeOfBirth, placeOfBirth } = form;
    if (!dateOfBirth || !timeOfBirth || !placeOfBirth) { setError('Please fill all required fields.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await predictionsApi.generateBasicChartPrediction({ name: form.name || 'Seeker', dateOfBirth, timeOfBirth, placeOfBirth });
      setResult(data);
      setPremiumResult(null);
    } catch (e: any) {
      setError(e.message || 'Failed to generate birth chart.');
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumSuccess = async (pmId: string, planId: string, amountUsd: number, name: string, email: string) => {
    const chargeRes = await paymentsApi.chargeForPremium({
      plan: planId, amountUsd, name, email, paymentMethodId: pmId,
      dateOfBirth: form.dateOfBirth,
      timeOfBirth: normalizeTime(form.timeOfBirth),
      placeOfBirth: form.placeOfBirth,
    });
    if (!chargeRes.success) throw new Error(chargeRes.error ?? 'Payment failed. Please try again.');
    // Close modal and fetch detailed prediction
    setShowPremium(false);
    setPremiumLoading(true);
    setPremiumError('');
    try {
      const detail = await predictionsApi.generateDetailedPrediction({
        name: form.name || 'Seeker',
        dateOfBirth: form.dateOfBirth,
        timeOfBirth: form.timeOfBirth,
        placeOfBirth: form.placeOfBirth,
      });
      setPremiumResult(detail);
    } catch (e: any) {
      setPremiumError('Payment succeeded, but prediction fetch failed. Please try again.');
    } finally {
      setPremiumLoading(false);
    }
  };

  return (
    <ScreenLayout title="Birth Chart" subtitle="Your natal Kundali" onBack={() => navigation.goBack()}>
      {(loading || premiumLoading) && (
        <LoadingOverlay message={premiumLoading ? 'Generating premium prediction…' : 'Drawing your Kundali…'} />
      )}

      <FormField label="Your Name" value={form.name} onChangeText={set('name')} placeholder="Optional" />
      <FormField label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} placeholder="1990-01-15" />
      <FormField label="Time of Birth (HH:MM)" value={form.timeOfBirth} onChangeText={set('timeOfBirth')} placeholder="06:30" />
      <PlaceInput label="Place of Birth" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} placeholder="Delhi, India" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Generate Birth Chart" onPress={fetchChart} loading={loading} style={styles.btn} />

      {/* ── Basic chart result ─────────────────────────────────────────── */}
      {result && (
        <View>
          <View style={styles.infoRow}>
            {result.ascendantSummary && (
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Ascendant</Text>
                <Text style={styles.infoValue}>{(result.ascendantSummary as string).split(' ')[0]}</Text>
              </View>
            )}
            {result.currentDasha && (
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Maha Dasha</Text>
                <Text style={styles.infoValue}>{result.currentDasha}</Text>
              </View>
            )}
            {result.currentAntarDasha && (
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Antar Dasha</Text>
                <Text style={styles.infoValue}>{result.currentAntarDasha}</Text>
              </View>
            )}
          </View>
          {result.narrative && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔮 Chart Reading</Text>
              <Text style={styles.cardText}>{result.narrative}</Text>
            </View>
          )}
          {(result.dashaEffects || result.antarEffects) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⏳ Dasha Effects</Text>
              {result.dashaEffects && <Text style={styles.cardText}>Maha: {result.dashaEffects}</Text>}
              {result.antarEffects && <Text style={[styles.cardText, { marginTop: 8 }]}>Antar: {result.antarEffects}</Text>}
            </View>
          )}
          {result.planetaryHighlights?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🪐 Planetary Highlights</Text>
              {result.planetaryHighlights.map((h: string, i: number) => (
                <Text key={i} style={[styles.cardText, { marginBottom: 6 }]}>• {h}</Text>
              ))}
            </View>
          )}

          {/* ── Premium paywall banner ──────────────────────────────────── */}
          {!premiumResult && (
            <LinearGradient colors={['rgba(201,150,58,0.15)', 'rgba(201,150,58,0.04)']} style={styles.premiumBanner}>
              <Text style={styles.premiumTitle}>✨ Premium Detailed Prediction</Text>
              <Text style={styles.premiumSubtitle}>
                Unlock career, finance, relationships, destiny, yogas & remedies
              </Text>
              <TouchableOpacity style={styles.premiumBtn} onPress={() => setShowPremium(true)}>
                <Text style={styles.premiumBtnText}>Unlock from $2.99</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
          {premiumError ? <Text style={styles.error}>{premiumError}</Text> : null}
        </View>
      )}

      {/* ── Premium prediction result ──────────────────────────────────── */}
      {premiumResult && (
        <View>
          <View style={[styles.card, { borderColor: theme.colors.gold }]}>
            <Text style={[styles.cardTitle, { fontSize: 11, letterSpacing: 1, marginBottom: 6 }]}>✨ PREMIUM</Text>
            <Text style={styles.cardTitle}>🌟 Full Prediction</Text>
            {premiumResult.narrative && <Text style={styles.cardText}>{premiumResult.narrative}</Text>}
          </View>
          {premiumResult.career && (
            <View style={styles.card}><Text style={styles.cardTitle}>💼 Career</Text><Text style={styles.cardText}>{premiumResult.career}</Text></View>
          )}
          {premiumResult.finance && (
            <View style={styles.card}><Text style={styles.cardTitle}>💰 Finance</Text><Text style={styles.cardText}>{premiumResult.finance}</Text></View>
          )}
          {premiumResult.relationships && (
            <View style={styles.card}><Text style={styles.cardTitle}>❤️ Relationships</Text><Text style={styles.cardText}>{premiumResult.relationships}</Text></View>
          )}
          {premiumResult.destiny && (
            <View style={styles.card}><Text style={styles.cardTitle}>🎯 Destiny</Text><Text style={styles.cardText}>{premiumResult.destiny}</Text></View>
          )}
          {(premiumResult.goodYogas?.length > 0 || premiumResult.badYogas?.length > 0) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ Yogas</Text>
              {premiumResult.goodYogas?.map((y: string, i: number) => (
                <Text key={i} style={[styles.cardText, { color: theme.colors.teal }]}>✓ {y}</Text>
              ))}
              {premiumResult.badYogas?.map((y: string, i: number) => (
                <Text key={i} style={[styles.cardText, { color: theme.colors.error, marginTop: 4 }]}>⚠ {y}</Text>
              ))}
            </View>
          )}
          {premiumResult.remedies?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🙏 Remedies</Text>
              {premiumResult.remedies.map((r: string, i: number) => (
                <Text key={i} style={[styles.cardText, { marginBottom: 6 }]}>• {r}</Text>
              ))}
            </View>
          )}
          {(premiumResult.jobWindow || premiumResult.marriageWindow) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📅 Key Windows</Text>
              {premiumResult.jobWindow && <Text style={styles.cardText}>Career: {premiumResult.jobWindow}</Text>}
              {premiumResult.marriageWindow && <Text style={[styles.cardText, { marginTop: 6 }]}>Marriage: {premiumResult.marriageWindow}</Text>}
            </View>
          )}
        </View>
      )}

      {/* ── Payment modal ──────────────────────────────────────────────── */}
      <PaymentModal
        visible={showPremium}
        title="Unlock Premium Prediction"
        subtitle="In-depth reading: career, finance, relationships, destiny & yogas"
        plans={PREMIUM_PLANS}
        onSuccess={handlePremiumSuccess}
        onClose={() => setShowPremium(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoTile: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.goldDim, alignItems: 'center' },
  infoLabel: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 16 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 12 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
  // Premium banner
  premiumBanner: { borderRadius: theme.radius.xl, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 20 },
  premiumTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 20, marginBottom: 8, textAlign: 'center' },
  premiumSubtitle: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  premiumBtn: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingVertical: 12, paddingHorizontal: 32 },
  premiumBtnText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
});
