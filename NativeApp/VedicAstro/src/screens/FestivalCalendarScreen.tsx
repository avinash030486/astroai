import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { festivalApi } from '../api/services';
import { theme } from '../theme/theme';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const TYPE_ICONS: Record<string, string> = {
  Festival: '🎉', Ekadashi: '🌙', Amavasya: '🌑', Purnima: '🌕',
  Vrat: '🙏', Pradosh: '🕯️', Navratri: '🪔', Jayanti: '⭐',
};
const FILTER_OPTIONS = ['All','Festival','Ekadashi','Amavasya','Purnima','Vrat','Navratri'];

export const FestivalCalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeFilter, setActiveFilter] = useState('All');

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCalendar = async (m: number, y: number) => {
    setLoading(true); setError('');
    try {
      const data = await festivalApi.getCalendar(m, y);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load festival calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCalendar(month, year); }, []);

  const prevMonth = () => {
    const nm = month === 1 ? 12 : month - 1;
    const ny = month === 1 ? year - 1 : year;
    setMonth(nm); setYear(ny);
    loadCalendar(nm, ny);
  };

  const nextMonth = () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    setMonth(nm); setYear(ny);
    loadCalendar(nm, ny);
  };

  const filtered = result?.events?.filter((e: any) =>
    activeFilter === 'All' || e.type === activeFilter
  ) ?? [];

  return (
    <ScreenLayout title="Festival Calendar" subtitle="Hindu festivals & sacred observances" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Loading calendar…" />}

      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, activeFilter === f && styles.pillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {filtered.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🙏</Text>
          <Text style={styles.emptyText}>No {activeFilter !== 'All' ? activeFilter : ''} events this month</Text>
        </View>
      ) : null}

      {filtered.map((e: any, i: number) => (
        <View key={i} style={[styles.eventCard, e.isNationalHoliday && styles.holidayCard]}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventIcon}>{TYPE_ICONS[e.type] ?? '📅'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventName}>{e.name}</Text>
              <Text style={styles.eventDate}>{e.date}</Text>
            </View>
            <View style={styles.badges}>
              <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{e.type}</Text></View>
              {e.isNationalHoliday ? <View style={styles.holidayBadge}><Text style={styles.holidayBadgeText}>Holiday</Text></View> : null}
            </View>
          </View>
          {e.deity ? <Text style={styles.deity}>🪔 {e.deity}</Text> : null}
          <Text style={styles.significance}>{e.significance}</Text>
          {e.observance ? (
            <View style={styles.observanceRow}>
              <Text style={styles.obsIcon}>📿</Text>
              <Text style={styles.obsText}>{e.observance}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { color: theme.colors.gold, fontSize: 20, lineHeight: 22 },
  monthTitle: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 18 },
  filters: { marginBottom: 16 },
  filtersContent: { gap: 8, paddingHorizontal: 2 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: theme.colors.gold },
  pillText: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 12 },
  pillTextActive: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: '#888', fontFamily: theme.fonts.body, fontSize: 14 },
  eventCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  holidayCard: { borderColor: 'rgba(231,76,60,0.3)' },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  eventIcon: { fontSize: 24, marginTop: 2 },
  eventName: { color: '#fff', fontFamily: theme.fonts.bodyBold, fontSize: 14, marginBottom: 2 },
  eventDate: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11 },
  badges: { gap: 4 },
  typeBadge: { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignItems: 'center' },
  typeBadgeText: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  holidayBadge: { backgroundColor: 'rgba(231,76,60,0.15)', borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignItems: 'center' },
  holidayBadgeText: { color: '#e74c3c', fontFamily: theme.fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  deity: { color: '#aad4f5', fontFamily: theme.fonts.body, fontSize: 12, marginBottom: 4 },
  significance: { color: '#ccc', fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  observanceRow: { flexDirection: 'row', gap: 6, backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: 8, padding: 8 },
  obsIcon: { fontSize: 13 },
  obsText: { color: '#aaa', fontFamily: theme.fonts.body, fontSize: 11, lineHeight: 16, flex: 1 },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
});
