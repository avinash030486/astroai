import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { useProfileAutofill } from '../hooks/useProfileAutofill';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { predictionsApi } from '../api/services';
import { theme } from '../theme/theme';
import { detectYogasFromServerChart, LocalYoga } from '../hooks/useLocalYogas';

export const YogasScreen: React.FC = () => {
  const navigation = useNavigation();
  const { autofill } = useProfileAutofill();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [result, setResult] = useState<any>(null);
  const [localYogas, setLocalYogas] = useState<LocalYoga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiNote, setApiNote] = useState('');  // soft note when API fails but local yogas exist

  useEffect(() => {
    if (autofill.dateOfBirth || autofill.name) {
      setForm(f => ({
        name:         autofill.name        || f.name,
        dateOfBirth:  autofill.dateOfBirth  || f.dateOfBirth,
        timeOfBirth:  autofill.timeOfBirth  || f.timeOfBirth,
        placeOfBirth: autofill.placeOfBirth || f.placeOfBirth,
      }));
    }
  }, [autofill.dateOfBirth, autofill.name]);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchYogas = async () => {
    const { name, dateOfBirth, timeOfBirth, placeOfBirth } = form;
    if (!dateOfBirth || !timeOfBirth || !placeOfBirth) { setError('Please fill all fields.'); return; }
    setError('');
    setApiNote('');
    setResult(null);
    setLocalYogas([]);
    setLoading(true);

    let chart: any = null;

    // Step 1 — Fetch accurate natal chart from Swiss Ephemeris (server)
    try {
      chart = await predictionsApi.fetchBirthChart({ name: name || 'Seeker', dateOfBirth, timeOfBirth, placeOfBirth });
      // Detect yogas from accurate server planet positions (sign + house both known)
      const planets: any[] = chart?.planets ?? [];
      const computed = detectYogasFromServerChart(planets);
      setLocalYogas(computed);
    } catch {
      setError('Could not reach server. Check your connection and try again.');
      setLoading(false);
      return;
    }

    // Step 2 — Fire GPT prediction using the already-fetched chart (no duplicate call)
    try {
      const data = await predictionsApi.generateDetailedPredictionFromChart(chart);
      setApiNote('');
      setResult(data);
    } catch {
      // GPT timed out — chart yogas already shown accurately above
      setApiNote('AI enrichment timed out — classically detected yogas are shown below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Yogas" subtitle="Auspicious planetary combinations" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Calculating yogas… AI analysis can take up to 30 seconds ✨" />}
      <FormField label="Your Name" value={form.name} onChangeText={set('name')} placeholder="Optional" />
      <DatePickerField label="Date of Birth" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} maximumDate={new Date()} />
      <TimePickerField label="Time of Birth" value={form.timeOfBirth} onChangeText={set('timeOfBirth')} />
      <PlaceInput label="Place of Birth" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} placeholder="Delhi, India" />
      {error   ? <Text style={styles.error}>{error}</Text>     : null}
      {apiNote ? <Text style={styles.apiNote}>{apiNote}</Text> : null}
      <PrimaryButton label="Reveal Yogas" onPress={fetchYogas} loading={loading} style={styles.btn} />

      {/* ── Classically detected yogas (offline, always shown) ── */}
      {localYogas.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>🔭 Classically Detected Yogas</Text>
          {localYogas.map((y, i) => (
            <View
              key={i}
              style={[
                styles.yogaCard,
                { borderColor: y.category === 'beneficial' ? theme.colors.teal : '#FF6B6B' },
              ]}
            >
              <View style={styles.yogaHeader}>
                <Text style={styles.yogaName}>{y.name}</Text>
                <Text
                  style={[
                    styles.badge,
                    y.category === 'beneficial'
                      ? { backgroundColor: theme.colors.teal + '33', color: theme.colors.teal }
                      : { backgroundColor: '#FF6B6B33', color: '#FF6B6B' },
                  ]}
                >
                  {y.category === 'beneficial' ? '✦ Beneficial' : '⚠ Malefic'}
                </Text>
              </View>
              <Text style={styles.yogaDesc}>{y.description}</Text>
              {y.confidence === 'medium' && (
                <Text style={styles.confidenceNote}>
                  📍 Confirm house position with full chart analysis for exact strength
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── AI-enriched analysis from server ── */}
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
  error:   { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  apiNote: { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 12, marginBottom: 10, opacity: 0.8 },
  btn: { marginBottom: 24 },
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 16, marginBottom: 12, marginTop: 8 },
  yogaCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12 },
  yogaHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 6 },
  yogaName: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 15, marginBottom: 6, flex: 1 },
  yogaDesc: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 20 },
  yogaEffect: { color: theme.colors.teal, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 6 },
  badge: { fontSize: 11, fontFamily: theme.fonts.body, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' as const },
  confidenceNote: { color: theme.colors.textSecondary ?? '#aaa', fontFamily: theme.fonts.body, fontSize: 11, marginTop: 8, fontStyle: 'italic' as const },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 12 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 8 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 21 },
  remedyText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 22 },
});
