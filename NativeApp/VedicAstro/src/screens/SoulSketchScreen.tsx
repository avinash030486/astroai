import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Animated, Easing, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PaymentModal } from '../components/PaymentModal';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { soulSketchApi, normalizeTime, paymentsApi } from '../api/services';
import { theme } from '../theme/theme';
import { useCurrency } from '../hooks/useCurrency';

type Phase = 'input' | 'loading' | 'result';

const LOADING_MESSAGES = [
  '✨ Reading your birth chart...',
  '♀ Analysing Venus placement...',
  '🏠 Studying your 7th house...',
  '🌌 Consulting the Navamsha...',
  '🎨 Painting your portrait...',
  '💫 Almost there...',
];

const GENDER_OPTIONS  = ['Male', 'Female', 'Non-binary'];
const PARTNER_OPTIONS = ['Male', 'Female', 'Any'];

function parseBirthPlace(place: string): { city: string; state: string; country: string } {
  const parts = place.split(',').map(p => p.trim());
  return { city: parts[0] || '', state: parts[1] || '', country: parts[2] || '' };
}

export const SoulSketchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { format, ready } = useCurrency();

  const [birthDate, setBirthDate]       = useState('');
  const [birthTime, setBirthTime]       = useState('06:00');
  const [birthPlace, setBirthPlace]     = useState('');
  const [gender, setGender]             = useState('Female');
  const [partnerGender, setPartnerGender] = useState('Male');

  const [phase, setPhase]   = useState<Phase>('input');
  const [result, setResult] = useState<any>(null);
  const [error, setError]   = useState('');
  const [sharing, setSharing] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError]     = useState(false);
  const [retryKey, setRetryKey]     = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const spinAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const [msgIdx, setMsgIdx] = useState(0);
  const msgTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const shareViewRef = useRef<View>(null);

  // Start / stop loading animations
  useEffect(() => {
    if (phase !== 'loading') {
      spinAnim.stopAnimation();
      pulseAnim.stopAnimation();
      if (msgTimer.current) clearInterval(msgTimer.current);
      return;
    }

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
    let i = 0;
    msgTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setMsgIdx(i);
    }, 3500);

    return () => { if (msgTimer.current) clearInterval(msgTimer.current); };
  }, [phase]);

  const handleReveal = useCallback(async () => {
    if (!birthDate)         { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');
    setPhase('loading');
    setMsgIdx(0);
    try {
      const { city, state, country } = parseBirthPlace(birthPlace);
      const data = await soulSketchApi.generate({
        birthDate,
        birthTime: normalizeTime(birthTime),
        city, state, country,
        gender: gender.toLowerCase(),
        partnerGender: partnerGender.toLowerCase(),
      });
      setResult(data);
      setImgLoading(true);
      setImgError(false);
      setRetryKey(0);
      setPhase('result');
    } catch (e: any) {
      setPhase('input');
      setError(e.message || 'Could not generate your Soul Sketch. Please try again.');
    }
  }, [birthDate, birthTime, birthPlace, gender, partnerGender]);

  const handleStartPayment = useCallback(() => {
    if (!birthDate)         { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');
    setShowPayment(true);
  }, [birthDate, birthPlace]);

  const handlePaymentSuccess = useCallback(async (pmId: string, planId: string, amountUsd: number, name: string, email: string) => {
    const needsStripeCharge = pmId !== 'credits_only' && Platform.OS !== 'android';

    if (needsStripeCharge) {
      const res = await paymentsApi.chargeForFeature({
        feature: 'soul-sketch',
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

  const handleShare = useCallback(async () => {
    if (sharing || !shareViewRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareViewRef.current, { format: 'jpg', quality: 0.92 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'My Soul Sketch ✨' });
      }
    } catch {
      Alert.alert('Error', 'Could not share the portrait.');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Loading phase ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <LinearGradient colors={['#0A0E2A', '#1a0035', '#0A0E2A']} style={styles.root}>
        <View style={styles.loadingWrap}>
          <Animated.Text style={[styles.loadingStar, { transform: [{ rotate: spinDeg }, { scale: pulseAnim }] }]}>
            ✨
          </Animated.Text>
          <Text style={styles.loadingTitle}>Creating Your Soul Sketch</Text>
          <Text style={styles.loadingMsg}>{LOADING_MESSAGES[msgIdx]}</Text>
          <Text style={styles.loadingHint}>This may take 30–60 seconds</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Result phase ──────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <LinearGradient colors={[theme.colors.navy, '#1a0035']} style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScroll}>
          <TouchableOpacity onPress={() => setPhase('input')} style={styles.backBtn}>
            <Text style={styles.backText}>← New Sketch</Text>
          </TouchableOpacity>

          <Text style={styles.resultTitle}>✨ Your Soulmate Portrait</Text>

          {/* Portrait — capture target for sharing */}
          <View ref={shareViewRef} collapsable={false} style={styles.portraitCard}>
            {!imgError ? (
              <Image
                key={retryKey}
                source={{ uri: result.imageUrl }}
                style={styles.portrait}
                resizeMode="cover"
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgLoading(false); setImgError(true); }}
              />
            ) : (
              <View style={styles.imgErrorWrap}>
                <Text style={styles.imgErrorText}>🎨</Text>
                <Text style={styles.imgErrorSub}>Portrait couldn't load</Text>
                <TouchableOpacity onPress={() => { setImgError(false); setImgLoading(true); setRetryKey(k => k + 1); }}>
                  <Text style={{ color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 8 }}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {imgLoading && !imgError && (
              <View style={styles.imgLoadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.gold} />
                <Text style={styles.imgLoadingText}>Painting your portrait…</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(10,14,42,0.9)']}
              style={styles.portraitGradient}
            />
            <Text style={styles.portraitWatermark}>Soul Sketch · VedicAstro</Text>
          </View>

          {/* Astro traits */}
          <View style={styles.traitsWrap}>
            {(result.astroTraits ?? []).map((t: any, i: number) => (
              <View key={i} style={styles.traitChip}>
                <Text style={styles.traitLabel}>{t.label}</Text>
                <Text style={styles.traitValue}>{t.value}</Text>
              </View>
            ))}
          </View>

          {!!result.originReading && (
            <View style={styles.originCard}>
              <Text style={styles.originLabel}>🌍 Spouse Origin Insight</Text>
              <Text style={styles.originText}>{result.originReading}</Text>
            </View>
          )}

          {!!result.marriageAgeReading && (
            <View style={styles.marriageCard}>
              <Text style={styles.marriageLabel}>💍 Likely Marriage Timing</Text>
              <Text style={styles.marriageText}>{result.marriageAgeReading}</Text>
            </View>
          )}

          {/* Narrative */}
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeIcon}>💫</Text>
            <Text style={styles.narrativeText}>{result.soulmateNarrative}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.tryAgainBtn} onPress={() => setPhase('input')}>
              <Text style={styles.tryAgainText}>🔄 Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
              <LinearGradient colors={[theme.colors.gold, '#A07010']} style={styles.shareGrad}>
                <Text style={styles.shareText}>{sharing ? 'Sharing...' : '📤 Share'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Input phase ───────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={[theme.colors.navy, '#1a0035']} style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🎨</Text>
          <Text style={styles.headerTitle}>Soul Sketch</Text>
          <Text style={styles.headerSub}>
            The stars have painted a portrait of your soulmate.{'\n'}Enter your birth details to reveal them.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <DatePickerField label="Birth Date"  value={birthDate}  onChangeText={setBirthDate} />
          <TimePickerField label="Birth Time"  value={birthTime}  onChangeText={setBirthTime} />
          <PlaceInput      label="Birth Place" value={birthPlace} onChangeText={setBirthPlace} />

          {/* Your gender */}
          <Text style={styles.pickerLabel}>Your Gender</Text>
          <View style={styles.pillRow}>
            {GENDER_OPTIONS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, gender === g && styles.pillActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seeking */}
          <Text style={styles.pickerLabel}>Seeking</Text>
          <View style={styles.pillRow}>
            {PARTNER_OPTIONS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, partnerGender === g && styles.pillActive]}
                onPress={() => setPartnerGender(g)}
              >
                <Text style={[styles.pillText, partnerGender === g && styles.pillTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.priceNote}>{ready ? `Localized price: ${format(0.2)}` : 'Localized price loading...'}</Text>

          <TouchableOpacity onPress={handleStartPayment} activeOpacity={0.85} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={[theme.colors.gold, '#A07010']}
              style={styles.revealBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.revealBtnText}>{ready ? `✨ Reveal My Soulmate — ${format(0.2)}` : '✨ Reveal My Soulmate'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <PaymentModal
            visible={showPayment}
            title="Soul Sketch"
            subtitle="Unlock your astrologically guided soulmate portrait, origin insight, and marriage timing"
            fixedAmountUsd={0.2}
            googlePlayProductId="soul_sketch"
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { paddingBottom: 60 },
  resultScroll:{ paddingBottom: 60 },
  backBtn:     { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  backText:    { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 14 },

  // Header
  header:     { alignItems: 'center', paddingHorizontal: 28, paddingTop: 8, paddingBottom: 28 },
  headerEmoji:{ fontSize: 56, marginBottom: 12 },
  headerTitle:{ color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 30, letterSpacing: 0.5 },
  headerSub:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },

  // Form
  form:          { paddingHorizontal: 20, gap: 14 },
  pickerLabel:   { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  pillRow:       { flexDirection: 'row', gap: 10 },
  pill:          { flex: 1, paddingVertical: 11, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.goldDim, alignItems: 'center' },
  pillActive:    { backgroundColor: theme.colors.gold + '30', borderColor: theme.colors.gold },
  pillText:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13 },
  pillTextActive:{ color: theme.colors.gold, fontFamily: theme.fonts.bodyBold },
  errorText:     { color: '#FF6B6B', fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center' },
  priceNote:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center', marginTop: 2 },
  revealBtn:     { borderRadius: theme.radius.lg, paddingVertical: 18, alignItems: 'center' },
  revealBtnText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 17 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingStar: { fontSize: 72, marginBottom: 30 },
  loadingTitle:{ color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 22, textAlign: 'center', marginBottom: 16 },
  loadingMsg:  { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 15, textAlign: 'center', marginBottom: 10 },
  loadingHint: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center' },

  // Result
  resultTitle:    { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 22, textAlign: 'center', marginBottom: 18, paddingHorizontal: 20 },
  portraitCard:   { marginHorizontal: 20, borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 2, borderColor: theme.colors.gold + '55', height: 380, marginBottom: 20 },
  portrait:       { width: '100%', height: '100%' },
  portraitGradient:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  portraitWatermark:{ position: 'absolute', bottom: 12, right: 14, color: theme.colors.gold + '99', fontFamily: theme.fonts.body, fontSize: 11 },
  imgLoadingOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,14,42,0.7)', gap: 12 },
  imgLoadingText:   { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 13 },
  imgErrorWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgErrorText:     { fontSize: 40 },
  imgErrorSub:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 8 },

  traitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  traitChip:  { backgroundColor: 'rgba(139,92,246,0.18)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.45)', paddingHorizontal: 12, paddingVertical: 8 },
  traitLabel: { color: '#A78BFA', fontFamily: theme.fonts.body, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  traitValue: { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodyBold, fontSize: 12 },

  originCard:  { marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(46,204,113,0.08)', borderRadius: theme.radius.lg, borderWidth: 1, borderColor: 'rgba(46,204,113,0.35)', padding: 18 },
  originLabel: { color: '#7EE2A8', fontFamily: theme.fonts.body, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  originText:  { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 21 },

  marriageCard:  { marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(233,30,99,0.08)', borderRadius: theme.radius.lg, borderWidth: 1, borderColor: 'rgba(233,30,99,0.35)', padding: 18 },
  marriageLabel: { color: '#FF8EB8', fontFamily: theme.fonts.body, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  marriageText:  { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 21 },

  narrativeCard: { marginHorizontal: 20, marginBottom: 28, backgroundColor: 'rgba(212,168,67,0.08)', borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.goldDim, padding: 20, alignItems: 'center' },
  narrativeIcon: { fontSize: 24, marginBottom: 10 },
  narrativeText: { color: theme.colors.gold + 'CC', fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },

  btnRow:      { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 40 },
  tryAgainBtn: { flex: 1, paddingVertical: 15, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.goldDim, alignItems: 'center' },
  tryAgainText:{ color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 14 },
  shareBtn:    { flex: 1, borderRadius: theme.radius.lg, overflow: 'hidden' },
  shareGrad:   { paddingVertical: 15, alignItems: 'center' },
  shareText:   { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
});
