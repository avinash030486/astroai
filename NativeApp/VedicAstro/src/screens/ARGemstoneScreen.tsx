/**
 * ARGemstoneScreen.tsx
 *
 * AR Gemstone Try-On — uses the back camera to show a live hand view with:
 *  • A hand-position alignment guide overlay
 *  • The recommended Vedic gemstone displayed on the correct finger
 *  • Animated glowing ring + gemstone colour based on planet
 *  • Shareable snapshot
 *
 * Can be launched two ways:
 *  A. From GemstoneScreen after a paid analysis → receives `gemstone` route param
 *  B. Standalone from the FEATURES list → user enters birth details to get the
 *     primary gemstone, then enters AR view (free preview of one gemstone)
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';

import * as Sharing from 'expo-sharing';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse, Path, Text as SvgText } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';

import { theme } from '../theme/theme';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PaymentModal } from '../components/PaymentModal';
import { gemstoneApi, normalizeTime, paymentsApi } from '../api/services';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { GEMSTONE_COLORS, GEMSTONE_FINGER, PLANET_GEMSTONE } from '../data/nakshatraAura';
import { useCurrency } from '../hooks/useCurrency';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Finger position map on a schematic hand ─────────────────────────────
// Coordinates relative to a hand silhouette centred on-screen.
// fingerIndex: 0=thumb, 1=index, 2=middle, 3=ring, 4=pinky
const FINGER_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: SW * 0.22, y: SH * 0.42 },   // thumb
  1: { x: SW * 0.33, y: SH * 0.30 },   // index
  2: { x: SW * 0.44, y: SH * 0.265 },  // middle
  3: { x: SW * 0.56, y: SH * 0.285 },  // ring
  4: { x: SW * 0.67, y: SH * 0.325 },  // pinky
};

// ─── Hand silhouette path (simplified, visual only) ──────────────────────
// A decorative outline — not real SVG hand path; uses rounded rects per finger
interface HandGuideProps {
  fingerIndex: number;
  gemColor: string;
  gemGlow: string;
  ringAnim: Animated.Value;
}

const HandGuide: React.FC<HandGuideProps> = ({ fingerIndex, gemColor, gemGlow, ringAnim }) => {
  const pos = FINGER_POSITIONS[fingerIndex] ?? FINGER_POSITIONS[3];

  // Finger outlines
  const fingers = [
    { xi: 0, yi: 0, w: 22, h: 70, r: 11 },   // thumb
    { xi: 1, yi: 0, w: 22, h: 95, r: 11 },   // index
    { xi: 2, yi: 0, w: 23, h: 108, r: 12 },  // middle
    { xi: 3, yi: 0, w: 22, h: 100, r: 11 },  // ring
    { xi: 4, yi: 0, w: 20, h: 80, r: 10 },   // pinky
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Guide text */}
      <View style={styles.guideTextWrap}>
        <View style={styles.guideTextBox}>
          <Text style={styles.guideTextLine}>Position your right hand</Text>
          <Text style={styles.guideTextLine}>in the outlined area below</Text>
        </View>
      </View>

      {/* Fingerprint outline areas */}
      {fingers.map((f, i) => {
        const fp = FINGER_POSITIONS[i];
        return (
          <View
            key={i}
            style={[
              styles.fingerGuide,
              {
                left: fp.x - f.w / 2,
                top: fp.y - f.h,
                width: f.w,
                height: f.h,
                borderRadius: f.r,
                borderColor: i === fingerIndex
                  ? gemColor
                  : 'rgba(255,255,255,0.25)',
                borderWidth: i === fingerIndex ? 2.5 : 1,
                backgroundColor: i === fingerIndex
                  ? gemColor + '22'
                  : 'rgba(255,255,255,0.05)',
              },
            ]}
          />
        );
      })}

      {/* Palm box */}
      <View style={[styles.palmBox, { borderColor: 'rgba(255,255,255,0.2)' }]} />

      {/* Animated gemstone ring on target finger */}
      {/* Outer glow pulse — animated opacity only (works on both iOS & Android) */}
      <Animated.View
        style={[
          styles.gemRingGlow,
          {
            left: pos.x - 30,
            top: pos.y - 18,
            backgroundColor: gemGlow,
            opacity: ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.55, 0.15] }),
            transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.gemRing,
          {
            left: pos.x - 22,
            top: pos.y - 11,
            borderColor: gemColor,
            opacity: ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1, 0.85] }),
            transform: [
              { scale: ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
            ],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.gemEmoji,
            {
              opacity: ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1, 0.8] }),
            },
          ]}
        >
          💍
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

// ─── Gemstone info card at bottom ────────────────────────────────────────
interface GemInfoCardProps {
  gemstone: string;
  planet: string;
  metal: string;
  finger: string;
  weight: string;
  bestDay: string;
  benefits: string | string[];
}

const GemInfoCard: React.FC<GemInfoCardProps> = ({ gemstone, planet, metal, finger, weight, bestDay, benefits }) => {
  const gc = GEMSTONE_COLORS[gemstone] ?? { color: theme.colors.gold, glow: theme.colors.gold, emoji: '💎' };
  return (
    <View style={styles.infoCard}>
      <LinearGradient colors={['transparent', 'rgba(8,14,26,0.97)']} style={styles.infoGrad}>
        <View style={styles.infoInner}>
          {/* Gem name row */}
          <View style={styles.gemNameRow}>
            <View style={[styles.gemDot, { backgroundColor: gc.color, shadowColor: gc.glow }]} />
            <View>
              <Text style={[styles.gemName, { color: gc.color }]}>{gemstone}</Text>
              <Text style={styles.gemPlanet}>Planet: {planet}</Text>
            </View>
          </View>

          {/* Details row */}
          <View style={styles.detailRow}>
            {[
              { label: 'Metal', value: metal || 'Gold' },
              { label: 'Finger', value: finger },
              { label: 'Weight', value: weight ? `${weight} ct` : '—' },
              { label: 'Best Day', value: bestDay || '—' },
            ].map((d, i) => (
              <View key={i} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          {/* Benefits */}
          {!!benefits && (
            <Text style={styles.benefitText} numberOfLines={2}>
              ✨ {Array.isArray(benefits)
                ? benefits.slice(0, 2).join(' · ')
                : String(benefits)}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────
type Phase = 'input' | 'loading' | 'ar';

interface RouteParams {
  gemstone?: string;
  planet?: string;
  metal?: string;
  finger?: string;
  weight?: string;
  bestDay?: string;
  benefits?: string | string[];
}

export const ARGemstoneScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeParams: RouteParams = route.params ?? {};

  const { user } = useAuthStore();
  const { profile, loadProfile } = useProfileStore();
  const { format, ready } = useCurrency();

  // ── form state ──────────────────────────────────────────────────────────
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>(() => routeParams.gemstone ? 'ar' : 'input');
  const [showPayment, setShowPayment] = useState(false);

  // ── gemstone data ────────────────────────────────────────────────────────
  const [gemData, setGemData] = useState<RouteParams>(routeParams);

  // ── camera ──────────────────────────────────────────────────────────────
  const [camPermission, requestCamPermission] = useCameraPermissions();

  const captureViewRef = useRef<View>(null);

  // ── ring animation ───────────────────────────────────────────────────────
  const ringAnim = useRef(new Animated.Value(0)).current;
  const ringLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── sharing ──────────────────────────────────────────────────────────────
  const [sharing, setSharing] = useState(false);
  const [showTip, setShowTip] = useState(true);

  // Auto-fill profile
  useEffect(() => {
    if (user?.id) loadProfile(user.id, user.email);
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      if (profile.date_of_birth && !birthDate) setBirthDate(profile.date_of_birth);
      if (profile.time_of_birth && !birthTime) setBirthTime(profile.time_of_birth);
      if (profile.birth_place_label && !birthPlace) setBirthPlace(profile.birth_place_label);
    }
  }, [profile]);

  // Kick off AR immediately if launched with gemstone param
  useEffect(() => {
    if (routeParams.gemstone) {
      (async () => {
        if (!camPermission?.granted) await requestCamPermission();
      })();
    }
  }, []);

  // Start ring animation when AR phase is active
  useEffect(() => {
    if (phase === 'ar') {
      ringLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
          Animated.timing(ringAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
        ])
      );
      ringLoop.current.start();
      // Hide tip after 3.5s
      const t = setTimeout(() => setShowTip(false), 3500);
      return () => { clearTimeout(t); ringLoop.current?.stop(); };
    }
  }, [phase]);

  const fingerIndex = GEMSTONE_FINGER[gemData.gemstone ?? '']?.fingerIndex ?? 3;
  const gc = GEMSTONE_COLORS[gemData.gemstone ?? ''] ?? { color: theme.colors.gold, glow: theme.colors.gold, emoji: '💎' };

  // ── Fetch gemstone for standalone flow ───────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');

    if (!camPermission?.granted) {
      const res = await requestCamPermission();
      if (!res.granted) { setError('Camera permission required.'); return; }
    }

    setPhase('loading');
    try {
      const parts = birthPlace.split(',').map(s => s.trim());
      const { city, state, country } = {
        city: parts[0] ?? '',
        state: parts.length >= 3 ? parts[1] : '',
        country: parts[parts.length > 1 ? parts.length - 1 : 0] ?? '',
      };
      const data = await gemstoneApi.recommend({
        birthDate,
        birthTime: normalizeTime(birthTime),
        city,
        state,
        country,
      });
      const primary = data.recommendations?.[0];
      if (!primary) throw new Error('No gemstone recommended.');
      setGemData({
        gemstone: primary.gemstoneName ?? data.primaryGemstone,
        planet: primary.planet,
        metal: primary.metal,
        finger: primary.finger,
        weight: primary.weight,
        bestDay: primary.bestDay,
        benefits: primary.benefits ?? [],
      });
      setPhase('ar');
    } catch (e: any) {
      setError(e.message ?? 'Failed to get gemstone recommendation.');
      setPhase('input');
    }
  }, [birthDate, birthTime, birthPlace, camPermission]);

  const handleStartPayment = useCallback(() => {
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');
    setShowPayment(true);
  }, [birthDate, birthPlace]);

  const handlePaymentSuccess = useCallback(async (pmId: string, planId: string, amountUsd: number, name: string, email: string) => {
    const needsStripeCharge = pmId !== 'credits_only' && Platform.OS !== 'android';

    if (needsStripeCharge) {
      const res = await paymentsApi.chargeForFeature({
        feature: 'gemstone-try-ar',
        amountUsd,
        name,
        email,
        paymentMethodId: pmId,
      });

      if (!res.success) {
        throw new Error(res.error ?? 'Payment failed. Please try again.');
      }
    }

    setShowPayment(false);
    await handleAnalyze();
  }, [handleAnalyze]);

  // ── Share / save ─────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!captureViewRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(captureViewRef.current, { format: 'jpg', quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: `Share your ${gemData.gemstone} try-on 💎` });
    } catch {
      Alert.alert('Error', 'Could not capture screenshot.');
    } finally {
      setSharing(false);
    }
  }, [sharing, gemData]);

  // ── Render: Input phase ─────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <LinearGradient colors={[theme.colors.navy, '#0D1B3E']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <Text style={styles.headerEmoji}>💎</Text>
            <Text style={styles.headerTitle}>Gemstone Try-On</Text>
            <Text style={styles.headerSub}>
              Preview your Vedic-recommended gemstone on your hand using augmented reality.
            </Text>
          </View>

          {/* How it works */}
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How It Works</Text>
            {[
              ['💎', 'We determine your primary Vedic gemstone from your birth chart'],
              ['📷', 'Your back camera opens — hold your right hand in frame'],
              ['✨', 'See the glowing gemstone ring on the correct finger'],
              ['📸', 'Capture & share your try-on preview'],
            ].map(([icon, text], i) => (
              <View key={i} style={styles.howRow}>
                <Text style={styles.howIcon}>{icon}</Text>
                <Text style={styles.howText}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter Your Birth Details</Text>
            <DatePickerField label="Date of Birth" value={birthDate} onChangeText={setBirthDate} />
            <TimePickerField label="Time of Birth" value={birthTime} onChangeText={setBirthTime} />
            <PlaceInput label="Place of Birth" value={birthPlace} onChangeText={setBirthPlace} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <PrimaryButton label={ready ? `💎  Try On My Gemstone — ${format(0.2)}` : '💎  Try On My Gemstone'} onPress={handleStartPayment} style={styles.analyzeBtn} />

          <Text style={styles.noteText}>
            Includes one chart-based AR gemstone recommendation. Full multi-gem analysis remains available on the Gemstones screen.
          </Text>

          <PaymentModal
            visible={showPayment}
            title="Gemstone Try-On AR"
            subtitle="Unlock one chart-based gemstone recommendation and instant AR try-on"
            fixedAmountUsd={0.2}
            googlePlayProductId="gemstone_tryon_ar"
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Render: Loading ─────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <LinearGradient colors={[theme.colors.navy, '#0D1B3E']} style={styles.root}>
        <LoadingOverlay message="Finding your Vedic gemstone…\n\nAnalysing birth chart" />
      </LinearGradient>
    );
  }

  // ── Render: AR Try-On phase ─────────────────────────────────────────────
  return (
    <View style={styles.root} ref={captureViewRef as any}>
      {/* Camera — back-facing to see hand */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Hand guide + gem ring overlay */}
      <HandGuide
        fingerIndex={fingerIndex}
        gemColor={gc.color}
        gemGlow={gc.glow}
        ringAnim={ringAnim}
      />

      {/* Tip banner */}
      {showTip && (
        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            👆 Hold your RIGHT hand flat in front of the camera
          </Text>
        </View>
      )}

      {/* Top controls */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => routeParams.gemstone ? navigation.goBack() : setPhase('input')}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topLabelWrap}>
          <Text style={styles.topLabel}>{gc.emoji} {gemData.gemstone ?? 'Gemstone'} Try-On</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing
            ? <ActivityIndicator color={theme.colors.navy} size="small" />
            : <Text style={styles.shareTxt}>Share ↑</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Bottom info card */}
      <GemInfoCard
        gemstone={gemData.gemstone ?? ''}
        planet={gemData.planet ?? ''}
        metal={gemData.metal ?? 'Gold'}
        finger={GEMSTONE_FINGER[gemData.gemstone ?? '']?.finger ?? gemData.finger ?? 'Ring finger'}
        weight={gemData.weight ?? ''}
        bestDay={gemData.bestDay ?? ''}
        benefits={gemData.benefits ?? []}
      />

      {/* Floating switch-finger info if needed */}
      <View style={styles.fingerLabel}>
        <Text style={[styles.fingerLabelText, { color: gc.color }]}>
          Wear on: {GEMSTONE_FINGER[gemData.gemstone ?? '']?.finger ?? 'Ring finger'}
          {' '}· {GEMSTONE_FINGER[gemData.gemstone ?? '']?.hand ?? 'Right'} hand
        </Text>
      </View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.navy },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  backBtn: { marginTop: Platform.OS === 'ios' ? 56 : 36, marginBottom: 8 },
  backText: { color: theme.colors.gold, fontSize: 16, fontFamily: theme.fonts.body },

  headerBlock: { alignItems: 'center', marginVertical: 28 },
  headerEmoji: { fontSize: 52, marginBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 30, fontFamily: theme.fonts.heading, letterSpacing: 1 },
  headerSub: { color: '#aab', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21, fontFamily: theme.fonts.body },

  howCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 18 },
  howTitle: { color: theme.colors.gold, fontSize: 15, fontFamily: theme.fonts.heading, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  howIcon: { fontSize: 20, width: 32 },
  howText: { color: '#ccd', fontSize: 13.5, fontFamily: theme.fonts.body, flex: 1, lineHeight: 20 },

  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18, marginBottom: 18 },
  formTitle: { color: '#fff', fontSize: 16, fontFamily: theme.fonts.heading, marginBottom: 14 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 8, fontFamily: theme.fonts.body },

  analyzeBtn: { marginBottom: 12 },
  noteText: { color: '#667', fontSize: 12, textAlign: 'center', fontFamily: theme.fonts.body, lineHeight: 18 },

  // AR overlays
  guideTextWrap: { position: 'absolute', top: Platform.OS === 'ios' ? 106 : 86, left: 0, right: 0, alignItems: 'center' },
  guideTextBox: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  guideTextLine: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', fontFamily: theme.fonts.body },

  fingerGuide: { position: 'absolute', borderWidth: 1 },

  palmBox: {
    position: 'absolute',
    left: SW * 0.19,
    top: SH * 0.45,
    width: SW * 0.54,
    height: SH * 0.18,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  gemRingGlow: {
    position: 'absolute',
    width: 60,
    height: 36,
    borderRadius: 18,
  },
  gemRing: {
    position: 'absolute',
    width: 44,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  gemEmoji: { fontSize: 16, marginTop: -2 },

  tipBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 82,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  tipText: { color: '#fff', fontSize: 14, fontFamily: theme.fonts.body, textAlign: 'center' },

  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.55)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 18 },
  topLabelWrap: { flex: 1, alignItems: 'center' },
  topLabel: { color: '#fff', fontSize: 15, fontFamily: theme.fonts.heading, textShadowColor: '#000a', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  shareBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  shareTxt: { color: theme.colors.navy, fontSize: 13, fontFamily: theme.fonts.heading, fontWeight: '700' },

  infoCard: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  infoGrad: { paddingTop: 70 },
  infoInner: { paddingHorizontal: 18, paddingBottom: Platform.OS === 'ios' ? 38 : 22 },

  gemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  gemDot: { width: 20, height: 20, borderRadius: 10, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, shadowOpacity: 0.9, elevation: 6 },
  gemName: { fontSize: 22, fontFamily: theme.fonts.heading },
  gemPlanet: { color: '#aab', fontSize: 13, fontFamily: theme.fonts.body },

  detailRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  detailItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, alignItems: 'center' },
  detailLabel: { color: '#778', fontSize: 10, fontFamily: theme.fonts.body, marginBottom: 3 },
  detailValue: { color: '#dde', fontSize: 12, fontFamily: theme.fonts.body, textAlign: 'center' },

  benefitText: { color: 'rgba(255,255,255,0.65)', fontSize: 12.5, fontFamily: theme.fonts.body, fontStyle: 'italic', lineHeight: 18 },

  fingerLabel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 165 : 148,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fingerLabelText: { fontSize: 13, fontFamily: theme.fonts.heading, textShadowColor: '#000a', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
});
