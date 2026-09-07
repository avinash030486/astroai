/**
 * DashaTimelineScreen.tsx
 *
 * Walk through your Vimshottari Dasha timeline in a 360° virtual corridor.
 * Each major dasha period is placed in front of you as a glowing archway.
 * Rotate your body left/right to move through past → present → future.
 *
 * Current dasha is always in the centre. Past periods are to the left,
 * future periods to the right.
 *
 * No headset needed — phone gyroscope + compass only.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar, Modal, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { StarField } from '../components/StarField';
import { useGyroCamera, vrToScreen } from '../hooks/useGyroCamera';
import { useVimshottariDasha, DASHA_THEMES } from '../hooks/useVimshottariDasha';
import { useProfileStore } from '../store/profileStore';

const { width: SW, height: SH } = Dimensions.get('window');

// Each dasha occupies 30° azimuth in the virtual corridor
// Current dasha is anchored at 180° (directly in front when facing south,
// but we compute relative to "true north" — the math handles the body rotation)
const DASHA_SPACING_DEG = 28; // degrees per dasha in azimuth

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function yearsRemaining(end: Date): string {
  const diff = (end.getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000);
  if (diff < 0) return 'complete';
  if (diff < 1) return `${Math.round(diff * 12)}mo left`;
  return `${diff.toFixed(1)}yr left`;
}

export const DashaTimelineScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { heading, pitch, ready } = useGyroCamera();
  const { profile } = useProfileStore();
  const [selected, setSelected] = useState<number | null>(null);

  const dasha = useVimshottariDasha(profile?.date_of_birth ?? undefined);

  // Map each dasha to an azimuth position.
  const dashaPositions = useMemo(() => {
    if (!dasha) return [];
    const currentIdx = dasha.periods.findIndex(p => p.isCurrent);
    return dasha.periods.map((period, i) => {
      const offset = (i - currentIdx) * DASHA_SPACING_DEG;
      const az = ((offset % 360) + 360) % 360;
      return { ...period, az, idx: i, isCurrentIdx: i === currentIdx };
    });
  }, [dasha]);

  // One spring per dasha archway — runs position on native thread
  const MAX_DASHAS = 9;
  const dashAnims   = useRef(Array.from({ length: MAX_DASHAS }, () => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const dashOpacity = useRef(Array.from({ length: MAX_DASHAS }, () => new Animated.Value(0))).current;

  useEffect(() => {
    dashaPositions.forEach((dp, i) => {
      if (i >= MAX_DASHAS) return;
      const { x, y, inView } = vrToScreen(dp.az, 0, heading, pitch, SW, SH);
      Animated.spring(dashAnims[i], {
        toValue: { x: x - SW / 2, y: y - SH / 2 },
        speed: 55,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
      Animated.timing(dashOpacity[i], {
        toValue: inView ? (dp.isPast ? 0.55 : 1) : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [heading, pitch, dashaPositions]);

  if (!ready) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingTxt}>Aligning your timeline…</Text>
      </View>
    );
  }

  if (!profile?.date_of_birth) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingTxt}>🗓 Add your birth date in Profile</Text>
        <Text style={s.loadingSub}>to generate your Vimshottari Dasha timeline</Text>
        <TouchableOpacity style={s.backBtnCenter} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dasha) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingTxt}>Computing 120-year dasha cycle…</Text>
      </View>
    );
  }

  const selectedPeriod = selected !== null ? dashaPositions[selected] : null;

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <StarField />
      <LinearGradient colors={['rgba(8,5,28,0.90)', 'rgba(4,2,16,0.96)']} style={StyleSheet.absoluteFill} />

      {/* Floor grid lines to suggest corridor depth */}
      <View style={s.corridorFloor} pointerEvents="none">
        {[0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
          <View key={v} style={[s.floorLine, { opacity: (1 - v) * 0.5 + 0.05, bottom: SH * (1 - v) }]} />
        ))}
      </View>

      {/* Dasha archways — native spring for butter-smooth corridor walk */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {dashaPositions.map((dp, i) => {
          if (i >= MAX_DASHAS) return null;
          const t = DASHA_THEMES[dp.planet] ?? { color: '#888', bgA: '#111', bgB: '#080808', emoji: '⭐', theme: '', lesson: '' };
          const isCurrent = dp.isCurrent;
          const isPast    = dp.isPast;
          const scale     = isCurrent ? 1.18 : isPast ? 0.82 : 0.92;
          return (
            <Animated.View
              key={i}
              style={[
                s.archAnchor,
                {
                  opacity: dashOpacity[i],
                  transform: [
                    ...dashAnims[i].getTranslateTransform(),
                    { scale },
                  ],
                },
              ]}
            >
              <TouchableOpacity onPress={() => setSelected(i)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[t.bgA + 'EE', t.bgB + 'DD']}
                  style={[s.archInner, {
                    borderColor: isCurrent ? t.color + 'EE' : t.color + '44',
                    shadowColor: t.color,
                    shadowOpacity: isCurrent ? 0.7 : 0.15,
                    shadowRadius: isCurrent ? 18 : 6,
                    elevation: isCurrent ? 14 : 2,
                  }]}
                >
                  <View style={[s.archCap, { borderColor: t.color + (isCurrent ? 'DD' : '55') }]} />
                  {isCurrent && (
                    <View style={[s.curBadge, { backgroundColor: t.color + '33', borderColor: t.color }]}>
                      <Text style={[s.curBadgeTxt, { color: t.color }]}>NOW</Text>
                    </View>
                  )}
                  <Text style={s.archEmoji}>{t.emoji}</Text>
                  <Text style={[s.archPlanet, { color: t.color }]}>{dp.planet}</Text>
                  <Text style={s.archYears}>{dp.years}yr</Text>
                  <Text style={s.archDates}>{formatDate(dp.startDate)}</Text>
                  {isCurrent && (
                    <Text style={[s.archRemaining, { color: t.color }]}>
                      {yearsRemaining(dp.endDate)}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Centre crosshair */}
      <View style={s.crosshair} pointerEvents="none">
        <View style={s.crosshairH} />
        <View style={s.crosshairV} />
      </View>

      {/* Top HUD */}
      <View style={[s.topHud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.hudCenter}>
          <Text style={s.hudTitle}>Dasha Timeline</Text>
          <Text style={s.hudSub}>
            {dasha.janmaNakshatra} nakshatra · {dasha.currentDasha?.planet} period
          </Text>
        </View>
        {/* Timeline navigator mini */}
        <View style={s.miniNav}>
          <Text style={s.miniNavTxt}>
            {dasha.currentDasha?.planet} {dasha.periods.findIndex(p => p.isCurrent) + 1}/{dasha.periods.length}
          </Text>
        </View>
      </View>

      {/* Bottom hint */}
      <View style={[s.bottomHint, { bottom: insets.bottom + 14 }]} pointerEvents="none">
        <Text style={s.bottomHintTxt}>← Rotate left for past · Rotate right for future →</Text>
        <Text style={s.bottomHintSub}>Tap any archway to explore that dasha</Text>
      </View>

      {/* Dasha Detail Modal */}
      {selectedPeriod && (() => {
        const t = DASHA_THEMES[selectedPeriod.planet] ?? { color: '#888', bgA: '#111', bgB: '#080808', emoji: '⭐', theme: 'Unknown', lesson: 'Unknown' };
        return (
          <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
            <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSelected(null)} />
            <View style={s.sheet}>
              <LinearGradient colors={[t.bgA, '#0A0D1A']} style={s.sheetInner}>
                <View style={s.sheetHandle} />
                {/* Header */}
                <View style={s.sheetHeader}>
                  <Text style={s.sheetEmoji}>{t.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[s.sheetPlanet, { color: t.color }]}>{selectedPeriod.planet} Dasha</Text>
                    <Text style={s.sheetYears}>{selectedPeriod.years} years · {formatDate(selectedPeriod.startDate)} → {formatDate(selectedPeriod.endDate)}</Text>
                  </View>
                  {selectedPeriod.isCurrent && (
                    <View style={[s.curBadgeLg, { backgroundColor: t.color + '22', borderColor: t.color }]}>
                      <Text style={[s.curBadgeLgTxt, { color: t.color }]}>CURRENT</Text>
                    </View>
                  )}
                </View>
                {/* Theme */}
                <View style={[s.themeBox, { borderColor: t.color + '33' }]}>
                  <Text style={s.themeLabel}>Theme of this Dasha</Text>
                  <Text style={[s.themeValue, { color: t.color }]}>{t.theme}</Text>
                </View>
                {/* Lesson */}
                <View style={s.lessonBox}>
                  <Text style={s.lessonLabel}>🪷 Soul Lesson</Text>
                  <Text style={s.lessonTxt}>{t.lesson}</Text>
                </View>
                {/* Status */}
                {selectedPeriod.isCurrent && (
                  <View style={[s.statusBox, { borderColor: t.color + '44', backgroundColor: t.color + '11' }]}>
                    <Text style={[s.statusTxt, { color: t.color }]}>
                      ⏳ {yearsRemaining(selectedPeriod.endDate)} in this dasha
                    </Text>
                  </View>
                )}
                {selectedPeriod.isPast && (
                  <View style={s.statusBox}>
                    <Text style={s.statusTxt}>✅ Completed — lessons integrated</Text>
                  </View>
                )}
                {!selectedPeriod.isCurrent && !selectedPeriod.isPast && (
                  <View style={s.statusBox}>
                    <Text style={s.statusTxt}>🔮 Upcoming — begins {formatDate(selectedPeriod.startDate)}</Text>
                  </View>
                )}
                <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={s.closeTxt}>Back to timeline</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#04020E' },
  loading:        { flex: 1, backgroundColor: '#04020E', alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTxt:     { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 16, textAlign: 'center' },
  loadingSub:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, marginTop: 8, textAlign: 'center' },
  backBtnCenter:  { marginTop: 24, backgroundColor: 'rgba(201,150,58,0.15)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)' },
  // Corridor
  corridorFloor:  { position: 'absolute', left: 0, right: 0, bottom: 0, height: SH * 0.4 },
  floorLine:      { position: 'absolute', left: '10%', right: '10%', height: 1, backgroundColor: 'rgba(100,80,200,0.3)' },
  // Arch
  archAnchor:     { position: 'absolute', left: SW / 2 - 56, top: SH / 2 - 100, width: 112, alignItems: 'center' },
  arch:           { position: 'absolute', width: 112, alignItems: 'center' },
  archInner:      { width: 112, borderRadius: 16, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  archCap:        { width: 72, height: 36, borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 2, borderBottomWidth: 0, marginBottom: 10 },
  curBadge:       { borderRadius: 8, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  curBadgeTxt:    { fontFamily: theme.fonts.sansSemiBold, fontSize: 9, letterSpacing: 1 },
  archEmoji:      { fontSize: 24, marginBottom: 4 },
  archPlanet:     { fontFamily: theme.fonts.sansSemiBold, fontSize: 13 },
  archYears:      { color: 'rgba(255,255,255,0.5)', fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 2 },
  archDates:      { color: 'rgba(255,255,255,0.35)', fontFamily: theme.fonts.sans, fontSize: 9, marginTop: 2 },
  archRemaining:  { fontFamily: theme.fonts.sansSemiBold, fontSize: 10, marginTop: 4 },
  // Crosshair
  crosshair:      { position: 'absolute', left: SW/2-20, top: SH/2-20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  crosshairH:     { position: 'absolute', width: 30, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  crosshairV:     { position: 'absolute', width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.18)' },
  // Top HUD
  topHud:         { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:        { backgroundColor: 'rgba(8,14,26,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)', marginTop: 4 },
  backTxt:        { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 13 },
  hudCenter:      { flex: 1, alignItems: 'center', marginTop: 4 },
  hudTitle:       { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18 },
  hudSub:         { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 2, textAlign: 'center' },
  miniNav:        { backgroundColor: 'rgba(8,14,26,0.8)', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: 'rgba(201,150,58,0.2)', marginTop: 4 },
  miniNavTxt:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 10 },
  // Bottom hint
  bottomHint:     { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bottomHintTxt:  { color: 'rgba(255,255,255,0.5)', fontFamily: theme.fonts.sans, fontSize: 12, textAlign: 'center' },
  bottomHintSub:  { color: 'rgba(255,255,255,0.28)', fontFamily: theme.fonts.sans, fontSize: 10, marginTop: 3, textAlign: 'center' },
  // Modal
  backdrop:       { flex: 1 },
  sheet:          { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetInner:     { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 40 },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  sheetEmoji:     { fontSize: 36 },
  sheetPlanet:    { fontFamily: theme.fonts.heading, fontSize: 22 },
  sheetYears:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 12, marginTop: 4, lineHeight: 18 },
  curBadgeLg:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  curBadgeLgTxt:  { fontFamily: theme.fonts.sansSemiBold, fontSize: 10, letterSpacing: 1 },
  themeBox:       { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  themeLabel:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  themeValue:     { fontFamily: theme.fonts.heading, fontSize: 17, lineHeight: 26 },
  lessonBox:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 14 },
  lessonLabel:    { color: theme.colors.gold, fontFamily: theme.fonts.sansSemiBold, fontSize: 12, marginBottom: 6 },
  lessonTxt:      { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 21 },
  statusBox:      { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 20 },
  statusTxt:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, textAlign: 'center' },
  closeBtn:       { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 30, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  closeTxt:       { color: theme.colors.textSecondary, fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
});
