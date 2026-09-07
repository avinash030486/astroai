/**
 * PalmistryScreen.tsx
 *
 * Vedic Palmistry — capture a palm photo → GPT-4 Vision → detailed Jyotish reading
 * States: idle (live camera) → capturing → analysing → result
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Dimensions, Image, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { PaymentModal } from '../components/PaymentModal';
import { palmistryApi, paymentsApi } from '../api/services';
import { useCurrency } from '../hooks/useCurrency';
import { theme } from '../theme/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely coerce a value to string[] — handles array, comma-string, or undefined */
function toArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

function LineCard({ name, icon, condition, interpretation, prediction, color }: {
  name: string; icon: string; condition: string;
  interpretation: string; prediction: string; color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.85}>
      <LinearGradient colors={[color + '28', color + '10']} style={styles.lineCard}>
        <View style={styles.lineCardHeader}>
          <View style={[styles.lineIcon, { backgroundColor: color + '40', borderColor: color }]}>
            <Text style={styles.lineIconText}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lineName, { color }]}>{name}</Text>
            <Text style={styles.lineCondition}>{condition}</Text>
          </View>
          <Text style={[styles.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
        </View>
        {open && (
          <View style={styles.lineDetail}>
            <Text style={styles.lineDetailLabel}>Interpretation</Text>
            <Text style={styles.lineDetailText}>{interpretation}</Text>
            <Text style={styles.lineDetailLabel}>Prediction</Text>
            <Text style={styles.lineDetailText}>{prediction}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function InfoChip({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '80', backgroundColor: color + '20' }]}>
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type Stage = 'idle' | 'preview' | 'analysing' | 'result';

export const PalmistryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { format, ready } = useCurrency();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<Stage>('idle');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // ── capture ─────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.72 });
      setPreviewUri(photo!.uri);
      setPreviewBase64(photo!.base64 ?? '');
      setStage('preview');
    } catch {
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.');
    }
  };

  // ── analyse ─────────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    setStage('analysing');
    setError('');
    try {
      const data = await palmistryApi.analyzePalm(
        previewBase64,
        user?.email?.split('@')[0],
      );
      setResult(data);
      setStage('result');
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
      setStage('preview');
    }
  };

  const handleUnlockPress = () => {
    setError('');
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (pmId: string, planId: string, amountUsd: number, name: string, email: string) => {
    const needsStripeCharge = pmId !== 'credits_only' && Platform.OS !== 'android';

    if (needsStripeCharge) {
      const res = await paymentsApi.chargeForFeature({
        feature: 'palmistry',
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
    await handleAnalyse();
  };

  // ── reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setStage('idle');
    setPreviewUri(null);
    setPreviewBase64('');
    setResult(null);
    setError('');
  };

  // ── permission gate ──────────────────────────────────────────────────────────
  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.centre]}>
        <Text style={styles.permText}>Camera permission is required for palmistry reading.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── result ───────────────────────────────────────────────────────────────────
  if (stage === 'result' && result) {
    const LINE_DEFS = [
      { key: 'heartLine',  icon: '❤️', color: '#E74C3C', data: result.heartLine },
      { key: 'headLine',   icon: '🧠', color: '#3498DB', data: result.headLine },
      { key: 'lifeLine',   icon: '🌿', color: '#27AE60', data: result.lifeLine },
      { key: 'fateLine',   icon: '⭐', color: '#F39C12', data: result.fateLine },
    ];
    const p = result.personality ?? {};
    const mounts: any[] = Array.isArray(result.mounts) ? result.mounts : [];
    const remedies: string[] = toArr(result.remedies);
    const debts: string[] = toArr(result.karmicDebts);

    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* header */}
        <LinearGradient colors={['#1a0533', '#0d0022']} style={styles.header}>
          <TouchableOpacity onPress={reset} style={styles.backBtn}>
            <Text style={styles.backArrow}>← New Reading</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🖐 Palm Reading</Text>
          <View style={{ width: 100 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          {/* overall banner */}
          <LinearGradient colors={['#2d0050', '#1a0033']} style={styles.overallBanner}>
            <Text style={styles.overallEmoji}>🔮</Text>
            <Text style={styles.overallTitle}>{result.dominantHand ?? 'Right'} Hand Reading</Text>
            <Text style={styles.overallText}>{result.overallReading}</Text>
          </LinearGradient>

          {/* palm lines */}
          <Text style={styles.sectionTitle}>Palm Lines</Text>
          {LINE_DEFS.map(l => l.data ? (
            <LineCard
              key={l.key}
              name={l.data.name ?? l.key}
              icon={l.icon}
              color={l.color}
              condition={l.data.condition ?? ''}
              interpretation={l.data.interpretation ?? ''}
              prediction={l.data.prediction ?? ''}
            />
          ) : null)}

          {/* personality */}
          {p.element && (
            <>
              <Text style={styles.sectionTitle}>Personality</Text>
              <LinearGradient colors={['#0d2240', '#0a1a30']} style={styles.persCard}>
                <View style={styles.persRow}>
                  <Text style={styles.persLabel}>Element</Text>
                  <Text style={styles.persValue}>{p.element}</Text>
                  <Text style={styles.persLabel}>Temperament</Text>
                  <Text style={styles.persValue}>{p.temperament}</Text>
                </View>
                {toArr(p.strengths).length > 0 && (
                  <View style={styles.chipsRow}>
                    <Text style={styles.chipGroupLabel}>💪 Strengths</Text>
                    <View style={styles.chipsWrap}>
                      {toArr(p.strengths).map((s: string) => <InfoChip key={s} text={s} color="#27AE60" />)}
                    </View>
                  </View>
                )}
                {toArr(p.weaknesses).length > 0 && (
                  <View style={styles.chipsRow}>
                    <Text style={styles.chipGroupLabel}>⚠️ Challenges</Text>
                    <View style={styles.chipsWrap}>
                      {toArr(p.weaknesses).map((s: string) => <InfoChip key={s} text={s} color="#E74C3C" />)}
                    </View>
                  </View>
                )}
                {toArr(p.careerSuggestions).length > 0 && (
                  <View style={styles.chipsRow}>
                    <Text style={styles.chipGroupLabel}>💼 Career</Text>
                    <View style={styles.chipsWrap}>
                      {toArr(p.careerSuggestions).map((s: string) => <InfoChip key={s} text={s} color="#3498DB" />)}
                    </View>
                  </View>
                )}
                <View style={styles.persRow}>
                  <Text style={styles.persLabel}>Love Nature</Text>
                  <Text style={styles.persValueWide}>{p.relationshipNature}</Text>
                </View>
              </LinearGradient>
            </>
          )}

          {/* mounts */}
          {mounts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Planetary Mounts</Text>
              {mounts.map((m: any, i: number) => (
                <LinearGradient key={i} colors={['#1a1a2e', '#16213e']} style={styles.mountCard}>
                  <Text style={styles.mountName}>{m.name}</Text>
                  <Text style={styles.mountDev}>{m.development}</Text>
                  <Text style={styles.mountMeaning}>{m.meaning}</Text>
                </LinearGradient>
              ))}
            </>
          )}

          {/* lucky */}
          <View style={styles.luckyRow}>
            {result.luckyColor && <View style={[styles.luckyBox, { borderColor: '#D4A843' }]}>
              <Text style={styles.luckyLabel}>Lucky Colour</Text>
              <Text style={styles.luckyVal}>{result.luckyColor}</Text>
            </View>}
            {result.luckyNumber && <View style={[styles.luckyBox, { borderColor: '#9B59B6' }]}>
              <Text style={styles.luckyLabel}>Lucky Number</Text>
              <Text style={styles.luckyVal}>{result.luckyNumber}</Text>
            </View>}
            {result.suggestedGemstone && <View style={[styles.luckyBox, { borderColor: '#3498DB' }]}>
              <Text style={styles.luckyLabel}>Gemstone</Text>
              <Text style={styles.luckyVal}>{result.suggestedGemstone}</Text>
            </View>}
          </View>

          {/* life milestones */}
          {result.lifeMilestones && (
            <>
              <Text style={styles.sectionTitle}>🔮 Life Milestone Predictions</Text>
              <LinearGradient colors={['#1a0d2e', '#0d0022']} style={styles.milestonesCard}>
                {([
                  { icon: '💍', label: 'Marriage Age',        value: result.lifeMilestones.marriageAge,        sub: result.lifeMilestones.marriageNature },
                  { icon: '💼', label: 'Career Breakthrough', value: result.lifeMilestones.careerBreakAge,     sub: result.lifeMilestones.careerField },
                  { icon: '🏥', label: 'Health Watch Period', value: result.lifeMilestones.healthCrisisAge,    sub: result.lifeMilestones.healthAdvice },
                  { icon: '🏠', label: 'Property Acquisition',value: result.lifeMilestones.propertyAge,        sub: '' },
                  { icon: '💰', label: 'Wealth Peak',         value: result.lifeMilestones.wealthPeak,         sub: '' },
                  { icon: '👶', label: 'Children',            value: result.lifeMilestones.childrenCount,      sub: '' },
                  { icon: '🕉️', label: 'Spiritual Awakening', value: result.lifeMilestones.spiritualAwakening, sub: '' },
                ] as { icon: string; label: string; value: string; sub: string }[]).filter(m => m.value).map((m, i) => (
                  <View key={i} style={styles.milestoneRow}>
                    <Text style={styles.milestoneIcon}>{m.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneLabel}>{m.label}</Text>
                      <Text style={styles.milestoneValue}>{m.value}</Text>
                      {!!m.sub && <Text style={styles.milestoneSub}>{m.sub}</Text>}
                    </View>
                  </View>
                ))}
                {toArr(result.lifeMilestones.keyLifeEvents).length > 0 && (
                  <View style={styles.keyEventsWrap}>
                    <Text style={styles.keyEventsTitle}>Key Life Events</Text>
                    {toArr(result.lifeMilestones.keyLifeEvents).map((e: string, i: number) => (
                      <Text key={i} style={styles.keyEventText}>◆ {e}</Text>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </>
          )}

          {/* remedies */}
          {remedies.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Vedic Remedies</Text>
              <LinearGradient colors={['#0a2010', '#051008']} style={styles.remedyCard}>
                {remedies.map((r: string, i: number) => (
                  <Text key={i} style={styles.remedyText}>🪔 {r}</Text>
                ))}
              </LinearGradient>
            </>
          )}

          {/* disclaimer */}
          {result.disclaimer && (
            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── analysing overlay ─────────────────────────────────────────────────────────
  if (stage === 'analysing') {
    return (
      <View style={[styles.root, styles.centre]}>
        {previewUri && <Image source={{ uri: previewUri }} style={styles.previewBg} blurRadius={4} />}
        <View style={styles.analysingCard}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={styles.analysingTitle}>Reading Your Palm…</Text>
          <Text style={styles.analysingText}>
            Consulting ancient Vedic wisdom and planetary positions encoded in your hand…
          </Text>
        </View>
      </View>
    );
  }

  // ── preview ───────────────────────────────────────────────────────────────────
  if (stage === 'preview' && previewUri) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Image source={{ uri: previewUri }} style={styles.previewFull} />
        <View style={styles.previewOverlay}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={reset}>
              <Text style={styles.retakeBtnText}>↺ Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUnlockPress} activeOpacity={0.85}>
              <LinearGradient colors={['#D4A843', '#9B6E2A']} style={styles.analyseBtn}>
                <Text style={styles.analyseBtnText}>{`✨ Unlock Palm Reading — ${ready ? format(0.2) : '...'}`}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <PaymentModal
            visible={showPayment}
            title="Palmistry Reading"
            subtitle="Unlock your palm analysis, life milestones, and Vedic remedies"
            fixedAmountUsd={0.2}
            googlePlayProductId="palmistry_reading"
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </View>
      </View>
    );
  }

  // ── idle camera ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* back button */}
        <TouchableOpacity style={[styles.topBackBtn, { top: 12 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.topBackText}>← Back</Text>
        </TouchableOpacity>

        {/* palm guide overlay */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideTitle}>🖐 Vedic Palmistry</Text>
          <View style={styles.palmOutlineBox}>
            {/* simple hand silhouette using border */}
            <View style={styles.palmSilhouette}>
              <Text style={styles.palmSilhouetteText}>🖐</Text>
              {/* line labels */}
              <View style={[styles.lineLabel, { top: '25%', left: '18%' }]}>
                <Text style={styles.lineLabelText}>❤️ Heart</Text>
              </View>
              <View style={[styles.lineLabel, { top: '40%', left: '16%' }]}>
                <Text style={styles.lineLabelText}>🧠 Head</Text>
              </View>
              <View style={[styles.lineLabel, { top: '58%', left: '12%' }]}>
                <Text style={styles.lineLabelText}>🌿 Life</Text>
              </View>
              <View style={[styles.lineLabel, { top: '48%', right: '14%' }]}>
                <Text style={styles.lineLabelText}>⭐ Fate</Text>
              </View>
            </View>
          </View>
          <Text style={styles.guideHint}>Hold palm flat • Fill the frame • Good lighting</Text>
        </View>

        {/* capture button */}
        <View style={styles.captureRow}>
          <TouchableOpacity onPress={handleCapture} activeOpacity={0.85} style={styles.captureOuter}>
            <LinearGradient colors={['#D4A843', '#9B6E2A']} style={styles.captureInner}>
              <Text style={styles.captureText}>Capture Palm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0022' },
  centre: { alignItems: 'center', justifyContent: 'center' },

  // permission
  permText: { color: '#ccc', textAlign: 'center', marginHorizontal: 32, marginBottom: 20 },
  permBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#000', fontWeight: '700' },

  // camera
  camera: { flex: 1 },
  topBackBtn: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: '#00000080', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  topBackText: { color: '#fff', fontWeight: '600' },

  guideContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 110, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14, textShadowColor: '#000', textShadowRadius: 6 },
  palmOutlineBox: { width: SW * 0.72, height: SW * 0.72, borderRadius: 24, borderWidth: 2, borderColor: '#D4A84380', overflow: 'hidden', backgroundColor: '#00000030' },
  palmSilhouette: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  palmSilhouetteText: { fontSize: 130, opacity: 0.35 },
  lineLabel: { position: 'absolute', backgroundColor: '#00000070', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lineLabelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  guideHint: { color: '#ffffffcc', fontSize: 13, marginTop: 14, textAlign: 'center' },

  captureRow: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  captureOuter: { borderRadius: 50, overflow: 'hidden' },
  captureInner: { paddingHorizontal: 40, paddingVertical: 16, alignItems: 'center' },
  captureText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  // preview
  previewFull: { ...StyleSheet.absoluteFillObject, width: SW, height: SH },
  previewBg: { ...StyleSheet.absoluteFillObject, width: SW, height: SH },
  previewOverlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 40, paddingHorizontal: 24 },
  previewButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  retakeBtn: { backgroundColor: '#ffffff20', borderWidth: 1, borderColor: '#ffffff40', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  retakeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  analyseBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  analyseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#ff6b6b', marginBottom: 12, textAlign: 'center' },

  // analysing
  analysingCard: { backgroundColor: '#1a0033cc', borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: SW * 0.82 },
  analysingTitle: { color: theme.colors.gold, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  analysingText: { color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // result
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: {},
  backArrow: { color: theme.colors.gold, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  resultScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  overallBanner: { borderRadius: 18, padding: 20, marginBottom: 20, alignItems: 'center' },
  overallEmoji: { fontSize: 40, marginBottom: 8 },
  overallTitle: { color: theme.colors.gold, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  overallText: { color: '#e8e8f0', fontSize: 14, lineHeight: 21, textAlign: 'center' },

  sectionTitle: { color: theme.colors.gold, fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 10, letterSpacing: 0.4 },

  lineCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ffffff0f' },
  lineCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  lineIconText: { fontSize: 20 },
  lineName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  lineCondition: { color: '#aaa', fontSize: 12 },
  chevron: { fontSize: 12, marginLeft: 4 },
  lineDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff15' },
  lineDetailLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginTop: 6, textTransform: 'uppercase' },
  lineDetailText: { color: '#d4d4e8', fontSize: 13, lineHeight: 19, marginTop: 3 },

  persCard: { borderRadius: 16, padding: 16, marginBottom: 10 },
  persRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  persLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  persValue: { color: theme.colors.gold, fontSize: 13, fontWeight: '700', marginLeft: 4, marginRight: 12 },
  persValueWide: { color: '#d4d4e8', fontSize: 13, flex: 1, lineHeight: 18 },
  chipsRow: { marginBottom: 8 },
  chipGroupLabel: { color: '#aaa', fontSize: 12, marginBottom: 5 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },

  mountCard: { borderRadius: 12, padding: 12, marginBottom: 8 },
  mountName: { color: theme.colors.gold, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  mountDev: { color: '#9B59B6', fontSize: 11, marginBottom: 4 },
  mountMeaning: { color: '#c8c8dc', fontSize: 13, lineHeight: 18 },

  luckyRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 6 },
  luckyBox: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#ffffff08' },
  luckyLabel: { color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  luckyVal: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  remedyCard: { borderRadius: 14, padding: 14 },

  // milestones
  milestonesCard: { borderRadius: 14, padding: 14, marginBottom: 2 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  milestoneIcon: { fontSize: 22, width: 34, marginTop: 2 },
  milestoneLabel: { color: '#aaa', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: theme?.fonts?.body, marginBottom: 3 },
  milestoneSub: { color: '#777', fontSize: 11.5, marginTop: 3, fontFamily: theme?.fonts?.body, lineHeight: 17 },
  milestoneValue: { color: '#D4A843', fontSize: 14, fontWeight: '700', fontFamily: theme?.fonts?.heading, flexWrap: 'wrap' },
  keyEventsWrap: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  keyEventsTitle: { color: '#9B59B6', fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.4 },
  keyEventText: { color: '#bbb', fontSize: 13, lineHeight: 20, marginBottom: 5, fontFamily: theme?.fonts?.body },
  remedyText: { color: '#c8dcc8', fontSize: 13, lineHeight: 22 },

  disclaimer: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16, fontStyle: 'italic' },
});
