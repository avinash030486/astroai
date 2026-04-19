import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DatePickerField } from '../components/DatePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { muhuratApi } from '../api/services';
import { theme } from '../theme/theme';

const ACTIVITIES = [
  'Marriage','Business Launch','Property Purchase','Travel','Education / Study',
  'Medical Surgery','Investment','Job / Interview','Vehicle Purchase','House Warming',
];

function todayStr(): string { return new Date().toISOString().split('T')[0]; }
function plusDays(d: number): string {
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
}

export const MuhuratScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activityIdx, setActivityIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(plusDays(30));

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    if (!location.trim()) { setError('Please enter a location.'); return; }
    setError(''); setLoading(true);
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const state = parts[1] || '';
    const country = parts[2] || '';
    try {
      const data = await muhuratApi.calculate({
        activityType: ACTIVITIES[activityIdx], city, state, country, fromDate, toDate,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to calculate muhurat.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScreenLayout title="Muhurat" subtitle={`${result.activityType} · ${result.location}`} onBack={() => setResult(null)}>
        <View style={styles.bestCard}>
          <Text style={styles.bestIcon}>⭐</Text>
          <Text style={styles.bestLabel}>Best Muhurat</Text>
          <Text style={styles.bestDate}>{result.bestDate}</Text>
          <Text style={styles.bestTime}>{result.bestTime}</Text>
        </View>
        {result.generalAdvice ? (
          <View style={styles.adviceCard}>
            <Text style={styles.cardLabel}>📿 General Advice</Text>
            <Text style={styles.cardText}>{result.generalAdvice}</Text>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>All Auspicious Windows</Text>
        {(result.windows ?? []).map((w: any, i: number) => (
          <View key={i} style={[styles.windowCard, i === 0 && styles.windowCardTop]}>
            <View style={styles.rankBadge}><Text style={styles.rankText}>#{i+1}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={styles.windowHeader}>
                <Text style={styles.windowDate}>{w.date}</Text>
                <Text style={styles.windowTime}>{w.startTime} – {w.endTime}</Text>
                <Text style={styles.score}>{w.score}/100</Text>
              </View>
              {w.planetarySupport ? <Text style={styles.tag}>🪐 {w.planetarySupport}</Text> : null}
              {w.auspiciousElements ? <Text style={styles.tag}>✨ {w.auspiciousElements}</Text> : null}
              <Text style={styles.windowReason}>{w.reason}</Text>
            </View>
          </View>
        ))}
        <PrimaryButton label="← Recalculate" onPress={() => setResult(null)} style={styles.btn} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Muhurat Calculator" subtitle="Find auspicious timings for important events" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Consulting the stars…" />}

      <Text style={styles.sectionTitle}>Activity Type</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(!showPicker)}>
        <Text style={styles.pickerBtnText}>{ACTIVITIES[activityIdx]}</Text>
        <Text style={styles.pickerArrow}>{showPicker ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles.pickerList}>
          {ACTIVITIES.map((a, i) => (
            <TouchableOpacity
              key={a}
              style={[styles.pickerItem, activityIdx === i && styles.pickerItemSelected]}
              onPress={() => { setActivityIdx(i); setShowPicker(false); }}
            >
              <Text style={[styles.pickerItemText, activityIdx === i && { color: theme.colors.gold }]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <PlaceInput label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Mumbai, Maharashtra, India" />
      <DatePickerField label="From Date" value={fromDate} onChangeText={setFromDate} />
      <DatePickerField label="To Date (max 31 days)" value={toDate} onChangeText={setToDate} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="🔮 Find Auspicious Timings" onPress={calculate} loading={loading} style={styles.btn} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 13, marginBottom: 10, letterSpacing: 0.5, marginTop: 4 },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
    borderRadius: 10, padding: 12, marginBottom: 4,
  },
  pickerBtnText: { color: '#fff', fontFamily: theme.fonts.body, fontSize: 14 },
  pickerArrow: { color: theme.colors.gold, fontSize: 12 },
  pickerList: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    borderRadius: 10, marginBottom: 16, overflow: 'hidden',
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pickerItemSelected: { backgroundColor: 'rgba(255,215,0,0.08)' },
  pickerItemText: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 13 },
  bestCard: {
    backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 14,
  },
  bestIcon: { fontSize: 32, marginBottom: 6 },
  bestLabel: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  bestDate: { color: '#fff', fontFamily: theme.fonts.bodyBold, fontSize: 20, marginBottom: 4 },
  bestTime: { color: '#aad4f5', fontFamily: theme.fonts.body, fontSize: 16 },
  adviceCard: { backgroundColor: 'rgba(155,89,182,0.1)', borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardLabel: { color: '#9b59b6', fontFamily: theme.fonts.bodyBold, fontSize: 12, marginBottom: 6 },
  cardText: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18 },
  windowCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  windowCardTop: { borderColor: 'rgba(255,215,0,0.35)', backgroundColor: 'rgba(255,215,0,0.05)' },
  rankBadge: {
    width: 32, height: 32, borderRadius: 16, flexShrink: 0,
    backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 12 },
  windowHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6, alignItems: 'center' },
  windowDate: { color: '#fff', fontFamily: theme.fonts.bodyBold, fontSize: 13 },
  windowTime: { color: '#aad4f5', fontFamily: theme.fonts.body, fontSize: 12 },
  score: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 11, marginLeft: 'auto' },
  tag: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11, marginBottom: 2 },
  windowReason: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 11, lineHeight: 17, marginTop: 4 },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginTop: 8, marginBottom: 24 },
});
