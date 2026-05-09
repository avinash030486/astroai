import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { useProfileAutofill } from '../hooks/useProfileAutofill';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { yearlyApi } from '../api/services';
import { theme } from '../theme/theme';

export const YearlyHoroscopeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { autofill } = useProfileAutofill();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '', targetYear: new Date().getFullYear().toString() });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (autofill.dateOfBirth || autofill.name) {
      setForm(f => ({
        ...f,
        name:         autofill.name        || f.name,
        dateOfBirth:  autofill.dateOfBirth  || f.dateOfBirth,
        timeOfBirth:  autofill.timeOfBirth  || f.timeOfBirth,
        placeOfBirth: autofill.placeOfBirth || f.placeOfBirth,
      }));
    }
  }, [autofill.dateOfBirth, autofill.name]);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchYearly = async () => {
    const { name, dateOfBirth, timeOfBirth, placeOfBirth, targetYear } = form;
    if (!dateOfBirth || !placeOfBirth) { setError('Please fill in all required fields.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await yearlyApi.generate({ name: name || 'Seeker', dateOfBirth, timeOfBirth, placeOfBirth, targetYear: parseInt(targetYear) });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate yearly horoscope.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Yearly Horoscope" subtitle="Your cosmic forecast" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Charting your year…" />}
      <FormField label="Your Name" value={form.name} onChangeText={set('name')} placeholder="Optional" />
      <DatePickerField label="Date of Birth" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} maximumDate={new Date()} />
      <TimePickerField label="Time of Birth" value={form.timeOfBirth} onChangeText={set('timeOfBirth')} />
      <PlaceInput label="Place of Birth" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} placeholder="Delhi, India" />
      <FormField label="Target Year" value={form.targetYear} onChangeText={set('targetYear')} placeholder="2025" keyboardType="number-pad" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Generate Yearly Report" onPress={fetchYearly} loading={loading} style={styles.btn} />

      {result && (
        <View>
          {result.overallTheme && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 {result.year ?? form.targetYear} Overview</Text>
              <Text style={styles.cardText}>{result.overallTheme}</Text>
            </View>
          )}
          {result.dashaTransitions && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⏳ Dasha Transitions</Text>
              <Text style={styles.cardText}>{result.dashaTransitions}</Text>
            </View>
          )}
          {result.monthlyHighlights?.map((m: any, i: number) => (
            <View key={i} style={styles.monthCard}>
              <Text style={styles.monthTitle}>{m.monthName ?? `Month ${m.month ?? i + 1}`}</Text>
              {m.careerOutlook && <Text style={styles.monthText}>💼 {m.careerOutlook}</Text>}
              {m.financeOutlook && <Text style={styles.monthText}>💰 {m.financeOutlook}</Text>}
              {m.relationshipOutlook && <Text style={styles.monthText}>❤️ {m.relationshipOutlook}</Text>}
              {m.healthOutlook && <Text style={styles.monthText}>🏥 {m.healthOutlook}</Text>}
              {m.luckyDays && <Text style={[styles.monthText, { color: theme.colors.gold }]}>⭐ Lucky: {m.luckyDays}</Text>}
            </View>
          ))}
          {result.yearlyRemedies?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🪷 Yearly Remedies</Text>
              {result.yearlyRemedies.map((r: string, i: number) => (
                <Text key={i} style={[styles.cardText, { marginBottom: 6 }]}>• {r}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 16 },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 12 },
  cardText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
  monthCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.goldDim + '88', marginBottom: 10 },
  monthTitle: { color: theme.colors.teal, fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 6 },
  monthText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13, lineHeight: 20 },
});
