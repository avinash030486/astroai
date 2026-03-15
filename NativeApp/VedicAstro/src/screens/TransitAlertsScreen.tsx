import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { transitApi } from '../api/services';
import { theme } from '../theme/theme';

const SIGNS = [
  '♈ Aries','♉ Taurus','♊ Gemini','♋ Cancer','♌ Leo','♍ Virgo',
  '♎ Libra','♏ Scorpio','♐ Sagittarius','♑ Capricorn','♒ Aquarius','♓ Pisces',
];
const SIGN_NAMES = SIGNS.map(s => s.split(' ')[1]);

const INTENSITY_COLORS: Record<string, string> = {
  High: '#E74C3C',
  Medium: '#F39C12',
  Low: '#2ECC71',
};

export const TransitAlertsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setError(''); setLoading(true);
    try {
      const data = await transitApi.getAlerts(SIGN_NAMES[selectedIdx]);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch transit alerts.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScreenLayout
        title="Transit Alerts"
        subtitle={`${SIGNS[selectedIdx]} · Current Transits`}
        onBack={() => setResult(null)}
      >
        <View style={styles.themeCard}>
          <Text style={styles.cardLabel}>✨ Overall Theme</Text>
          <Text style={styles.cardText}>{result.overallTheme}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.insightCard, { borderColor: '#2ECC71' + '55', flex: 1, marginRight: 6 }]}>
            <Text style={[styles.insightTitle, { color: '#2ECC71' }]}>🌟 Opportunities</Text>
            <Text style={styles.insightText}>{result.keyOpportunities}</Text>
          </View>
          <View style={[styles.insightCard, { borderColor: '#E74C3C' + '55', flex: 1, marginLeft: 6 }]}>
            <Text style={[styles.insightTitle, { color: '#E74C3C' }]}>⚠️ Challenges</Text>
            <Text style={styles.insightText}>{result.keyChallenges}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Planetary Transits</Text>
        {(result.transits ?? []).map((t: any, i: number) => (
          <View key={i} style={styles.transitCard}>
            <View style={styles.transitHeader}>
              <Text style={styles.planetName}>{t.planet}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.transitSign}>{t.transitSign}</Text>
              <View style={[styles.intensityBadge, { backgroundColor: (INTENSITY_COLORS[t.intensity] ?? '#888') + '33', borderColor: (INTENSITY_COLORS[t.intensity] ?? '#888') + '88' }]}>
                <Text style={[styles.intensityText, { color: INTENSITY_COLORS[t.intensity] ?? '#888' }]}>{t.intensity}</Text>
              </View>
            </View>
            <Text style={styles.transitEffect}>{t.effect}</Text>
            <Text style={styles.transitDuration}>⏳ {t.duration}</Text>
            <View style={styles.adviceRow}>
              <Text style={styles.adviceIcon}>💡</Text>
              <Text style={styles.adviceText}>{t.advice}</Text>
            </View>
          </View>
        ))}
        <PrimaryButton label="← Check Another Sign" onPress={() => setResult(null)} style={styles.btn} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Transit Alerts" subtitle="Planetary transits for your zodiac sign" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Analyzing transits…" />}
      <Text style={styles.sectionTitle}>Select Your Zodiac Sign</Text>
      <View style={styles.signsGrid}>
        {SIGNS.map((s, i) => (
          <TouchableOpacity
            key={s}
            style={[styles.signTile, selectedIdx === i && styles.signTileSelected]}
            onPress={() => setSelectedIdx(i)}
            activeOpacity={0.75}
          >
            <Text style={styles.signEmoji}>{s.split(' ')[0]}</Text>
            <Text style={styles.signName}>{s.split(' ')[1]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="🔭 Get Transit Alerts" onPress={fetchAlerts} loading={loading} style={styles.btn} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 12, letterSpacing: 0.5 },
  signsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  signTile: {
    width: '22%', borderRadius: 12,
    borderWidth: 1, borderColor: theme.colors.goldDim,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', padding: 10,
  },
  signTileSelected: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: theme.colors.gold },
  signEmoji: { fontSize: 20, marginBottom: 4 },
  signName: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 10, textAlign: 'center' },
  themeCard: {
    backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  cardLabel: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 12, marginBottom: 6 },
  cardText: { color: '#ddd', fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', marginBottom: 16 },
  insightCard: { borderWidth: 1, borderRadius: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  insightTitle: { fontFamily: theme.fonts.bodyBold, fontSize: 11, marginBottom: 6 },
  insightText: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 11, lineHeight: 17 },
  transitCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  transitHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  planetName: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  arrow: { color: '#666' },
  transitSign: { color: '#aad4f5', fontFamily: theme.fonts.body, fontSize: 13 },
  intensityBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto' },
  intensityText: { fontFamily: theme.fonts.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  transitEffect: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  transitDuration: { color: '#888', fontFamily: theme.fonts.body, fontSize: 11, marginBottom: 8 },
  adviceRow: { flexDirection: 'row', gap: 6, backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: 8, padding: 8 },
  adviceIcon: { fontSize: 13 },
  adviceText: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11, lineHeight: 16, flex: 1 },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginTop: 8, marginBottom: 24 },
});
