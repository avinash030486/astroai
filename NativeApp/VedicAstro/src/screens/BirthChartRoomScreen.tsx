/**
 * BirthChartRoomScreen.tsx
 *
 * Immersive 360° Vedic birth chart experience.
 * The 12 Vedic houses are placed as glowing archways around the user,
 * each 30° apart in azimuth. Tilt and rotate the phone to explore.
 * Tap any house to see its significations and natal planet placements.
 *
 * No headset needed — uses phone gyroscope + compass.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useProfileStore } from '../store/profileStore';
import { computeNatalChart } from '../hooks/usePersonalDayScore';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Vedic House Data ──────────────────────────────────────────────────────────
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const HOUSE_DATA = [
  { num: 1,  name: 'Lagna',   lord: 'Self, body, personality, appearance, beginnings', emoji: '🧍', color: '#FF6B6B' },
  { num: 2,  name: 'Dhana',   lord: 'Wealth, speech, family, food, accumulated assets', emoji: '💰', color: '#FFD700' },
  { num: 3,  name: 'Sahaja',  lord: 'Siblings, courage, communication, short travels', emoji: '✋', color: '#FF9500' },
  { num: 4,  name: 'Sukha',   lord: 'Mother, home, happiness, vehicles, inner peace', emoji: '🏠', color: '#4ECDC4' },
  { num: 5,  name: 'Putra',   lord: 'Children, creativity, intelligence, romance, past merit', emoji: '🎨', color: '#FF69B4' },
  { num: 6,  name: 'Ari',     lord: 'Enemies, disease, debts, service, obstacles, healing', emoji: '⚔️', color: '#FF4500' },
  { num: 7,  name: 'Yuvati',  lord: 'Marriage, partnerships, business, foreign connections', emoji: '💑', color: '#DA70D6' },
  { num: 8,  name: 'Mrityu',  lord: 'Longevity, occult, transformation, hidden wealth, death', emoji: '🔮', color: '#8A2BE2' },
  { num: 9,  name: 'Dharma',  lord: 'Father, luck, religion, higher wisdom, long journeys', emoji: '🙏', color: '#FFA500' },
  { num: 10, name: 'Karma',   lord: 'Career, fame, government, authority, public life', emoji: '👑', color: '#C9963A' },
  { num: 11, name: 'Labha',   lord: 'Gains, income, fulfilment of ambitions, elder siblings', emoji: '✅', color: '#7FFF00' },
  { num: 12, name: 'Vyaya',   lord: 'Loss, liberation, foreign lands, moksha, spiritual retreat', emoji: '🌌', color: '#87CEEB' },
];

const PLANET_EMOJIS: Record<string, string> = {
  Sun:'☀️', Moon:'🌙', Mars:'🔴', Mercury:'🟢', Jupiter:'🟡',
  Venus:'⚪', Saturn:'🪐', Rahu:'🌑', Ketu:'💫',
};

export const BirthChartRoomScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const insets       = useSafeAreaInsets();
  const { heading, pitch, ready } = useGyroCamera();
  const { profile } = useProfileStore();
  const [selected, setSelected] = useState<number | null>(null);

  // Compute natal chart → which planets are in which signs
  const natalChart = useMemo(() => {
    if (profile?.date_of_birth) {
      try { return computeNatalChart(profile.date_of_birth, profile.time_of_birth ?? '12:00'); }
      catch { return null; }
    }
    return null;
  }, [profile?.date_of_birth, profile?.time_of_birth]);

  // moonSignIndex = house 1 in Chandra Kundali
  const moonHouseBase = natalChart?.moonSignIndex ?? 0;

  // Planet → house number (Chandra Kundali)
  const planetHouseMap: Record<string, number> = useMemo(() => {
    if (!natalChart) return {};
    const map: Record<string, number> = {};
    Object.entries(natalChart.planetSigns).forEach(([planet, sign]) => {
      const signIdx  = SIGNS.indexOf(sign);
      const houseNum = ((signIdx - moonHouseBase + 12) % 12) + 1;
      map[planet] = houseNum;
    });
    return map;
  }, [natalChart, moonHouseBase]);

  // Houses arranged at 30° azimuth intervals starting from North
  const houses = useMemo(() => HOUSE_DATA.map((h, i) => ({
    ...h,
    az:  i * 30,
    alt: 0,
    planets: Object.entries(planetHouseMap)
               .filter(([, hNum]) => hNum === h.num)
               .map(([p]) => p),
  })), [planetHouseMap]);

  // One Animated.ValueXY per house — driven by spring on every sensor update.
  // useNativeDriver:true means position updates run on the UI thread, zero JS jitter.
  const houseAnims  = useRef(HOUSE_DATA.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const houseOpacity = useRef(HOUSE_DATA.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    houses.forEach((h, i) => {
      const { x, y, inView } = vrToScreen(h.az, h.alt, heading, pitch, SW, SH);
      Animated.spring(houseAnims[i], {
        toValue: { x: x - SW / 2, y: y - SH / 2 },
        speed: 60,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
      Animated.timing(houseOpacity[i], {
        toValue: inView ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [heading, pitch]);

  const selectedHouse = selected !== null ? houses[selected - 1] : null;

  if (!ready) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingTxt}>Initialising sensors…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <StarField />
      <LinearGradient colors={['rgba(10,5,30,0.92)', 'rgba(5,3,20,0.97)']} style={StyleSheet.absoluteFill} />

      {/* House archways in virtual 360° space — Animated.View keeps movement on native thread */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {houses.map((h, i) => (
          <Animated.View
            key={h.num}
            style={[
              s.archwayAnchor,
              {
                opacity: houseOpacity[i],
                transform: houseAnims[i].getTranslateTransform(),
              },
            ]}
          >
            <TouchableOpacity onPress={() => setSelected(h.num)} activeOpacity={0.85}>
              <LinearGradient
                colors={[h.color + '28', h.color + '0A']}
                style={[s.archwayInner, { borderColor: h.color + '99', shadowColor: h.color, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 }]}
              >
                <View style={[s.archTop, { borderColor: h.color + 'CC' }]} />
                <Text style={s.houseEmoji}>{h.emoji}</Text>
                <Text style={[s.houseNum, { color: h.color }]}>House {h.num}</Text>
                <Text style={s.houseName}>{h.name}</Text>
                {h.planets.length > 0 && (
                  <Text style={s.housePlanets}>
                    {h.planets.map(p => PLANET_EMOJIS[p]).join(' ')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Top HUD */}
      <View style={[s.topHud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.hudCenter}>
          <Text style={s.hudTitle}>Birth Chart Room</Text>
          <Text style={s.hudSub}>
            {natalChart
              ? `🌙 ${natalChart.moonSign} Moon · Chandra Kundali`
              : 'Rotate to explore all 12 houses'}
          </Text>
        </View>
        {/* Compass */}
        <View style={s.compass}>
          <Text style={s.compassTxt}>{Math.round(heading)}°</Text>
          <Text style={s.compassDir}>
            {heading < 22.5 || heading > 337.5 ? 'N' :
             heading < 67.5  ? 'NE' :
             heading < 112.5 ? 'E'  :
             heading < 157.5 ? 'SE' :
             heading < 202.5 ? 'S'  :
             heading < 247.5 ? 'SW' :
             heading < 292.5 ? 'W'  : 'NW'}
          </Text>
        </View>
      </View>

      {/* Bottom hint */}
      <View style={[s.bottomHint, { bottom: insets.bottom + 16 }]} pointerEvents="none">
        <Text style={s.bottomHintTxt}>Rotate your body to face each house · Tap to explore</Text>
        {!natalChart && (
          <Text style={s.noDobHint}>Add birth date in Profile for natal planet placements</Text>
        )}
      </View>

      {/* House Detail Modal */}
      {selectedHouse && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSelected(null)} />
          <View style={s.sheet}>
            <LinearGradient colors={['#111E33', '#0D1829']} style={s.sheetInner}>
              <View style={s.sheetHandle} />
              <View style={s.sheetHeader}>
                <Text style={[s.sheetDot, { backgroundColor: selectedHouse.color + '33', borderColor: selectedHouse.color }]}>
                  {selectedHouse.emoji}
                </Text>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[s.sheetTitle, { color: selectedHouse.color }]}>
                    House {selectedHouse.num} — {selectedHouse.name}
                  </Text>
                  {natalChart && (
                    <Text style={s.sheetSign}>
                      {SIGNS[(moonHouseBase + selectedHouse.num - 1) % 12]} · Rashi
                    </Text>
                  )}
                </View>
              </View>

              <Text style={s.sheetBody}>{selectedHouse.lord}</Text>

              {selectedHouse.planets.length > 0 ? (
                <View style={s.planetRow}>
                  <Text style={s.planetRowLabel}>Natal Planets Here</Text>
                  {selectedHouse.planets.map(p => (
                    <View key={p} style={s.planetChip}>
                      <Text style={s.planetChipEmoji}>{PLANET_EMOJIS[p]}</Text>
                      <Text style={s.planetChipTxt}>{p}</Text>
                      <Text style={s.planetChipSign}>{natalChart?.planetSigns[p]}</Text>
                    </View>
                  ))}
                </View>
              ) : natalChart ? (
                <Text style={s.emptyHouse}>No natal planets in this house</Text>
              ) : null}

              <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
                <Text style={s.closeTxt}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#050314' },
  loading:         { flex: 1, backgroundColor: '#050314', alignItems: 'center', justifyContent: 'center' },
  loadingTxt:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 14 },
  topHud:          { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:         { backgroundColor: 'rgba(8,14,26,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)', marginTop: 4 },
  backTxt:         { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 13 },
  hudCenter:       { flex: 1, alignItems: 'center', marginTop: 4 },
  hudTitle:        { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18 },
  hudSub:          { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 2, textAlign: 'center' },
  compass:         { backgroundColor: 'rgba(8,14,26,0.8)', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,150,58,0.3)', marginTop: 4, minWidth: 48 },
  compassTxt:      { color: theme.colors.gold, fontFamily: theme.fonts.sansSemiBold, fontSize: 11 },
  compassDir:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 9 },
  // Archway
  // Anchor is centered on screen; translateX/Y offsets computed by vrToScreen
  archwayAnchor:   { position: 'absolute', left: SW / 2 - 56, top: SH / 2 - 80, width: 112, alignItems: 'center' },
  archway:         { position: 'absolute', width: 112, alignItems: 'center' },
  archwayInner:    { width: 112, borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderColor: 'rgba(255,255,255,0.1)' },
  archTop:         { width: 70, height: 35, borderTopLeftRadius: 35, borderTopRightRadius: 35, borderWidth: 2, borderBottomWidth: 0, marginBottom: 8 },
  houseEmoji:      { fontSize: 22, marginBottom: 4 },
  houseNum:        { fontFamily: theme.fonts.sansSemiBold, fontSize: 12, marginBottom: 1 },
  houseName:       { color: 'rgba(255,255,255,0.7)', fontFamily: theme.fonts.sans, fontSize: 10 },
  housePlanets:    { fontSize: 14, marginTop: 4 },
  // Bottom hint
  bottomHint:      { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bottomHintTxt:   { color: 'rgba(255,255,255,0.5)', fontFamily: theme.fonts.sans, fontSize: 12, textAlign: 'center' },
  noDobHint:       { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 11, marginTop: 4 },
  // Modal
  backdrop:        { flex: 1 },
  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetInner:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sheetDot:        { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, textAlign: 'center', textAlignVertical: 'center', fontSize: 24, lineHeight: 52 },
  sheetTitle:      { fontFamily: theme.fonts.heading, fontSize: 20 },
  sheetSign:       { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, marginTop: 2 },
  sheetBody:       { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  planetRow:       { marginBottom: 16 },
  planetRowLabel:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  planetChip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  planetChipEmoji: { fontSize: 18, marginRight: 10 },
  planetChipTxt:   { color: '#fff', fontFamily: theme.fonts.sansSemiBold, fontSize: 14, flex: 1 },
  planetChipSign:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 12 },
  emptyHouse:      { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
  closeBtn:        { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 30, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  closeTxt:        { color: theme.colors.textSecondary, fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
});
