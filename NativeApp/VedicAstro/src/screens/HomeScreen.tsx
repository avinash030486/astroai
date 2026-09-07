import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StarField } from '../components/StarField';
import { useAuthStore } from '../store/authStore';
import { useStreakStore } from '../store/streakStore';
import { useSkyPlanets } from '../hooks/useSkyPlanets';
import { theme } from '../theme/theme';
import { Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const PLANET_COLORS: Record<string, string> = {
  Sun: '#FFD700', Moon: '#C0C0C0', Mars: '#FF4500', Mercury: '#7FFF00',
  Jupiter: '#FFA500', Venus: '#FFFFFF', Saturn: '#9370DB', Rahu: '#8B5CF6', Ketu: '#DC143C',
};

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
  { icon: '🪐', label: 'Transit\nAlerts', screen: 'TransitAlerts', color: '#2ECC71' },
  { icon: '⏰', label: 'Muhurat', screen: 'Muhurat', color: '#F39C12' },
  { icon: '💎', label: 'Gemstones', screen: 'Gemstone', color: '#9B59B6' },
  { icon: '📅', label: 'Festivals', screen: 'FestivalCalendar', color: '#E74C3C' },
  { icon: '🔭', label: 'AR Sky\nGuide', screen: 'ARSkyGuide', color: '#4A90D9' },
  { icon: '🥽', label: 'Vedic\nCosmos', screen: 'VedicVR', color: '#7B68EE' },
  { icon: '🖐', label: 'Palmistry', screen: 'Palmistry', color: '#E8A87C' },
  { icon: '🔄', label: 'Past\nLife', screen: 'PastLife', color: '#9B59B6' },
  { icon: '✨', label: 'Nakshatra\nAura AR', screen: 'ARNakshatraAura', color: '#A29BFE' },
  { icon: '💍', label: 'Gemstone\nTry-On AR', screen: 'ARGemstone', color: '#2ECC71' },  { icon: '🎨', label: 'Soul\nSketch',        screen: 'SoulSketch',         color: '#E91E63' },];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const displayName = user?.email?.split('@')[0] ?? 'Seeker';

  // Graha Gazing quest — pick highest above-horizon planet not yet done today
  const { planets } = useSkyPlanets({ screenWidth: SW, screenHeight: SH });
  const { isCompletedToday, getStreak, loadStreaks } = useStreakStore();
  React.useEffect(() => { loadStreaks(); }, []);
  const questPlanet = planets
    .filter(p => p.aboveHorizon && p.alt > 8 && !isCompletedToday(p.name))
    .sort((a, b) => b.alt - a.alt)[0] ?? null;

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

        {/* Graha Gazing Quest Banner */}
        {questPlanet && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.questBanner}
            onPress={() => navigation.navigate('GrahaGazing', { planetName: questPlanet.name })}
          >
            <LinearGradient
              colors={['#1a0035', '#0a001a']}
              style={styles.questInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.questGlyph, { color: PLANET_COLORS[questPlanet.name] ?? theme.colors.gold }]}>
                {PLANET_GLYPHS[questPlanet.name] ?? '★'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.questTitle}>🔭 Tonight's Graha Quest</Text>
                <Text style={styles.questSub}>
                  Gaze at {questPlanet.name} for 30s → unlock full prediction
                  {getStreak(questPlanet.name) > 0 ? `  🔥 ${getStreak(questPlanet.name)}-day streak` : ''}
                </Text>
              </View>
              <Text style={styles.questArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
  questBanner: { marginHorizontal: 20, marginBottom: 16, borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
  questInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  questGlyph: { fontSize: 32 },
  questTitle: { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 13 },
  questSub:   { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 3 },
  questArrow: { color: theme.colors.textSecondary, fontSize: 18 },
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
