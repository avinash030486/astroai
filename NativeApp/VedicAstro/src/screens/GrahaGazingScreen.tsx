/**
 * GrahaGazingScreen.tsx
 *
 * AR-style planet finder using real-time azimuth + altitude from useSkyPlanets.
 * The user must hold their phone pointed at the target planet for 30 seconds to
 * "lock on" — unlocking the full daily prediction and extending their streak.
 *
 * No extra packages required beyond what's already installed:
 *   expo-camera, expo-sensors (DeviceMotion/compass via useSkyPlanets),
 *   expo-linear-gradient, react-native Vibration API.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Platform, Vibration, Animated, Easing, Share,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useSkyPlanets } from '../hooks/useSkyPlanets';
import { useStreakStore } from '../store/streakStore';

const { width: W, height: H } = Dimensions.get('window');

// ── Config ────────────────────────────────────────────────────────────────────
const LOCK_THRESHOLD_DEG = 7;   // ±7° tolerance for locking on
const GAZE_DURATION_MS   = 30000; // 30 seconds total hold time

// ── Planet display data ───────────────────────────────────────────────────────
const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const PLANET_COLORS: Record<string, string> = {
  Sun:     '#FFD700',
  Moon:    '#C0C0C0',
  Mars:    '#FF4500',
  Mercury: '#7FFF00',
  Jupiter: '#FFA500',
  Venus:   '#FFFFFF',
  Saturn:  '#9370DB',
  Rahu:    '#8B5CF6',
  Ketu:    '#DC143C',
};
const PLANET_DESCRIPTIONS: Record<string, string> = {
  Sun:     'Surya — Soul, vitality and authority',
  Moon:    'Chandra — Mind, emotions and intuition',
  Mars:    'Mangal — Courage, energy and ambition',
  Mercury: 'Budha — Intellect, communication and trade',
  Jupiter: 'Guru — Wisdom, expansion and spirituality',
  Venus:   'Shukra — Love, beauty and relationships',
  Saturn:  'Shani — Discipline, karma and perseverance',
  Rahu:    'Rahu — Illusion, ambition and sudden events',
  Ketu:    'Ketu — Detachment, intuition and liberation',
};

// ── Angular distance helper (handles 0/360 wrap) ─────────────────────────────
function angDiff(a: number, b: number): number {
  let d = ((a - b) % 360 + 360) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

// ── Animated ring component ───────────────────────────────────────────────────
interface RingProps { locked: boolean; progress: number; color: string; }
const GazeRing: React.FC<RingProps> = ({ locked, progress, color }) => {
  const pulse  = useRef(new Animated.Value(1)).current;
  const spin   = useRef(new Animated.Value(0)).current;
  const anim   = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    anim.current?.stop();
    if (locked) {
      anim.current = Animated.parallel([
        Animated.loop(Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])),
        Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear })),
      ]);
      anim.current.start();
    } else {
      Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      spin.setValue(0);
    }
    return () => anim.current?.stop();
  }, [locked]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const size   = 180;
  const pct    = Math.round(progress * 100);
  const secs   = Math.ceil((1 - progress) * 30);

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: locked ? color : 'rgba(255,215,0,0.4)', transform: [{ scale: pulse }] },
      ]}
    >
      {/* Spinning corner dots when locked */}
      {locked && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate }] }]}>
          {[0, 90, 180, 270].map(a => (
            <View
              key={a}
              style={[
                styles.ringDot,
                { backgroundColor: color, transform: [{ rotate: `${a}deg` }, { translateY: -(size / 2 - 6) }] },
              ]}
            />
          ))}
        </Animated.View>
      )}
      {/* Center readout */}
      <View style={styles.ringCenter}>
        <Text style={[styles.ringPct, { color: locked ? color : 'rgba(255,215,0,0.6)' }]}>
          {locked ? `${pct}%` : '0%'}
        </Text>
        {locked && (
          <Text style={[styles.ringLabel, { color }]}>{secs}s</Text>
        )}
        {!locked && (
          <Text style={styles.ringHint}>AIM</Text>
        )}
      </View>
    </Animated.View>
  );
};

// ── Directional arrow ─────────────────────────────────────────────────────────
interface ArrowProps { azDiff: number; altDiff: number; }
const DirectionArrow: React.FC<ArrowProps> = ({ azDiff, altDiff }) => {
  const angle   = Math.atan2(-altDiff, azDiff) * (180 / Math.PI);
  const dist    = Math.sqrt(azDiff * azDiff + altDiff * altDiff);
  const opacity = Math.min(1, Math.max(0, (dist - 2) / 8));

  if (opacity < 0.05) return null;

  return (
    <View style={[styles.arrowWrap, { opacity }]}>
      <View style={[styles.arrowBody, { transform: [{ rotate: `${angle}deg` }] }]}>
        {/* Triangle arrowhead */}
        <View style={styles.arrowHead} />
        <View style={styles.arrowShaft} />
      </View>
      <Text style={styles.arrowDist}>{dist.toFixed(1)}° away</Text>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const GrahaGazingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();

  const planetName: string = route.params?.planetName ?? 'Jupiter';
  const pColor = PLANET_COLORS[planetName] ?? theme.colors.gold;
  const glyph  = PLANET_GLYPHS[planetName] ?? '★';

  // ── Sensors via existing hook ────────────────────────────────────────────
  const { planets, heading, pitch, locationGranted, error: sensorError } =
    useSkyPlanets({ screenWidth: W, screenHeight: H });

  const planet = planets.find(p => p.name === planetName);

  // ── Camera ───────────────────────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();

  // ── Streak store ─────────────────────────────────────────────────────────
  const { loadStreaks, addStreak, getStreak, isCompletedToday } = useStreakStore();
  useEffect(() => { loadStreaks(); }, []);

  // ── Gaze state ───────────────────────────────────────────────────────────
  const [locked,    setLocked]    = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [completed, setCompleted] = useState(false);

  const gazeStart  = useRef<number | null>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef  = useRef(false);

  // Clear ticker on unmount
  useEffect(() => () => { clearInterval(tickRef.current!); }, []);

  // ── Lock detection — runs every time heading/pitch update ────────────────
  useEffect(() => {
    if (!planet || completed) return;

    const azOff  = angDiff(heading, planet.az);
    const altOff = Math.abs(pitch   - planet.alt);
    const onTarget = azOff < LOCK_THRESHOLD_DEG && altOff < LOCK_THRESHOLD_DEG;

    if (onTarget && !lockedRef.current) {
      // Just locked on
      lockedRef.current = true;
      setLocked(true);
      gazeStart.current = Date.now();
      Vibration.vibrate(80);

      tickRef.current = setInterval(() => {
        const elapsed = Date.now() - (gazeStart.current ?? Date.now());
        const p = Math.min(1, elapsed / GAZE_DURATION_MS);
        setProgress(p);
        if (p >= 1) {
          clearInterval(tickRef.current!);
          setCompleted(true);
          lockedRef.current = false;
          Vibration.vibrate([0, 100, 80, 100]);
          addStreak(planetName);
        }
      }, 250);

    } else if (!onTarget && lockedRef.current) {
      // Lost lock
      lockedRef.current = false;
      setLocked(false);
      setProgress(0);
      gazeStart.current = null;
      clearInterval(tickRef.current!);
      Vibration.vibrate(30);
    }
  }, [heading, pitch, planet, completed]);

  // ── Derived values ───────────────────────────────────────────────────────
  const streak       = getStreak(planetName);
  const doneToday    = isCompletedToday(planetName);
  const belowHorizon = planet ? !planet.aboveHorizon : false;
  const azDiff       = planet ? angDiff(heading, planet.az)  : 999;
  const altDiff      = planet ? pitch - planet.alt            : 999;

  // ── Permission gate ──────────────────────────────────────────────────────
  if (!permission) {
    return <View style={[styles.screen, styles.center]} />;
  }
  if (!permission.granted) {
    return (
      <LinearGradient colors={[theme.colors.navy, theme.colors.navyMid]} style={[styles.screen, styles.center]}>
        <Text style={styles.glyphHuge}>{glyph}</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>
          Point your camera at the night sky to find {planetName} and lock your gaze.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.teal }]} onPress={requestPermission}>
          <Text style={styles.btnTextDark}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkTxt}>← Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── Below horizon screen ─────────────────────────────────────────────────
  if (belowHorizon) {
    const hoursToRise = planet ? Math.round(Math.abs(planet.alt) / 15) : 0;
    return (
      <LinearGradient colors={[theme.colors.navy, theme.colors.navyMid]} style={[styles.screen, styles.center]}>
        <Text style={styles.glyphHuge}>{glyph}</Text>
        <Text style={[styles.title, { color: pColor }]}>{planetName} is Below the Horizon</Text>
        <Text style={styles.subtitle}>
          {hoursToRise > 0
            ? `${planetName} rises in approximately ${hoursToRise} hour${hoursToRise !== 1 ? 's' : ''}.`
            : `${planetName} is not visible from your location tonight.`}
        </Text>
        {streak > 0 && <Text style={styles.streakInfo}>🔥 Your current streak: {streak} day{streak !== 1 ? 's' : ''}</Text>}
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.teal, marginTop: 32 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnTextDark}>← Back to Sky Guide</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── Already completed today ──────────────────────────────────────────────
  if (doneToday && !completed) {
    return (
      <LinearGradient colors={[theme.colors.navy, theme.colors.navyMid]} style={[styles.screen, styles.center]}>
        <Text style={styles.glyphHuge}>{glyph}</Text>
        <Text style={[styles.title, { color: pColor }]}>Already Aligned Today ✓</Text>
        <Text style={styles.subtitle}>You gazed at {planetName} today.</Text>
        <Text style={styles.streakBig}>🔥 {streak}-Day Streak</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.teal, marginTop: 24 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnTextDark}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── Completion screen ────────────────────────────────────────────────────
  if (completed) {
    return (
      <LinearGradient colors={[theme.colors.navy, '#1a0035']} style={[styles.screen, styles.center]}>
        <Text style={styles.glyphHuge}>{glyph}</Text>
        <Text style={[styles.title, { color: pColor }]}>Alignment Complete!</Text>
        <Text style={styles.streakBig}>🔥 {streak}-Day Streak</Text>
        <Text style={styles.subtitle}>
          You have gazed at {planetName} ({PLANET_DESCRIPTIONS[planetName]}) for 30 seconds.{'\n'}
          Full {planetName} prediction unlocked for today.
        </Text>

        <View style={styles.completedBtns}>
          <TouchableOpacity
            style={[styles.btn, { borderWidth: 1.5, borderColor: pColor, backgroundColor: 'transparent' }]}
            onPress={() => {
              Share.share({
                message: `I gazed at ${planetName} for 30 seconds in VedicAstro! Day ${streak} 🔥 ${glyph} #GrahaGazing #AstroAI`,
              });
            }}
          >
            <Text style={[styles.btnText, { color: pColor }]}>📤 Share My Streak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.colors.teal }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnTextDark}>← Back to Sky Guide</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ── Main AR camera screen ────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Dark vignette overlay */}
      <LinearGradient
        colors={['rgba(8,14,26,0.6)', 'transparent', 'transparent', 'rgba(8,14,26,0.7)']}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Top HUD ── */}
      <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={{ top: 12, left: 12, bottom: 12, right: 12 }}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hudPlanetInfo}>
          <Text style={[styles.hudGlyph, { color: pColor }]}>{glyph}</Text>
          <View>
            <Text style={[styles.hudName, { color: pColor }]}>{planetName}</Text>
            <Text style={styles.hudRole} numberOfLines={1}>{PLANET_DESCRIPTIONS[planetName]}</Text>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeTxt}>🔥 {streak}</Text>
        </View>
      </View>

      {/* ── Center: gaze ring + direction arrow ── */}
      <View style={styles.centerArea} pointerEvents="none">
        <GazeRing locked={locked} progress={progress} color={pColor} />
        {!locked && <DirectionArrow azDiff={azDiff} altDiff={altDiff} />}
      </View>

      {/* ── Bottom HUD ── */}
      <View style={[styles.bottomHud, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.instruction}>
          {locked
            ? `Hold steady — ${Math.ceil((1 - progress) * 30)}s remaining…`
            : `Point at ${planetName} to begin · ${azDiff.toFixed(1)}° off-target`}
        </Text>

        {/* Coordinate readout row */}
        <View style={styles.coordRow}>
          <View style={styles.coordItem}>
            <Text style={styles.coordLabel}>TARGET Az</Text>
            <Text style={styles.coordVal}>{planet?.az.toFixed(1) ?? '—'}°</Text>
          </View>
          <View style={styles.coordItem}>
            <Text style={styles.coordLabel}>TARGET Alt</Text>
            <Text style={styles.coordVal}>{planet?.alt.toFixed(1) ?? '—'}°</Text>
          </View>
          <View style={styles.coordItem}>
            <Text style={styles.coordLabel}>PHONE Az</Text>
            <Text style={styles.coordVal}>{heading.toFixed(1)}°</Text>
          </View>
          <View style={styles.coordItem}>
            <Text style={styles.coordLabel}>PHONE Alt</Text>
            <Text style={styles.coordVal}>{pitch.toFixed(1)}°</Text>
          </View>
        </View>

        {/* Sign badge */}
        {planet?.siderealSign && (
          <Text style={styles.signBadge}>
            {planetName} is in {planet.siderealSign} ✦ {streak > 0 ? `${streak}-day streak 🔥` : 'Start your streak!'}
          </Text>
        )}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: theme.colors.navy },
  center:       { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Top HUD
  topHud: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(8,14,26,0.65)',
  },
  closeBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { color: theme.colors.w70, fontSize: 18 },
  hudPlanetInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginHorizontal: 12 },
  hudGlyph:     { fontSize: 26 },
  hudName:      { fontFamily: theme.fonts.heading, fontSize: 16 },
  hudRole:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 10, maxWidth: 160 },
  streakBadge:  { backgroundColor: 'rgba(255,150,0,0.2)', borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  streakBadgeTxt: { color: '#FFA500', fontFamily: theme.fonts.bodyBold, fontSize: 13 },

  // Center
  centerArea:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Ring
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  ringDot:      { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  ringCenter:   { alignItems: 'center' },
  ringPct:      { fontFamily: theme.fonts.heading, fontSize: 36 },
  ringLabel:    { fontFamily: theme.fonts.bodyBold, fontSize: 13, letterSpacing: 2, marginTop: 2 },
  ringHint:     { color: 'rgba(255,215,0,0.4)', fontFamily: theme.fonts.bodyBold, fontSize: 11, letterSpacing: 3 },

  // Arrow
  arrowWrap:    { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  arrowBody:    { alignItems: 'center', justifyContent: 'center', width: 50, height: 50 },
  arrowHead: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 18,
    borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: theme.colors.gold,
  },
  arrowShaft:   { width: 4, height: 16, backgroundColor: theme.colors.gold, marginTop: -2 },
  arrowDist:    { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 12, marginTop: 6 },

  // Bottom HUD
  bottomHud: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8,14,26,0.75)',
    paddingTop: 16, paddingHorizontal: 20,
  },
  instruction:  { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  coordRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  coordItem:    { alignItems: 'center', flex: 1 },
  coordLabel:   { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 9, letterSpacing: 1 },
  coordVal:     { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 13, marginTop: 2 },
  signBadge:    { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 11, textAlign: 'center', paddingBottom: 4 },

  // Non-camera screens
  glyphHuge:    { fontSize: 80, marginBottom: 20 },
  title:        { fontFamily: theme.fonts.heading, fontSize: 26, textAlign: 'center', marginBottom: 10 },
  subtitle:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  streakBig:    { color: '#FFA500', fontFamily: theme.fonts.heading, fontSize: 34, marginBottom: 8 },
  streakInfo:   { color: '#FFA500', fontFamily: theme.fonts.body, fontSize: 14, marginTop: 8 },
  permTitle:    { color: theme.colors.textPrimary, fontFamily: theme.fonts.heading, fontSize: 22, textAlign: 'center', marginBottom: 10 },
  permSub:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  completedBtns: { width: '100%', gap: 12, marginTop: 28 },
  btn: {
    borderRadius: theme.radius.lg, paddingVertical: 14,
    paddingHorizontal: 24, alignItems: 'center', width: '100%',
  },
  btnText:      { fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  btnTextDark:  { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  backLink:     { marginTop: 16 },
  backLinkTxt:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13 },
});
