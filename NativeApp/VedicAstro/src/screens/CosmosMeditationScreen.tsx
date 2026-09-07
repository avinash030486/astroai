/**
 * CosmosMeditationScreen.tsx
 *
 * Immersive 360° Vedic meditation: the 9 Jyotish planets float in deep space.
 * Rotate your body to face a planet — gaze at it for a moment to reveal
 * its Sanskrit mantra, meaning, and remedy. Pure gyroscope, no camera.
 *
 * Mantra sources: traditional Navagraha Stotra / Vedic jyotish tradition.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { StarField } from '../components/StarField';
import { useGyroCamera, vrToScreen } from '../hooks/useGyroCamera';

const { width: SW, height: SH } = Dimensions.get('window');
const GAZE_RADIUS = 18; // degrees — planet is "gazed at" if within this angle of screen centre

// ── Planet Data ───────────────────────────────────────────────────────────────
interface PlanetInfo {
  id: string;
  emoji: string;
  color: string;
  bgA: string;
  bgB: string;
  mantra: string;
  transliteration: string;
  meaning: string;
  remedy: string;
  az: number;
  alt: number;
}

const PLANETS: PlanetInfo[] = [
  {
    id: 'Sun', emoji: '☀️', color: '#FFB830', bgA: '#2A1F00', bgB: '#1A1200',
    mantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    transliteration: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    meaning: 'Salutations to the Sun — source of light, vitality and consciousness',
    remedy: 'Offer water to the rising sun, wear Ruby, recite on Sundays',
    az: 0, alt: 10,
  },
  {
    id: 'Moon', emoji: '🌙', color: '#C8E6FF', bgA: '#001826', bgB: '#000F18',
    mantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',
    transliteration: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    meaning: 'Salutations to the Moon — nourisher of mind and emotions',
    remedy: 'Offer milk on Mondays, wear Pearl, meditate near water',
    az: 40, alt: -5,
  },
  {
    id: 'Mars', emoji: '🔴', color: '#FF5E5E', bgA: '#2A0000', bgB: '#180000',
    mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    transliteration: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    meaning: 'Salutations to Mars — giver of courage, energy and determination',
    remedy: 'Offer red flowers on Tuesdays, wear Red Coral, do vigorous exercise',
    az: 80, alt: 15,
  },
  {
    id: 'Mercury', emoji: '🟢', color: '#72FFB6', bgA: '#001A0F', bgB: '#000F0A',
    mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    transliteration: 'Om Braam Breem Braum Sah Budhaya Namah',
    meaning: 'Salutations to Mercury — lord of intellect, speech and commerce',
    remedy: 'Offer green grass on Wednesdays, wear Emerald, study regularly',
    az: 120, alt: 0,
  },
  {
    id: 'Jupiter', emoji: '🟡', color: '#FFD700', bgA: '#1A1500', bgB: '#100D00',
    mantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    transliteration: 'Om Graam Greem Graum Sah Gurave Namah',
    meaning: 'Salutations to Jupiter — teacher of gods, bestower of wisdom',
    remedy: 'Offer yellow flowers on Thursdays, wear Yellow Sapphire, serve teachers',
    az: 160, alt: 20,
  },
  {
    id: 'Venus', emoji: '⚪', color: '#FFB8FF', bgA: '#1A001A', bgB: '#0F000F',
    mantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    transliteration: 'Om Draam Dreem Draum Sah Shukraya Namah',
    meaning: 'Salutations to Venus — goddess of beauty, love and refined arts',
    remedy: 'Offer white flowers on Fridays, wear Diamond or White Sapphire, cultivate art',
    az: 200, alt: -15,
  },
  {
    id: 'Saturn', emoji: '🪐', color: '#A890D0', bgA: '#0A0015', bgB: '#06000E',
    mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    transliteration: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    meaning: 'Salutations to Saturn — karmic teacher, lord of discipline and longevity',
    remedy: 'Offer sesame oil on Saturdays, wear Blue Sapphire, serve the elderly',
    az: 240, alt: 8,
  },
  {
    id: 'Rahu', emoji: '🌑', color: '#9090C0', bgA: '#0A0A1A', bgB: '#060610',
    mantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    transliteration: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    meaning: 'Salutations to Rahu — the north node, lord of illusion and worldly desire',
    remedy: 'Offer blue flowers on Saturdays, wear Hessonite, practice detachment',
    az: 290, alt: -10,
  },
  {
    id: 'Ketu', emoji: '💫', color: '#D0B090', bgA: '#1A0E00', bgB: '#100800',
    mantra: 'ॐ स्त्रां स्त्रीं स्त्रौं सः केतवे नमः',
    transliteration: 'Om Straam Streem Straum Sah Ketave Namah',
    meaning: 'Salutations to Ketu — the south node, lord of liberation and spiritual insight',
    remedy: 'Offer sesame on Tuesdays, wear Cat\'s Eye, meditate and renounce',
    az: 330, alt: 5,
  },
];

export const CosmosMeditationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { heading, pitch, ready } = useGyroCamera();
  const [gazedPlanet, setGazedPlanet] = useState<PlanetInfo | null>(null);
  const [lockedPlanet, setLockedPlanet] = useState<PlanetInfo | null>(null);
  const gazeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const panelAnim  = useRef(new Animated.Value(0)).current;

  // One spring per planet — drives position on native thread (no JS jitter)
  const planetAnims   = useRef(PLANETS.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const planetOpacity = useRef(PLANETS.map(() => new Animated.Value(0))).current;
  const planetScale   = useRef(PLANETS.map(() => new Animated.Value(1))).current;

  // Pulse animation for the gaze reticle
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Panel slide-in/out
  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: lockedPlanet ? 1 : 0,
      tension: 40, friction: 8, useNativeDriver: true,
    }).start();
  }, [lockedPlanet]);

  // Gaze detection
  const detectGaze = useCallback(() => {
    const cx = SW / 2, cy = SH / 2;
    const degsPerPxH = 75 / SW;
    const degsPerPxV = 55 / SH;
    let nearest: PlanetInfo | null = null;
    let minDist = Infinity;
    for (const p of PLANETS) {
      const { x, y, inView } = vrToScreen(p.az, p.alt, heading, pitch, SW, SH);
      if (!inView) continue;
      const dxDeg = Math.abs(x - cx) * degsPerPxH;
      const dyDeg = Math.abs(y - cy) * degsPerPxV;
      const dist  = Math.sqrt(dxDeg * dxDeg + dyDeg * dyDeg);
      if (dist < GAZE_RADIUS && dist < minDist) { minDist = dist; nearest = p; }
    }
    setGazedPlanet(nearest);
    if (nearest) {
      if (!gazeTimer.current) {
        gazeTimer.current = setTimeout(() => {
          setLockedPlanet(nearest);
          gazeTimer.current = null;
        }, 1200);
      }
    } else {
      if (gazeTimer.current) { clearTimeout(gazeTimer.current); gazeTimer.current = null; }
    }
  }, [heading, pitch]);

  // Spring planet positions to native thread on every sensor update
  useEffect(() => {
    PLANETS.forEach((p, i) => {
      const { x, y, inView } = vrToScreen(p.az, p.alt, heading, pitch, SW, SH);
      Animated.spring(planetAnims[i], {
        toValue: { x: x - SW / 2, y: y - SH / 2 },
        speed: 55,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
      Animated.timing(planetOpacity[i], {
        toValue: inView ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Scale up slightly when gazed at
      const isGazed = gazedPlanet?.id === p.id;
      Animated.spring(planetScale[i], {
        toValue: isGazed ? 1.22 : 1.0,
        speed: 20,
        bounciness: 2,
        useNativeDriver: true,
      }).start();
    });
    detectGaze();
  }, [heading, pitch]);

  if (!ready) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingTxt}>Aligning with the cosmos…</Text>
      </View>
    );
  }

  const panelTranslate = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <StarField />
      <LinearGradient colors={['rgba(5,3,20,0.85)', 'rgba(2,1,10,0.95)']} style={StyleSheet.absoluteFill} />

      {/* Planet orbs — Animated.View + native spring keeps motion butter-smooth */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {PLANETS.map((p, i) => {
          const isGazed  = gazedPlanet?.id  === p.id;
          const isLocked = lockedPlanet?.id === p.id;
          return (
            <Animated.View
              key={p.id}
              style={[
                s.planetAnchor,
                {
                  opacity: planetOpacity[i],
                  transform: [
                    ...planetAnims[i].getTranslateTransform(),
                    { scale: planetScale[i] },
                  ],
                },
              ]}
            >
              <TouchableOpacity onPress={() => setLockedPlanet(p)} activeOpacity={0.9}>
                {/* Outer glow ring */}
                <View style={[s.planetGlow, {
                  borderColor: p.color + (isGazed ? 'DD' : '44'),
                  shadowColor: p.color,
                  shadowOpacity: isGazed ? 0.9 : 0.25,
                  shadowRadius: isGazed ? 24 : 10,
                }]} />
                {/* Orb */}
                <LinearGradient
                  colors={[p.bgA, p.bgB]}
                  style={[s.planetOrb, { borderColor: p.color + (isLocked ? 'FF' : '88'), shadowColor: p.color, shadowOpacity: 0.6, shadowRadius: 8, elevation: 10 }]}
                >
                  <Text style={s.planetEmoji}>{p.emoji}</Text>
                </LinearGradient>
                <Text style={[s.planetLabel, { color: p.color }]}>{p.id}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Gaze reticle at screen centre */}
      {!lockedPlanet && (
        <Animated.View
          style={[s.reticle, {
            left: SW / 2 - 18, top: SH / 2 - 18,
            transform: [{ scale: gazedPlanet ? pulseAnim : 1 }],
            borderColor: gazedPlanet ? (gazedPlanet.color + 'CC') : 'rgba(255,255,255,0.2)',
          }]}
          pointerEvents="none"
        />
      )}

      {/* Top HUD */}
      <View style={[s.topHud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.hudCenter}>
          <Text style={s.hudTitle}>Cosmos Meditation</Text>
          <Text style={s.hudSub}>Gaze at a Graha to receive its mantra</Text>
        </View>
      </View>

      {/* Bottom hint when no planet locked */}
      {!lockedPlanet && (
        <View style={[s.bottomHint, { bottom: insets.bottom + 16 }]} pointerEvents="none">
          <Text style={s.hintTxt}>
            {gazedPlanet
              ? `Gazing at ${gazedPlanet.id}… hold steady`
              : 'Rotate body · Tilt phone · Gaze at a planet'}
          </Text>
        </View>
      )}

      {/* Mantra Panel */}
      <Animated.View
        style={[s.panel, { bottom: 0, transform: [{ translateY: panelTranslate }] }]}
        pointerEvents={lockedPlanet ? 'auto' : 'none'}
      >
        {lockedPlanet && (
          <LinearGradient colors={[lockedPlanet.bgA, '#080B14']} style={s.panelInner}>
            <View style={s.panelHandle} />
            {/* Planet header */}
            <View style={s.panelHeader}>
              <Text style={s.panelEmoji}>{lockedPlanet.emoji}</Text>
              <Text style={[s.panelPlanet, { color: lockedPlanet.color }]}>{lockedPlanet.id}</Text>
            </View>
            {/* Sanskrit mantra */}
            <View style={[s.mantraBox, { borderColor: lockedPlanet.color + '40' }]}>
              <Text style={[s.mantraSkt, { color: lockedPlanet.color }]}>{lockedPlanet.mantra}</Text>
              <Text style={s.mantraRoman}>{lockedPlanet.transliteration}</Text>
            </View>
            {/* Meaning */}
            <Text style={s.meaning}>{lockedPlanet.meaning}</Text>
            {/* Remedy */}
            <View style={s.remedyBox}>
              <Text style={s.remedyLabel}>🌿 Traditional Remedy</Text>
              <Text style={s.remedyTxt}>{lockedPlanet.remedy}</Text>
            </View>
            {/* Close */}
            <TouchableOpacity style={s.closeBtn} onPress={() => setLockedPlanet(null)}>
              <Text style={s.closeTxt}>Continue exploring</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#020108' },
  loading:      { flex: 1, backgroundColor: '#020108', alignItems: 'center', justifyContent: 'center' },
  loadingTxt:   { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 14 },
  topHud:       { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:      { backgroundColor: 'rgba(8,14,26,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)', marginTop: 4 },
  backTxt:      { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 13 },
  hudCenter:    { flex: 1, alignItems: 'center', marginTop: 4 },
  hudTitle:     { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18 },
  hudSub:       { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 2, textAlign: 'center' },
  // Reticle
  reticle:      { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, backgroundColor: 'transparent' },
  // Planet
  planetAnchor: { position: 'absolute', left: SW / 2 - 44, top: SH / 2 - 44, width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  planetWrap:   { position: 'absolute', width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  planetGlow:   { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, shadowRadius: 20 },
  planetOrb:    { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  planetEmoji:  { fontSize: 26 },
  planetLabel:  { fontFamily: theme.fonts.sansSemiBold, fontSize: 10, marginTop: 3 },
  // Bottom hint
  bottomHint:   { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hintTxt:      { color: 'rgba(255,255,255,0.5)', fontFamily: theme.fonts.sans, fontSize: 12, textAlign: 'center' },
  // Mantra panel
  panel:        { position: 'absolute', left: 0, right: 0 },
  panelInner:   { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 40 },
  panelHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  panelHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  panelEmoji:   { fontSize: 36, marginRight: 14 },
  panelPlanet:  { fontFamily: theme.fonts.heading, fontSize: 28 },
  mantraBox:    { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  mantraSkt:    { fontFamily: theme.fonts.heading, fontSize: 17, textAlign: 'center', lineHeight: 28, marginBottom: 8 },
  mantraRoman:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 12, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  meaning:      { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 21, marginBottom: 16 },
  remedyBox:    { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 20 },
  remedyLabel:  { color: theme.colors.gold, fontFamily: theme.fonts.sansSemiBold, fontSize: 12, marginBottom: 6 },
  remedyTxt:    { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 20 },
  closeBtn:     { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 30, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  closeTxt:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
});
