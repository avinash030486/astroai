import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { PlaceInput } from '../components/PlaceInput';
import { predictionsApi } from '../api/services';
import { theme } from '../theme/theme';

export const YogasScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchYogas = async () => {
    const { name, dateOfBirth, timeOfBirth, placeOfBirth } = form;
    if (!dateOfBirth || !timeOfBirth || !placeOfBirth) { setError('Please fill all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await predictionsApi.generateDetailedPrediction({ name: name || 'Seeker', dateOfBirth, timeOfBirth, placeOfBirth });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch yogas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Yogas" subtitle="Auspicious planetary combinations" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Calculating yogas…" />}
      <FormField label="Your Name" value={form.name} onChangeText={set('name')} placeholder="Optional" />
      <FormField label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} placeholder="1990-01-15" />
      <FormField label="Time of Birth (HH:MM)" value={form.timeOfBirth} onChangeText={set('timeOfBirth')} placeholder="06:30" />
      <PlaceInput label="Place of Birth" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} placeholder="Delhi, India" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Reveal Yogas" onPress={fetchYogas} loading={loading} style={styles.btn} />

      {result && (
        <View>
          {/* Yogas Section */}
          {result.yogas && result.yogas.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>✨ Your Yogas</Text>
              {result.yogas.map((y: any, i: number) => (
                <View key={i} style={styles.yogaCard}>
                  <Text style={styles.yogaName}>{y.name ?? `Yoga ${i + 1}`}</Text>
                  {y.description && <Text style={styles.yogaDesc}>{y.description}</Text>}
                  {y.effect && <Text style={styles.yogaEffect}>⭐ Effect: {y.effect}</Text>}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.yogaCard}>
              <Text style={styles.yogaName}>No specific yogas found</Text>
              <Text style={styles.yogaDesc}>No notable yogas were identified in this chart. The chart may still contain important planetary placements.</Text>
            </View>
          )}

          {/* Ascendant & Personality */}
          {result.ascendantSummary ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔮 Ascendant & Personality</Text>
              <Text style={styles.cardText}>{result.ascendantSummary}</Text>
            </View>
          ) : null}

          {/* Career */}
          {result.career ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💼 Career</Text>
              <Text style={styles.cardText}>{result.career}</Text>
            </View>
          ) : null}

          {/* Finance */}
          {result.finance ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💰 Finance</Text>
              <Text style={styles.cardText}>{result.finance}</Text>
            </View>
          ) : null}

          {/* Relationships */}
          {result.relationships ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>❤️ Relationships</Text>
              <Text style={styles.cardText}>{result.relationships}</Text>
            </View>
          ) : null}

          {/* Narrative / Summary */}
          {result.narrative ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📖 Chart Summary</Text>
              <Text style={styles.cardText}>{result.narrative}</Text>
            </View>
          ) : null}

          {/* Dasha Effects */}
          {result.dashaEffects ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🪐 Current Dasha</Text>
              <Text style={styles.cardText}>{result.dashaEffects}</Text>
            </View>
          ) : null}

          {/* Remedies */}
          {result.remedies && result.remedies.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌿 Remedies</Text>
              {result.remedies.map((r: string, i: number) => (
                <Text key={i} style={styles.remedyText}>• {r}</Text>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 16, marginBottom: 12 },
  yogaCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12 },
  yogaName: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 15, marginBottom: 6 },
  yogaDesc: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 20 },
  yogaEffect: { color: theme.colors.teal, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 6 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 8 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 21 },
  remedyText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 22 },
});
