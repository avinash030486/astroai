import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { predictionsApi } from '../api/services';
import { theme } from '../theme/theme';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_EMOJIS: Record<string, string> = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓',
};

export const DailyHoroscopeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    if (!selected) { setError('Please select a zodiac sign.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await predictionsApi.getDailyHoroscope(selected);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch horoscope.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Daily Horoscope" subtitle="Celestial guidance for today" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Reading the stars…" />}
      <Text style={styles.label}>Select Your Sign</Text>
      <View style={styles.grid}>
        {SIGNS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.signTile, selected === s && styles.signTileActive]}
            onPress={() => { setSelected(s); setError(''); }}
          >
            <Text style={styles.signEmoji}>{SIGN_EMOJIS[s]}</Text>
            <Text style={[styles.signName, selected === s && styles.signNameActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Get Horoscope" onPress={fetch} loading={loading} style={styles.btn} />

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{SIGN_EMOJIS[selected]} {selected} · Today</Text>
          {(result.summary || result.prediction) && (
            <Text style={styles.resultText}>{result.summary ?? result.prediction}</Text>
          )}
          {result.luckyNumber !== undefined && (
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>Lucky #{result.luckyNumber}</Text></View>
              {result.luckyColor && <View style={styles.tag}><Text style={styles.tagText}>🎨 {result.luckyColor}</Text></View>}
            </View>
          )}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  label: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  signTile: {
    width: '22%', alignItems: 'center', padding: 10,
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  signTileActive: { borderColor: theme.colors.gold, backgroundColor: 'rgba(201,150,58,0.12)' },
  signEmoji: { fontSize: 20, marginBottom: 4 },
  signName: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 10 },
  signNameActive: { color: theme.colors.gold },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  resultCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim },
  resultTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 12 },
  resultText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 24 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tag: { backgroundColor: 'rgba(201,150,58,0.15)', borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 12 },
});
