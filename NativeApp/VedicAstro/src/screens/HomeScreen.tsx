import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StarField } from '../components/StarField';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

const FEATURES = [
  { icon: '☀️', label: 'Daily\nHoroscope', screen: 'DailyHoroscope', color: '#D4A843' },
  { icon: '📅', label: 'Panchang', screen: 'Panchang', color: theme.colors.teal },
  { icon: '🌍', label: 'City\nPanchang', screen: 'CityPanchang', color: theme.colors.teal },
  { icon: '✨', label: 'Yogas', screen: 'Yogas', color: '#9B59B6' },
  { icon: '📊', label: 'Yearly\nHoroscope', screen: 'YearlyHoroscope', color: '#E67E22' },
  { icon: '🔮', label: 'Birth\nChart', screen: 'BirthChart', color: '#3498DB' },
  { icon: '💊', label: 'Remedies', screen: 'Remedies', color: '#27AE60' },
  { icon: '🔢', label: 'Numerology', screen: 'Numerology', color: '#E74C3C' },
  { icon: '❤️', label: 'Matchmaking', screen: 'Matchmaking', color: '#E91E63' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const displayName = user?.email?.split('@')[0] ?? 'Seeker';

  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
      <StarField />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/vedicastro-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>Namaste, {displayName}</Text>
          <Text style={styles.tagline}>Your cosmic guidance awaits</Text>
        </View>

        {/* Ask AI Banner */}
        <TouchableOpacity onPress={() => navigation.navigate('AskAI')} activeOpacity={0.85}>
          <LinearGradient colors={['#D4A843', theme.colors.gold]} style={styles.askBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.askIcon}>🔮</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.askTitle}>Ask Your AI Astrologer</Text>
              <Text style={styles.askSub}>Get personalized cosmic insights</Text>
            </View>
            <Text style={styles.askArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Feature Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.grid}>
            {FEATURES.map(f => (
              <TouchableOpacity
                key={f.screen}
                style={styles.tile}
                onPress={() => navigation.navigate(f.screen)}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={[f.color + '22', f.color + '11']}
                  style={styles.tileInner}
                >
                  <Text style={styles.tileIcon}>{f.icon}</Text>
                  <Text style={styles.tileLabel}>{f.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, paddingHorizontal: 24 },
  logoImg: { width: 110, height: 110, marginBottom: 16 },
  greeting: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 26, letterSpacing: 0.5 },
  tagline: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 4 },
  askBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    borderRadius: theme.radius.lg, padding: 18, marginBottom: 24,
  },
  askIcon: { fontSize: 26, marginRight: 14 },
  askTitle: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 16 },
  askSub: { color: theme.colors.navy + 'BB', fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  askArrow: { color: theme.colors.navy, fontSize: 22, fontWeight: 'bold' },
  section: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '30.5%' },
  tileInner: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    padding: 14,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  tileIcon: { fontSize: 26, marginBottom: 8 },
  tileLabel: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 11, textAlign: 'center', lineHeight: 15 },
});
