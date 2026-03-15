import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { PlaceInput } from '../components/PlaceInput';
import { PaymentModal } from '../components/PaymentModal';
import { gemstoneApi, paymentsApi, normalizeTime } from '../api/services';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

const PRIORITY_LABELS: Record<number, string> = { 1: 'Primary', 2: 'Secondary', 3: 'Optional' };
const PRIORITY_COLORS: Record<number, string> = { 1: theme.colors.gold, 2: '#9b59b6', 3: '#888' };

function parseBirthPlace(place: string): { city: string; state: string; country: string } {
  const parts = place.split(',').map(p => p.trim());
  return { city: parts[0] || '', state: parts[1] || '', country: parts[2] || '' };
}

export const GemstoneScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthPlace, setBirthPlace] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleAnalyze = () => {
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (pmId: string, _planId: string, amountUsd: number, name: string, email: string) => {
    // Charge the card via backend
    await paymentsApi.chargeForGemstone({
      amountUsd,
      name,
      email,
      paymentMethodId: pmId,
      birthDate,
      birthPlace,
    });

    // Now run the analysis
    const { city, state, country } = parseBirthPlace(birthPlace);
    setShowPayment(false);
    setLoading(true);
    try {
      const data = await gemstoneApi.recommend({
        birthDate,
        birthTime: normalizeTime(birthTime),
        city, state, country,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to get gemstone recommendations.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScreenLayout title="Gemstone Recommendations" subtitle="Based on your birth chart" onBack={() => setResult(null)}>
        {result.chartSummary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>📜 Chart Summary</Text>
            <Text style={styles.cardText}>{result.chartSummary}</Text>
          </View>
        ) : null}

        <View style={styles.primaryCard}>
          <Text style={styles.primaryIcon}>💎</Text>
          <View>
            <Text style={styles.primaryLabel}>Your Primary Gemstone</Text>
            <Text style={styles.primaryName}>{result.primaryGemstone}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>All Recommendations</Text>
        {(result.recommendations ?? []).map((g: any, i: number) => (
          <TouchableOpacity
            key={i}
            style={[styles.gemCard, i === 0 && styles.gemCardPrimary]}
            onPress={() => setExpandedIdx(expandedIdx === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.gemSummary}>
              <View style={[styles.gemAvatar, { backgroundColor: (PRIORITY_COLORS[g.priority] ?? '#888') + '33' }]}>
                <Text style={[styles.gemAvatarText, { color: PRIORITY_COLORS[g.priority] ?? '#888' }]}>
                  {g.gemstoneName?.charAt(0) ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.gemRow}>
                  <Text style={styles.gemName}>{g.gemstoneName}</Text>
                  <View style={[styles.priorityBadge, { borderColor: (PRIORITY_COLORS[g.priority] ?? '#888') + '88', backgroundColor: (PRIORITY_COLORS[g.priority] ?? '#888') + '22' }]}>
                    <Text style={[styles.priorityText, { color: PRIORITY_COLORS[g.priority] ?? '#888' }]}>
                      {PRIORITY_LABELS[g.priority] ?? 'Optional'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.gemMeta}>{g.planet} · {g.metal} · {g.finger}</Text>
              </View>
              <Text style={styles.expandArrow}>{expandedIdx === i ? '▲' : '▼'}</Text>
            </View>

            {expandedIdx === i && (
              <View style={styles.gemDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{g.weight}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Best Day</Text>
                    <Text style={styles.detailValue}>{g.bestDay}</Text>
                  </View>
                </View>
                {g.benefits ? <><Text style={styles.detailLabel}>Benefits</Text><Text style={styles.detailValue}>{g.benefits}</Text></> : null}
                {g.howToWear ? <><Text style={[styles.detailLabel, { marginTop: 8 }]}>How to Wear</Text><Text style={styles.detailValue}>{g.howToWear}</Text></> : null}
                {g.cautions ? (
                  <View style={styles.cautionBox}>
                    <Text style={[styles.detailLabel, { color: '#e67e22' }]}>⚠️ Cautions</Text>
                    <Text style={[styles.detailValue, { color: '#f39c12' }]}>{g.cautions}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {result.generalAdvice ? (
          <View style={styles.generalAdvice}>
            <Text style={styles.cardLabel}>📿 General Advice</Text>
            <Text style={styles.cardText}>{result.generalAdvice}</Text>
          </View>
        ) : null}
        <PrimaryButton label="← Start Over" onPress={() => setResult(null)} style={styles.btn} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Gemstone Engine" subtitle="Chart-based gemstone recommendations" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Analyzing your birth chart…" />}
      <FormField label="Birth Date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1990-06-15" />
      <FormField label="Birth Time (HH:MM)" value={birthTime} onChangeText={setBirthTime} placeholder="06:00" />
      <PlaceInput label="Birth Place" value={birthPlace} onChangeText={setBirthPlace} placeholder="Mumbai, Maharashtra, India" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="💎 Analyze My Chart — $1.99" onPress={handleAnalyze} loading={loading} style={styles.btn} />

      <PaymentModal
        visible={showPayment}
        title="Gemstone Prediction"
        subtitle="Chart-based gemstone analysis powered by Vedic astrology"
        fixedAmountUsd={1.99}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </ScreenLayout>
  );
};


const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 13, marginBottom: 10, letterSpacing: 0.5, marginTop: 4 },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardLabel: { color: '#aad4f5', fontFamily: theme.fonts.bodyBold, fontSize: 12, marginBottom: 6 },
  cardText: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18 },
  primaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    borderRadius: 18, padding: 20, marginBottom: 18,
  },
  primaryIcon: { fontSize: 36 },
  primaryLabel: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  primaryName: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 22, marginTop: 2 },
  gemCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
  },
  gemCardPrimary: { borderColor: 'rgba(255,215,0,0.35)', backgroundColor: 'rgba(255,215,0,0.04)' },
  gemSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  gemAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gemAvatarText: { fontFamily: theme.fonts.bodyBold, fontSize: 16 },
  gemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  gemName: { color: '#fff', fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  gemMeta: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11 },
  priorityBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontFamily: theme.fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  expandArrow: { color: '#666', fontSize: 11 },
  gemDetails: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  detailRow: { flexDirection: 'row', gap: 16, marginVertical: 10 },
  detailItem: { flex: 1 },
  detailLabel: { color: '#888', fontFamily: theme.fonts.body, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 2 },
  detailValue: { color: '#ddd', fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18 },
  cautionBox: { backgroundColor: 'rgba(243,156,18,0.06)', borderRadius: 8, padding: 8, marginTop: 8 },
  generalAdvice: { backgroundColor: 'rgba(46,204,113,0.08)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.25)', borderRadius: 12, padding: 14, marginTop: 8 },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginTop: 8, marginBottom: 24 },
});
