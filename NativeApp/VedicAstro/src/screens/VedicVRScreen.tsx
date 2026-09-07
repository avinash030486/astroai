/**
 * VedicVRScreen.tsx
 *
 * Hub screen for all 3 immersive Vedic VR experiences.
 * No headset needed — all experiences use phone gyroscope + compass.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { StarField } from '../components/StarField';
import { useProfileStore } from '../store/profileStore';
import { useVimshottariDasha, DASHA_THEMES } from '../hooks/useVimshottariDasha';

const { width: SW } = Dimensions.get('window');

const EXPERIENCES = [
  {
    screen:  'BirthChartRoom',
    icon:    '🏛️',
    title:   'Birth Chart Room',
    desc:    'Step inside your birth chart. The 12 Vedic houses surround you as glowing archways. Rotate your body to explore each house and see your natal planets.',
    tagLine: 'Rotate 360° to explore',
    colors:  ['#1a1035', '#0d0a25'] as [string, string],
    border:  '#7B68EE',
    badge:   '12 Houses',
  },
  {
    screen:  'CosmosMeditation',
    icon:    '🧘',
    title:   'Vedic Cosmos',
    desc:    'Float in deep space with all 9 Jyotish planets orbiting around you. Gaze at a planet to receive its ancient Beej mantra and Jyotish wisdom.',
    tagLine: 'Gaze at planets for mantras',
    colors:  ['#050d1a', '#020810'] as [string, string],
    border:  '#4A90D9',
    badge:   '9 Planets',
  },
  {
    screen:  'DashaTimeline',
    icon:    '⏳',
    title:   'Dasha Timeline',
    desc:    'Walk through your karmic story. See every Vimshottari Dasha period from birth — past lives, current chapter and the road ahead. Understand your soul\'s journey.',
    tagLine: 'Your 120-year cosmic map',
    colors:  ['#1a0e00', '#0e0800'] as [string, string],
    border:  '#D4A843',
    badge:   '120 Yr Journey',
  },
];

export const VedicVRScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const dashaResult = useVimshottariDasha(profile?.date_of_birth);
  const currentDasha = dashaResult?.currentDasha;
  const dashaTheme   = currentDasha ? DASHA_THEMES[currentDasha.planet] : null;

  const monthsLeft = currentDasha
    ? Math.round((currentDasha.endDate.getTime() - Date.now()) / (30.44 * 24 * 3600 * 1000))
    : 0;

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <StarField />
      <LinearGradient colors={['rgba(5,8,26,0.85)', 'rgba(8,14,26,0.95)']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <Text style={s.title}>Vedic Cosmos</Text>
            <Text style={s.subtitle}>Immersive · No headset needed</Text>
          </View>
        </View>

        {/* Gyro hint banner */}
        <View style={s.hintBox}>
          <Text style={s.hintIcon}>📱</Text>
          <Text style={s.hintText}>
            Hold your phone and <Text style={s.hintBold}>rotate your body</Text> or <Text style={s.hintBold}>tilt the screen</Text> to look around in 360°. Your phone becomes a window into the cosmos.
          </Text>
        </View>

        {/* Current Dasha Banner */}
        {currentDasha && dashaTheme && (
          <TouchableOpacity
            style={[s.dashaBanner, { borderColor: dashaTheme.color + '55' }]}
            onPress={() => navigation.navigate('DashaTimeline')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[dashaTheme.bgA, dashaTheme.bgB]} style={s.dashaInner}>
              <Text style={s.dashaEmoji}>{dashaTheme.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.dashaLabel}>Your Current Dasha</Text>
                <Text style={[s.dashaPlanet, { color: dashaTheme.color }]}>
                  {currentDasha.planet} Mahadasha
                </Text>
                <Text style={s.dashaTheme}>{dashaTheme.theme}</Text>
                <Text style={s.dashaEnd}>
                  {monthsLeft > 0
                    ? `${monthsLeft} months remaining · ends ${currentDasha.endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                    : `Ends ${currentDasha.endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                </Text>
              </View>
              <Text style={s.dashaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!profile?.date_of_birth && (
          <View style={s.noDobBox}>
            <Text style={s.noDobTxt}>
              💡 Add your birth date in your Profile to unlock personalised Dasha timelines and natal chart placements.
            </Text>
          </View>
        )}

        {/* Section Title */}
        <Text style={s.sectionLabel}>Choose an Experience</Text>

        {/* Experience Cards */}
        {EXPERIENCES.map(exp => (
          <TouchableOpacity
            key={exp.screen}
            onPress={() => navigation.navigate(exp.screen)}
            activeOpacity={0.88}
            style={s.cardWrap}
          >
            <LinearGradient colors={exp.colors} style={[s.card, { borderColor: exp.border + '44' }]}>
              <View style={s.cardTop}>
                <Text style={s.cardIcon}>{exp.icon}</Text>
                <View style={[s.cardBadge, { backgroundColor: exp.border + '22', borderColor: exp.border + '66' }]}>
                  <Text style={[s.cardBadgeTxt, { color: exp.border }]}>{exp.badge}</Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{exp.title}</Text>
              <Text style={s.cardTagLine}>{exp.tagLine}</Text>
              <Text style={s.cardDesc}>{exp.desc}</Text>
              <View style={[s.enterBtn, { borderColor: exp.border + '88' }]}>
                <Text style={[s.enterTxt, { color: exp.border }]}>Enter Experience →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#05081A' },
  header:       { paddingHorizontal: 20, paddingBottom: 16 },
  backBtn:      { backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)', marginBottom: 20 },
  backTxt:      { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 13 },
  titleWrap:    { alignItems: 'center' },
  title:        { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 30, letterSpacing: 0.5 },
  subtitle:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, marginTop: 4 },
  hintBox:      { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(74,144,217,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(74,144,217,0.3)', padding: 14 },
  hintIcon:     { fontSize: 20, marginRight: 10, marginTop: 1 },
  hintText:     { flex: 1, color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 20 },
  hintBold:     { color: '#4A90D9', fontFamily: theme.fonts.sansSemiBold },
  dashaBanner:  { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  dashaInner:   { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  dashaEmoji:   { fontSize: 32 },
  dashaLabel:   { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  dashaPlanet:  { fontFamily: theme.fonts.heading, fontSize: 20 },
  dashaTheme:   { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 12, marginTop: 2 },
  dashaEnd:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 4 },
  dashaArrow:   { color: theme.colors.textSecondary, fontSize: 18 },
  noDobBox:     { marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(212,168,67,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)', padding: 14 },
  noDobTxt:     { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 20 },
  sectionLabel: { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 14 },
  cardWrap:     { marginHorizontal: 20, marginBottom: 16 },
  card:         { borderRadius: 20, borderWidth: 1, padding: 20 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardIcon:     { fontSize: 38 },
  cardBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  cardBadgeTxt: { fontFamily: theme.fonts.sansSemiBold, fontSize: 11 },
  cardTitle:    { color: '#fff', fontFamily: theme.fonts.heading, fontSize: 24, marginBottom: 2 },
  cardTagLine:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
  cardDesc:     { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 21, marginBottom: 16 },
  enterBtn:     { borderWidth: 1, borderRadius: 30, paddingVertical: 10, alignItems: 'center' },
  enterTxt:     { fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
});
