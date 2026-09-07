import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../components/ScreenLayout';
import { useProfileAutofill } from '../hooks/useProfileAutofill';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PaymentModal } from '../components/PaymentModal';
import { matchmakingApi, paymentsApi, normalizeTime } from '../api/services';
import { theme } from '../theme/theme';
import { useCurrency } from '../hooks/useCurrency';

const ScoreBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 100 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 70 ? theme.colors.teal : pct >= 40 ? theme.colors.gold : '#e74c3c';
  return (
    <View style={scoreStyles.wrap}>
      <View style={scoreStyles.header}>
        <Text style={scoreStyles.label}>{label}</Text>
        <Text style={[scoreStyles.value, { color }]}>{value}</Text>
      </View>
      <View style={scoreStyles.track}>
        <View style={[scoreStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};
const scoreStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12 },
  value: { fontFamily: theme.fonts.bodyBold, fontSize: 13 },
  track: { height: 6, backgroundColor: theme.colors.cardAlt, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

export const MatchmakingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { format, ready } = useCurrency();
  const { autofill } = useProfileAutofill();
  const [p1, setP1] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [p2, setP2] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [result, setResult] = useState<any>(null);

  // Pre-fill Person 1 from saved profile
  useEffect(() => {
    if (autofill.dateOfBirth || autofill.name) {
      setP1(f => ({
        name:         autofill.name        || f.name,
        dateOfBirth:  autofill.dateOfBirth  || f.dateOfBirth,
        timeOfBirth:  autofill.timeOfBirth  || f.timeOfBirth,
        placeOfBirth: autofill.placeOfBirth || f.placeOfBirth,
      }));
    }
  }, [autofill.dateOfBirth, autofill.name]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPayment, setShowPayment] = useState(false);

  const setP = (who: 'p1' | 'p2', k: string) => (v: string) => who === 'p1' ? setP1(f => ({ ...f, [k]: v })) : setP2(f => ({ ...f, [k]: v }));

  const handleAnalyze = () => {
    if (!p1.dateOfBirth || !p2.dateOfBirth) { setError('Both birth dates are required.'); return; }
    setError('');
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (pmId: string, _planId: string, amountUsd: number, name: string, email: string) => {
    if (Platform.OS !== 'android' && pmId !== 'credits_only') {
      const chargeRes = await paymentsApi.chargeForMatchmaking({
        amountUsd, name, email, paymentMethodId: pmId,
        person1Name: p1.name || 'Person 1',
        person1BirthDate: p1.dateOfBirth,
        person1BirthTime: normalizeTime(p1.timeOfBirth),
        person1BirthPlace: p1.placeOfBirth,
        person2Name: p2.name || 'Person 2',
        person2BirthDate: p2.dateOfBirth,
        person2BirthTime: normalizeTime(p2.timeOfBirth),
        person2BirthPlace: p2.placeOfBirth,
      });
      if (!chargeRes.success) throw new Error(chargeRes.error ?? 'Payment failed. Please try again.');
    }

    setShowPayment(false);
    setLoading(true);
    try {
      const data = await matchmakingApi.analyze({
        person1: { ...p1, name: p1.name || 'Person 1' },
        person2: { ...p2, name: p2.name || 'Person 2' },
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze compatibility.');
    } finally {
      setLoading(false);
    }
  };

  const totalScore = result?.overallScore ?? result?.totalScore ?? result?.gunaScore ?? result?.compatibility ?? null;

  return (
    <ScreenLayout title="Matchmaking" subtitle="Kundali Milan · Compatibility Analysis" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Matching the charts…" />}

      <View style={styles.personSection}>
        <Text style={styles.personLabel}>❤️ Person 1</Text>
        <FormField label="Name" value={p1.name} onChangeText={setP('p1','name')} placeholder="Name" />
        <DatePickerField label="Date of Birth" value={p1.dateOfBirth} onChangeText={setP('p1','dateOfBirth')} maximumDate={new Date()} />
        <TimePickerField label="Time of Birth" value={p1.timeOfBirth} onChangeText={setP('p1','timeOfBirth')} />
        <FormField label="Place of Birth" value={p1.placeOfBirth} onChangeText={setP('p1','placeOfBirth')} placeholder="Delhi, India" />
      </View>

      <View style={styles.divider}><Text style={styles.dividerText}>💫 Match with</Text></View>

      <View style={styles.personSection}>
        <Text style={styles.personLabel}>💙 Person 2</Text>
        <FormField label="Name" value={p2.name} onChangeText={setP('p2','name')} placeholder="Name" />
        <DatePickerField label="Date of Birth" value={p2.dateOfBirth} onChangeText={setP('p2','dateOfBirth')} maximumDate={new Date()} />
        <TimePickerField label="Time of Birth" value={p2.timeOfBirth} onChangeText={setP('p2','timeOfBirth')} />
        <FormField label="Place of Birth" value={p2.placeOfBirth} onChangeText={setP('p2','placeOfBirth')} placeholder="Mumbai, India" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={`Analyze Compatibility — ${ready ? format(1.99) : '...'}`} onPress={handleAnalyze} loading={loading} style={styles.btn} />

      {result && (
        <View>
          {totalScore !== null && (
            <LinearGradient colors={['rgba(201,150,58,0.12)', 'rgba(201,150,58,0.04)']} style={styles.scoreCard}>
              <Text style={styles.scoreTitle}>Compatibility Score</Text>
              <Text style={styles.scoreBig}>{totalScore}<Text style={styles.scoreOf}>/100</Text></Text>
              <Text style={styles.scoreVerdict}>{totalScore >= 75 ? '✨ Excellent Match' : totalScore >= 50 ? '💛 Good Match' : '⚠️ Needs Work'}</Text>
            </LinearGradient>
          )}
          {(result.kutaBreakdown ?? result.gunas)?.map((g: any, i: number) => (
            <ScoreBar key={i} label={g.name ?? `Kuta ${i + 1}`} value={g.points ?? g.score ?? 0} max={g.maxPoints ?? g.max ?? 8} />
          ))}
          {(result.synastryAnalysis || result.analysis) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔮 Analysis</Text>
              <Text style={styles.cardText}>{result.synastryAnalysis ?? result.analysis}</Text>
            </View>
          )}
          {result.strengths?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✅ Strengths</Text>
              {result.strengths.map((s: string, i: number) => (
                <Text key={i} style={styles.cardText}>• {s}</Text>
              ))}
            </View>
          )}
          {result.recommendations?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💡 Recommendations</Text>
              {result.recommendations.map((r: string, i: number) => (
                <Text key={i} style={styles.cardText}>• {r}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <PaymentModal
        visible={showPayment}
        title="Unlock Compatibility Analysis"
        subtitle="Get your full Kundali Milan with Kuta scoring, synastry & recommendations"
        fixedAmountUsd={1.99}
        googlePlayProductId="matchmaking_analysis"
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  personSection: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12 },
  personLabel: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 12 },
  divider: { alignItems: 'center', marginVertical: 8 },
  dividerText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13 },
  error: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginVertical: 16 },
  scoreCard: { borderRadius: theme.radius.xl, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 20 },
  scoreTitle: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  scoreBig: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 56 },
  scoreOf: { fontSize: 24, color: theme.colors.textSecondary },
  scoreVerdict: { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 15, marginTop: 4 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim, marginTop: 12 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 10 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
});
