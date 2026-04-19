import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DatePickerField } from '../components/DatePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { geoApi, horoscopeApi } from '../api/services';
import { theme } from '../theme/theme';

export const CityPanchangScreen: React.FC = () => {
  const navigation = useNavigation();
  const [city, setCity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCityPanchang = async () => {
    if (!city.trim()) { setError('Please enter a city name.'); return; }
    setError(''); setLoading(true);
    try {
      const geoData = await geoApi.getCoordinates(city.trim());
      const lat = geoData?.latitude;
      const lon = geoData?.longitude;
      if (!lat || !lon) throw new Error('Could not find coordinates for this city.');
      const panchang = await horoscopeApi.getSouthIndian({ date, latitude: lat, longitude: lon });
      setResult({ ...panchang, city: city.trim(), lat, lon });
    } catch (e: any) {
      setError(e.message || 'Failed to fetch city panchang.');
    } finally {
      setLoading(false);
    }
  };

  const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );

  return (
    <ScreenLayout title="City Panchang" subtitle="Location-based Vedic almanac" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Fetching coordinates…" />}
      <PlaceInput label="City Name" value={city} onChangeText={setCity} placeholder="e.g. Delhi, Mumbai, London" />
      <DatePickerField label="Date" value={date} onChangeText={setDate} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Get City Panchang" onPress={fetchCityPanchang} loading={loading} style={styles.btn} />

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 {result.city}</Text>
          <Text style={styles.coords}>{result.lat}°N, {result.lon}°E</Text>
          {result.ayanamshaName && <Row label="Ayanamsha" value={`${result.ayanamshaName} ${(result.ayanamshaDegrees ?? 0).toFixed(4)}°`} />}
          {result.ascendantSign && <Row label="Ascendant" value={result.ascendantSign} />}
          {result.planets?.find((p: any) => p.name === 'Moon') && (
            <Row label="Moon Sign" value={`${result.planets.find((p: any) => p.name === 'Moon')?.sign ?? ''} · ${result.planets.find((p: any) => p.name === 'Moon')?.nakshatra ?? ''}`} />
          )}
          {result.planets?.find((p: any) => p.name === 'Sun') && (
            <Row label="Sun Sign" value={result.planets.find((p: any) => p.name === 'Sun')?.sign ?? ''} />
          )}
          {result.planets?.map((p: any, i: number) => (
            <Row key={i} label={p.name} value={`${p.sign} · H${p.house} · ${p.nakshatra}`} />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
  btn: { marginBottom: 24 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 20, borderWidth: 1, borderColor: theme.colors.goldDim },
  cardTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 4 },
  coords: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.goldDim + '66' },
  rowLabel: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, flex: 1 },
  rowValue: { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 13, flex: 1, textAlign: 'right' },
});
