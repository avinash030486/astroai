import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { PlaceInput } from '../components/PlaceInput';
import { remediesApi } from '../api/services';
import { theme } from '../theme/theme';

export const RemediesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '', concern: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchRemedies = async () => {
    const { dateOfBirth, placeOfBirth } = form;
    if (!dateOfBirth || !placeOfBirth) { setError('Date of birth and place are required.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await remediesApi.getPersonalized({ ...form, name: form.name || 'Seeker' });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch remedies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Remedies" subtitle="Vedic solutions for life's challenges" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Finding your remedies…" />}
      <FormField label="Your Name" value={form.name} onChangeText={set('name')} placeholder="Optional" />
      <FormField label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} placeholder="1990-01-15" />
      <FormField label="Time of Birth (HH:MM)" value={form.timeOfBirth} onChangeText={set('timeOfBirth')} placeholder="06:30" />
      <PlaceInput label="Place of Birth" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} placeholder="Delhi, India" />
      <FormField label="Your Concern (optional)" value={form.concern} onChangeText={set('concern')} placeholder="e.g. career, health, relationships…" multiline numberOfLines={3} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Get My Remedies" onPress={fetchRemedies} loading={loading} style={styles.btn} />

      {result && (
        <View>
          {result.chartSummary && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Chart Summary</Text>
              <Text style={styles.cardText}>{result.chartSummary}</Text>
            </View>
          )}
          {result.planetaryRemedyPriority && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🪐 Priority Focus</Text>
              <Text style={styles.cardText}>{result.planetaryRemedyPriority}</Text>
            </View>
          )}
          {result.immediateActions?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ Immediate Actions</Text>
              {result.immediateActions.map((a: string, i: number) => (
                <Text key={i} style={[styles.cardText, { marginBottom: 6 }]}>• {a}</Text>
              ))}
            </View>
          )}
          {[
            ...((result.mantras ?? []) as any[]).map((r: any) => ({ ...r, _c: '🕉️ Mantra' })),
            ...((result.gemstones ?? []) as any[]).map((r: any) => ({ ...r, _c: '💎 Gemstone' })),
            ...((result.fastingDays ?? []) as any[]).map((r: any) => ({ ...r, _c: '🌙 Fasting' })),
            ...((result.rituals ?? []) as any[]).map((r: any) => ({ ...r, _c: '🪔 Ritual' })),
            ...((result.donations ?? []) as any[]).map((r: any) => ({ ...r, _c: '🤲 Donation' })),
            ...((result.lifestyleAdjustments ?? []) as any[]).map((r: any) => ({ ...r, _c: '🌱 Lifestyle' })),
          ].map((r: any, i: number) => (
            <View key={i} style={[styles.remedyCard, { borderLeftColor: i % 2 === 0 ? theme.colors.gold : theme.colors.teal }]}>
              <Text style={styles.remedyTitle}>{r._c}: {r.name}</Text>
              {r.description && <Text style={styles.remedyDesc}>{r.description}</Text>}
              {r.benefit && <Text style={styles.remedyMeta}>✨ {r.benefit}</Text>}
              {r.howToPractice && <Text style={styles.remedyMeta}>📋 {r.howToPractice}</Text>}
              {r.bestTime && <Text style={styles.remedyMeta}>🕐 Best time: {r.bestTime}</Text>}
              {r.frequency && <Text style={styles.remedyMeta}>📅 {r.frequency}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 16, marginBottom: 12 },
  remedyCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16,
    borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12,
    borderLeftWidth: 3,
  },
  remedyTitle: { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 6 },
  remedyDesc: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 20 },
  remedyMeta: { color: theme.colors.teal, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 10 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
});
