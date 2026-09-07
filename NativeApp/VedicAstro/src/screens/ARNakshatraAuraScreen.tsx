/**
 * ARNakshatraAuraScreen.tsx
 *
 * AR Selfie Aura + Vedic Face Reading
 *
 * Flow:
 *  1. User enters birth details (auto-filled from profile).
 *  2. Birth chart fetched → Moon Nakshatra resolved.
 *  3. Front camera opens with animated Nakshatra aura rings overlay.
 *  4. User can tap "Read My Face" to capture a selfie → GPT-4 Vision
 *     analyses it against the Nakshatra → Samudrika Shastra face reading
 *     displayed in a bottom sheet modal.
 *  5. Share snapshot (aura + face reading card) via expo-sharing.
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
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';

import * as Sharing from 'expo-sharing';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';

import { theme } from '../theme/theme';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PaymentModal } from '../components/PaymentModal';
import { predictionsApi, faceReadingApi, paymentsApi } from '../api/services';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { NAKSHATRA_AURAS, NakshatraAura } from '../data/nakshatraAura';
import { useCurrency } from '../hooks/useCurrency';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Helper: resolve Nakshatra from chart response ─────────────────────────
// API returns: { planets: [{ name: 'Moon', nakshatra: 'Rohini', siderealLongitude: 47.3 }] }
function resolveNakshatra(chart: any): NakshatraAura {
  const moonPlanet = (chart?.planets as any[])?.find(
    (p: any) => (p?.name ?? '').toLowerCase() === 'moon'
  );

  // 1. Try exact nakshatra name match (case-insensitive, trimmed)
  const moonNakStr: string | undefined = moonPlanet?.nakshatra;
  if (moonNakStr) {
    const nakLower = moonNakStr.trim().toLowerCase();
    // Exact full-name match first
    const exact = NAKSHATRA_AURAS.find(n => n.name.toLowerCase() === nakLower);
    if (exact) return exact;

    // Normalised match: collapse spaces/hyphens, remove diacritics-like variants
    const normalise = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
    const normNak = normalise(moonNakStr);
    const normed = NAKSHATRA_AURAS.find(n => normalise(n.name) === normNak);
    if (normed) return normed;
  }

  // 2. Fallback: derive from Moon's sidereal longitude (most accurate)
  const moonLon: number = moonPlanet?.siderealLongitude ?? 0;
  const idx = Math.floor(((moonLon % 360) + 360) % 360 / (360 / 27));
  return NAKSHATRA_AURAS[idx] ?? NAKSHATRA_AURAS[0];
}

// ─── Animated Aura Ring component ─────────────────────────────────────────
const RING_COUNT = 5;

interface AuraOverlayProps {
  aura: NakshatraAura;
  pulseAnim: Animated.Value;
  shimmerAnim: Animated.Value;
}

const AuraOverlay: React.FC<AuraOverlayProps> = ({ aura, pulseAnim, shimmerAnim }) => {
  const cx = SW / 2;
  const cy = SH * 0.38; // face center Y guess
  const baseR = SW * 0.34;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SW} height={SH}>
        <Defs>
          {[0, 1, 2].map(gi => (
            <RadialGradient key={gi} id={`grad${gi}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={aura.colors[gi]} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={aura.colors[gi]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        {/* Outer diffuse glow */}
        <Circle cx={cx} cy={cy} r={baseR * 2.2} fill="url(#grad2)" opacity={0.25} />
        <Circle cx={cx} cy={cy} r={baseR * 1.7} fill="url(#grad1)" opacity={0.3} />
        <Circle cx={cx} cy={cy} r={baseR * 1.2} fill="url(#grad0)" opacity={0.35} />

        {/* Head halo */}
        <Ellipse
          cx={cx}
          cy={cy - baseR * 0.55}
          rx={baseR * 0.72}
          ry={baseR * 0.28}
          fill="none"
          stroke={aura.colors[0]}
          strokeWidth={2.5}
          opacity={0.6}
        />
      </Svg>

      {/* Animated pulsing rings via Animated.View + border radius */}
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const ringSize = baseR * (0.9 + i * 0.38);
        const opacity = pulseAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [aura.glowIntensity * (0.45 - i * 0.07), aura.glowIntensity * (0.15 - i * 0.02), aura.glowIntensity * (0.45 - i * 0.07)],
        });
        const scale = pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + i * 0.03],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.auraRing,
              {
                width: ringSize * 2,
                height: ringSize * 2,
                borderRadius: ringSize,
                borderColor: aura.colors[i % 3],
                opacity,
                transform: [
                  { translateX: cx - ringSize },
                  { translateY: cy - ringSize },
                  { scale },
                ],
              },
            ]}
          />
        );
      })}

      {/* Shimmer particles */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = baseR * (1.1 + (i % 3) * 0.3);
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        const particleOpacity = shimmerAnim.interpolate({
          inputRange: [0, 0.3 + i * 0.07, 1],
          outputRange: [0, 0.9, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={`p${i}`}
            style={[
              styles.particle,
              {
                left: px - 3,
                top: py - 3,
                backgroundColor: aura.colors[i % 3],
                opacity: particleOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Phase = 'input' | 'loading' | 'camera';
type FacePhase = 'idle' | 'capturing' | 'analysing' | 'result';

// ─── Face Feature Card ───────────────────────────────────────────────────────
const FEATURE_ICONS: Record<string, string> = {
  Eyes: '👁️', Nose: '👃', Lips: '👄', Forehead: '🧠', Jawline: '💪',
};

function FeatureCard({ feature, observation, vedicMeaning, prediction, color }: {
  feature: string; observation: string; vedicMeaning: string; prediction: string; color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.85}>
      <View style={[faceStyles.featureCard, { borderColor: color + '55' }]}>
        <View style={faceStyles.featureRow}>
          <Text style={faceStyles.featureIcon}>{FEATURE_ICONS[feature] ?? '✦'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[faceStyles.featureName, { color }]}>{feature}</Text>
            <Text style={faceStyles.featureObs} numberOfLines={open ? 0 : 2}>{observation}</Text>
          </View>
          <Text style={[faceStyles.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
        </View>
        {open && (
          <View style={faceStyles.featureDetail}>
            <Text style={faceStyles.detailLabel}>Vedic Meaning</Text>
            <Text style={faceStyles.detailText}>{vedicMeaning}</Text>
            <Text style={faceStyles.detailLabel}>Prediction</Text>
            <Text style={faceStyles.detailText}>{prediction}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Face Reading Result Modal ────────────────────────────────────────────────
function FaceResultModal({ result, aura, previewUri, onClose }: {
  result: any; aura: NakshatraAura; previewUri: string | null; onClose: () => void;
}) {
  const alignment = result?.nakshatraMatch?.alignmentLevel ?? 'Moderate';
  const alignColor = alignment === 'Strong' ? '#2ECC71' : alignment === 'Moderate' ? theme.colors.gold : '#A29BFE';
  const features = [
    result?.eyes, result?.nose, result?.lips, result?.forehead, result?.jawline,
  ].filter(Boolean);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={faceStyles.modalRoot}>
        {/* Header */}
        <LinearGradient colors={[theme.colors.navy, '#0D1B3E']} style={faceStyles.modalHeader}>
          <View style={faceStyles.modalHeaderRow}>
            <Text style={faceStyles.modalTitle}>👁️ Face Reading</Text>
            <TouchableOpacity onPress={onClose} style={faceStyles.modalCloseBtn}>
              <Text style={faceStyles.modalCloseTxt}>✕ Done</Text>
            </TouchableOpacity>
          </View>
          {/* Nakshatra alignment badge */}
          <View style={[faceStyles.alignBadge, { borderColor: alignColor }]}>
            <Text style={faceStyles.alignSymbol}>{aura.symbol}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[faceStyles.alignNak, { color: alignColor }]}>
                {result?.nakshatraMatch?.nakshatra ?? aura.name} · {alignment} Alignment
              </Text>
              <Text style={faceStyles.alignMsg} numberOfLines={3}>
                {result?.nakshatraMatch?.alignmentMessage ?? ''}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={faceStyles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Selfie thumbnail + summary */}
          <View style={faceStyles.summaryRow}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={faceStyles.thumbImg} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={faceStyles.cosmicText}>{result?.cosmicSummary ?? ''}</Text>
            </View>
          </View>

          {/* Quick stats */}
          <View style={faceStyles.statsRow}>
            {[
              { label: 'Face Shape', value: result?.faceShape ?? '—' },
              { label: 'Element', value: result?.dominantElement ?? '—' },
              { label: 'Energy', value: result?.energyType ?? '—' },
            ].map((s, i) => (
              <View key={i} style={[faceStyles.statBox, { borderColor: aura.colors[i % 3] + '55' }]}>
                <Text style={faceStyles.statLabel}>{s.label}</Text>
                <Text style={[faceStyles.statValue, { color: aura.colors[i % 3] }]} numberOfLines={2}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Feature cards */}
          <Text style={faceStyles.sectionTitle}>✦ Feature Readings</Text>
          {features.map((f: any, i: number) => (
            <FeatureCard
              key={i}
              feature={f.feature ?? ''}
              observation={f.observation ?? ''}
              vedicMeaning={f.vedicMeaning ?? ''}
              prediction={f.prediction ?? ''}
              color={aura.colors[i % 3]}
            />
          ))}

          {/* Strengths */}
          {(result?.strengths?.length ?? 0) > 0 && (
            <>
              <Text style={faceStyles.sectionTitle}>⚡ Strengths</Text>
              <View style={faceStyles.tagWrap}>
                {(result.strengths as string[]).map((s: string, i: number) => (
                  <View key={i} style={[faceStyles.tag, { backgroundColor: '#2ECC71' + '22', borderColor: '#2ECC71' + '55' }]}>
                    <Text style={[faceStyles.tagText, { color: '#2ECC71' }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Challenges */}
          {(result?.challenges?.length ?? 0) > 0 && (
            <>
              <Text style={faceStyles.sectionTitle}>🌊 Challenges</Text>
              <View style={faceStyles.tagWrap}>
                {(result.challenges as string[]).map((s: string, i: number) => (
                  <View key={i} style={[faceStyles.tag, { backgroundColor: '#E17055' + '22', borderColor: '#E17055' + '55' }]}>
                    <Text style={[faceStyles.tagText, { color: '#E17055' }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Life Guidance */}
          {(result?.lifeGuidance?.length ?? 0) > 0 && (
            <>
              <Text style={faceStyles.sectionTitle}>🌟 Cosmic Guidance</Text>
              {(result.lifeGuidance as string[]).map((g: string, i: number) => (
                <View key={i} style={faceStyles.guidanceRow}>
                  <Text style={[faceStyles.guidanceDot, { color: aura.colors[i % 3] }]}>◆</Text>
                  <Text style={faceStyles.guidanceText}>{g}</Text>
                </View>
              ))}
            </>
          )}

          {/* Lucky details */}
          <View style={faceStyles.luckyRow}>
            {[
              { label: 'Lucky Colour', value: result?.luckyColor ?? '—', icon: '🎨' },
              { label: 'Power Day', value: result?.powerDay ?? '—', icon: '📅' },
            ].map((l, i) => (
              <View key={i} style={faceStyles.luckyBox}>
                <Text style={faceStyles.luckyIcon}>{l.icon}</Text>
                <Text style={faceStyles.luckyLabel}>{l.label}</Text>
                <Text style={[faceStyles.luckyValue, { color: aura.colors[i % 3] }]}>{l.value}</Text>
              </View>
            ))}
          </View>

          {/* Mantra */}
          {!!result?.mantra && (
            <View style={[faceStyles.mantraBox, { borderColor: aura.colors[0] + '55' }]}>
              <Text style={faceStyles.mantraLabel}>Your Power Mantra</Text>
              <Text style={[faceStyles.mantraText, { color: aura.colors[0] }]}>{result.mantra}</Text>
            </View>
          )}

          <Text style={faceStyles.disclaimer}>{result?.disclaimer ?? ''}</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export const ARNakshatraAuraScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { profile, loadProfile } = useProfileStore();
  const { format, ready } = useCurrency();

  // ── form state ──────────────────────────────────────────────────────────
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthPlace, setBirthPlace] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [showPayment, setShowPayment] = useState(false);

  // ── camera ──────────────────────────────────────────────────────────────
  const [camPermission, requestCamPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const captureViewRef = useRef<View>(null);

  // ── aura ─────────────────────────────────────────────────────────────────
  const [aura, setAura] = useState<NakshatraAura | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── face reading ─────────────────────────────────────────────────────────
  const [facePhase, setFacePhase] = useState<FacePhase>('idle');
  const [facePreviewUri, setFacePreviewUri] = useState<string | null>(null);
  const [facePreviewBase64, setFacePreviewBase64] = useState('');
  const [faceResult, setFaceResult] = useState<any>(null);
  const [faceError, setFaceError] = useState('');
  const [showFaceModal, setShowFaceModal] = useState(false);

  // ── snapshot ─────────────────────────────────────────────────────────────
  const [sharing, setSharing] = useState(false);

  // Auto-fill from profile
  useEffect(() => {
    if (user?.id) loadProfile(user.id, user.email);
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      if (profile.date_of_birth) setBirthDate(profile.date_of_birth);
      if (profile.time_of_birth) setBirthTime(profile.time_of_birth);
      if (profile.birth_place_label) setBirthPlace(profile.birth_place_label);
    }
  }, [profile]);

  // Start aura animations when camera phase starts
  useEffect(() => {
    if (phase === 'camera') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
        ])
      );
      shimmerLoop.current = Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3200, useNativeDriver: true })
      );
      pulseLoop.current.start();
      shimmerLoop.current.start();
    }
    return () => {
      pulseLoop.current?.stop();
      shimmerLoop.current?.stop();
    };
  }, [phase]);

  const handleReveal = useCallback(async () => {
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');

    // Request camera permission first
    if (!camPermission?.granted) {
      const res = await requestCamPermission();
      if (!res.granted) { setError('Camera permission required.'); return; }
    }

    setPhase('loading');
    try {
      const parts = birthPlace.split(',').map(s => s.trim());
      const placeFormatted = parts.length >= 2 ? birthPlace : birthPlace + ', India';
      const chart = await predictionsApi.fetchBirthChart({
        dateOfBirth: birthDate,
        timeOfBirth: birthTime,
        placeOfBirth: placeFormatted,
      });
      const resolved = resolveNakshatra(chart);
      setAura(resolved);
      setPhase('camera');
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch birth chart. Please try again.');
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
        feature: 'nakshatra-aura-ar',
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
    await handleReveal();
  }, [handleReveal]);

  // ── face capture ──────────────────────────────────────────────────────────
  const handleCaptureFace = useCallback(async () => {
    if (!cameraRef.current || !aura) return;
    setFacePhase('capturing');
    setFaceError('');
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.72 });
      setFacePreviewUri(photo!.uri);
      setFacePreviewBase64(photo!.base64 ?? '');
      setFacePhase('analysing');
      const data = await faceReadingApi.analyze(photo!.base64 ?? '', aura.name, aura.planet);
      setFaceResult(data);
      setFacePhase('result');
      setShowFaceModal(true);
    } catch (e: any) {
      setFaceError(e.message ?? 'Face analysis failed. Please try again.');
      setFacePhase('idle');
    }
  }, [aura]);

  const handleShare = useCallback(async () => {
    if (!captureViewRef.current) {
      Alert.alert('Error', 'Could not capture screenshot.');
      return;
    }
    setSharing(true);
    try {
      const uri = await captureRef(captureViewRef.current, { format: 'jpg', quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Share your Nakshatra Aura ✨' });
    } catch (e) {
      Alert.alert('Error', 'Could not capture screenshot.');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  // ── Render: Input phase ────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <LinearGradient colors={[theme.colors.navy, '#0D1B3E']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerEmoji}>✨</Text>
            <Text style={styles.headerTitle}>Nakshatra Aura</Text>
            <Text style={styles.headerSub}>
              Reveal the cosmic energy field unique to your Moon Nakshatra in augmented reality.
            </Text>
          </View>

          {/* How it works */}
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How It Works</Text>
            {[
              ['🌙', 'We calculate your Moon Nakshatra from your birth details'],
              ['🎨', 'Each of the 27 Nakshatras has a unique aura colour & energy'],
              ['📸', 'Your aura rings appear live over the front camera'],
              ['🌟', 'Capture & share your cosmic selfie'],
            ].map(([icon, text], i) => (
              <View key={i} style={styles.howRow}>
                <Text style={styles.howIcon}>{icon}</Text>
                <Text style={styles.howText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter Your Birth Details</Text>
            <DatePickerField label="Date of Birth" value={birthDate} onChangeText={setBirthDate} />
            <TimePickerField label="Time of Birth" value={birthTime} onChangeText={setBirthTime} />
            <PlaceInput label="Place of Birth" value={birthPlace} onChangeText={setBirthPlace} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <PrimaryButton label={ready ? `✨  Reveal My Aura — ${format(0.2)}` : '✨  Reveal My Aura'} onPress={handleStartPayment} style={styles.revealBtn} />

          <Text style={styles.freeNote}>Localized pricing shown automatically for your country.</Text>

          <PaymentModal
            visible={showPayment}
            title="Nakshatra Aura AR"
            subtitle="Unlock your aura reveal, live camera overlay, and shareable cosmic selfie"
            fixedAmountUsd={0.2}
            googlePlayProductId="nakshatra_aura_ar"
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Render: Loading phase ─────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <LinearGradient colors={[theme.colors.navy, '#0D1B3E']} style={styles.root}>
        <LoadingOverlay
          message={`Calculating your Moon Nakshatra…\n\nFetching birth chart from Swiss Ephemeris`}
        />
      </LinearGradient>
    );
  }

  // ── Render: Camera / Aura phase ───────────────────────────────────────
  if (!aura) return null;

  return (
    <View style={styles.root} ref={captureViewRef as any}>
      {/* Camera feed */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={'front' as CameraType}
      />

      {/* Animated aura overlay */}
      <AuraOverlay aura={aura} pulseAnim={pulseAnim} shimmerAnim={shimmerAnim} />

      {/* Bottom info card */}
      <View style={styles.infoCard} pointerEvents="box-none">
        <LinearGradient
          colors={['transparent', 'rgba(8,14,26,0.94)']}
          style={styles.infoGrad}
        >
          <View style={styles.infoContent}>
            {/* Nakshatra badge */}
            <View style={[styles.badge, { borderColor: aura.colors[0] }]}>
              <Text style={styles.badgeSymbol}>{aura.symbol}</Text>
              <View>
                <Text style={[styles.nakName, { color: aura.colors[0] }]}>{aura.name}</Text>
                <Text style={styles.nakSub}>Moon Nakshatra · Ruled by {aura.planet}</Text>
              </View>
            </View>

            {/* Element & Shakti row */}
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: aura.colors[0] + '33' }]}>
                <Text style={[styles.pillText, { color: aura.colors[0] }]}>
                  {aura.element} Element
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: aura.colors[1] + '33' }]}>
                <Text style={[styles.pillText, { color: aura.colors[1] }]}>
                  Shakti: {aura.shakti}
                </Text>
              </View>
            </View>

            {/* Mantra */}
            <Text style={styles.mantraText}>{aura.mantra} नमः</Text>

            {/* Aura colour dots */}
            <View style={styles.colorRow}>
              <Text style={styles.colorLabel}>Your Aura Colours:</Text>
              {aura.colors.map((c, i) => (
                <View key={i} style={[styles.colorDot, { backgroundColor: c }]} />
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Top controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setPhase('input')}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topLabelWrap}>
          <Text style={styles.topLabel}>Nakshatra Aura</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.shareTxt}>Share ↑</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Face reading CTA */}
      <View style={styles.faceBarWrap}>
        {facePhase === 'capturing' || facePhase === 'analysing' ? (
          <View style={styles.faceLoadingRow}>
            <ActivityIndicator color={aura!.colors[0]} size="small" />
            <Text style={[styles.faceLoadingTxt, { color: aura!.colors[0] }]}>
              {facePhase === 'capturing' ? 'Capturing…' : 'Reading your face…'}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.faceBtn, { borderColor: aura!.colors[0] }]}
              onPress={handleCaptureFace}
            >
              <Text style={styles.faceBtnIcon}>🔮</Text>
              <Text style={[styles.faceBtnTxt, { color: aura!.colors[0] }]}>Read My Face</Text>
            </TouchableOpacity>
            {faceResult && (
              <TouchableOpacity
                style={[styles.faceViewBtn, { borderColor: aura!.colors[1] }]}
                onPress={() => setShowFaceModal(true)}
              >
                <Text style={[styles.faceViewTxt, { color: aura!.colors[1] }]}>View Reading ↗</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {!!faceError && <Text style={styles.faceErrorTxt}>{faceError}</Text>}
      </View>

      {/* Face reading result modal */}
      {showFaceModal && faceResult && aura && (
        <FaceResultModal
          result={faceResult}
          aura={aura}
          previewUri={facePreviewUri}
          onClose={() => setShowFaceModal(false)}
        />
      )}
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

  revealBtn: { marginBottom: 12 },
  freeNote: { color: '#667', fontSize: 12, textAlign: 'center', fontFamily: theme.fonts.body },

  // Camera overlay
  auraRing: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  infoCard: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  infoGrad: { paddingTop: 60 },
  infoContent: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badgeSymbol: { fontSize: 32 },
  nakName: { fontSize: 22, fontFamily: theme.fonts.heading, letterSpacing: 0.5 },
  nakSub: { color: '#bbc', fontSize: 12, fontFamily: theme.fonts.body, marginTop: 2 },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { fontSize: 12, fontFamily: theme.fonts.body, fontWeight: '600' },

  mantraText: { color: 'rgba(255,255,255,0.7)', fontSize: 17, textAlign: 'center', fontFamily: theme.fonts.heading, marginBottom: 12, letterSpacing: 1 },

  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorLabel: { color: '#99a', fontSize: 12, fontFamily: theme.fonts.body },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#fff3' },

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
  topLabel: { color: '#fff', fontSize: 16, fontFamily: theme.fonts.heading, textShadowColor: '#000a', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  shareBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  shareTxt: { color: theme.colors.navy, fontSize: 13, fontFamily: theme.fonts.heading, fontWeight: '700' },

  faceBarWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  faceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  faceBtnIcon: { fontSize: 20 },
  faceBtnTxt: { fontSize: 15, fontFamily: theme.fonts.heading, fontWeight: '700' },
  faceViewBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  faceViewTxt: { fontSize: 13, fontFamily: theme.fonts.body, fontWeight: '600' },
  faceLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  faceLoadingTxt: { fontSize: 14, fontFamily: theme.fonts.body },
  faceErrorTxt: { color: '#FF6B6B', fontSize: 12, fontFamily: theme.fonts.body, textAlign: 'center', marginTop: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
});

// ─── Face Reading Modal Styles ─────────────────────────────────────────────
const faceStyles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: theme.colors.navy },
  modalHeader: { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16, paddingHorizontal: 18 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { color: '#fff', fontSize: 22, fontFamily: theme.fonts.heading },
  modalCloseBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  modalCloseTxt: { color: '#ddd', fontSize: 13, fontFamily: theme.fonts.body },

  alignBadge: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  alignSymbol: { fontSize: 32 },
  alignNak: { fontSize: 15, fontFamily: theme.fonts.heading, fontWeight: '700' },
  alignMsg: { color: '#bbc', fontSize: 12.5, fontFamily: theme.fonts.body, marginTop: 3, lineHeight: 18 },

  modalScroll: { padding: 18 },

  summaryRow: { flexDirection: 'row', gap: 14, marginBottom: 18, alignItems: 'flex-start' },
  thumbImg: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#fff2' },
  cosmicText: { color: '#ccd', fontSize: 13.5, fontFamily: theme.fonts.body, lineHeight: 20, flex: 1 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  statLabel: { color: '#99a', fontSize: 10, fontFamily: theme.fonts.body, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontFamily: theme.fonts.heading, textAlign: 'center' },

  sectionTitle: { color: '#fff', fontSize: 15, fontFamily: theme.fonts.heading, marginBottom: 10, marginTop: 4 },

  featureCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 22, width: 30 },
  featureName: { fontSize: 14, fontFamily: theme.fonts.heading, fontWeight: '700', marginBottom: 3 },
  featureObs: { color: '#bbc', fontSize: 12.5, fontFamily: theme.fonts.body, lineHeight: 18 },
  chevron: { fontSize: 11, fontFamily: theme.fonts.body, width: 20, textAlign: 'center' },
  featureDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  detailLabel: { color: '#88a', fontSize: 10.5, fontFamily: theme.fonts.body, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  detailText: { color: '#ccd', fontSize: 13, fontFamily: theme.fonts.body, lineHeight: 19, marginBottom: 10 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12.5, fontFamily: theme.fonts.body, fontWeight: '600' },

  guidanceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  guidanceDot: { fontSize: 14, marginTop: 2 },
  guidanceText: { color: '#ccd', fontSize: 13.5, fontFamily: theme.fonts.body, lineHeight: 20, flex: 1 },

  luckyRow: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 14 },
  luckyBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' },
  luckyIcon: { fontSize: 24, marginBottom: 6 },
  luckyLabel: { color: '#99a', fontSize: 10, fontFamily: theme.fonts.body, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  luckyValue: { fontSize: 14, fontFamily: theme.fonts.heading, textAlign: 'center' },

  mantraBox: { borderWidth: 1.5, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 14 },
  mantraLabel: { color: '#99a', fontSize: 11, fontFamily: theme.fonts.body, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  mantraText: { fontSize: 18, fontFamily: theme.fonts.heading, textAlign: 'center', letterSpacing: 1 },

  disclaimer: { color: '#667', fontSize: 11, fontFamily: theme.fonts.body, textAlign: 'center', fontStyle: 'italic', marginTop: 8 },
});
