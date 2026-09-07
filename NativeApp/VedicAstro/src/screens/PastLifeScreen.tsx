/**
 * PastLifeScreen.tsx
 *
 * Nadi Jyotisha-style Past Life Analysis
 * Rahu-Ketu axis, Saturn, 12th house, Atmakaraka, 5th house (purva punya)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { pastLifeApi, normalizeTime } from '../api/services';
import { useProfileAutofill } from '../hooks/useProfileAutofill';
import { theme } from '../theme/theme';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseBirthPlace(place: string): { city: string; state: string; country: string } {
  const parts = place.split(',').map(p => p.trim());
  return { city: parts[0] ?? '', state: parts[1] ?? '', country: parts[2] ?? '' };
}

function Accordion({ title, children, color }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  const c = color ?? theme.colors.gold;
  return (
    <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.85}>
      <LinearGradient colors={[c + '20', c + '08']} style={[styles.accordion, { borderColor: c + '40' }]}>
        <View style={styles.accordionRow}>
          <Text style={[styles.accordionTitle, { color: c }]}>{title}</Text>
          <Text style={[styles.accordionChevron, { color: c }]}>{open ? '▲' : '▼'}</Text>
        </View>
        {open && <View style={styles.accordionBody}>{children}</View>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function InfoPill({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '80', backgroundColor: color + '20' }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

function StarField2() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 60 }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() * 2.5 + 0.8,
            height: Math.random() * 2.5 + 0.8,
            borderRadius: 2,
            backgroundColor: '#ffffff',
            opacity: Math.random() * 0.55 + 0.15,
          }}
        />
      ))}
    </View>
  );
}

// ── screen ────────────────────────────────────────────────────────────────────

export const PastLifeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { autofill } = useProfileAutofill();

  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthPlace, setBirthPlace] = useState('');

  // Pre-fill from saved profile when it loads
  React.useEffect(() => {
    if (autofill.dateOfBirth) setBirthDate(d => d || autofill.dateOfBirth);
    if (autofill.timeOfBirth) setBirthTime(t => t === '06:00' ? autofill.timeOfBirth : t);
    if (autofill.placeOfBirth) setBirthPlace(p => p || autofill.placeOfBirth);
  }, [autofill.dateOfBirth, autofill.timeOfBirth, autofill.placeOfBirth]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAnalyse = async () => {
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!birthPlace.trim()) { setError('Please enter your birth place.'); return; }
    setError('');
    setLoading(true);
    try {
      const { city, state, country } = parseBirthPlace(birthPlace);
      const data = await pastLifeApi.analyze({
        birthDate,
        birthTime: normalizeTime(birthTime),
        city, state, country,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── result view ───────────────────────────────────────────────────────────
  if (result) {
    const pl = result.previousLife ?? {};
    const toArr = (v: any): string[] => !v ? [] : Array.isArray(v) ? v.map(String) : String(v).split(',').map((s: string) => s.trim()).filter(Boolean);
    const kd: any[] = Array.isArray(result.karmicDebts) ? result.karmicDebts : [];
    const kr: any[] = Array.isArray(result.karmicRelationships) ? result.karmicRelationships : [];
    const gifts: string[] = toArr(result.inheritedGifts);
    const nadi: string[] = toArr(result.nadiIndicators);
    const remedies: string[] = toArr(result.karmicRemedies);

    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StarField2 />
        <LinearGradient colors={['#0d0022cc', '#0d0022aa']} style={styles.header}>
          <TouchableOpacity onPress={() => setResult(null)} style={styles.backTouchable}>
            <Text style={styles.backArrow}>← New Reading</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔄 Past Life</Text>
          <View style={{ width: 100 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.resultPad} showsVerticalScrollIndicator={false}>

          {/* karmic signature banner */}
          <LinearGradient colors={['#1e0040', '#0d0022']} style={styles.karmaBanner}>
            <Text style={styles.karmaEmoji}>☸️</Text>
            <Text style={styles.karmaBannerTitle}>Karmic Signature</Text>
            <Text style={styles.karmaBannerText}>{result.karmicSignature}</Text>
          </LinearGradient>

          {/* soul lesson */}
          {result.soulLesson ? (
            <LinearGradient colors={['#2d0040', '#1a0030']} style={styles.soulCard}>
              <Text style={styles.soulLabel}>🌠 Soul Lesson in This Life</Text>
              <Text style={styles.soulText}>{result.soulLesson}</Text>
            </LinearGradient>
          ) : null}

          {/* previous life narrative */}
          {pl.era && (
            <>
              <Text style={styles.sectionTitle}>📜 Previous Life Narrative</Text>
              <LinearGradient colors={['#1a1030', '#120828']} style={styles.narrativeCard}>
                <View style={styles.narrativeMeta}>
                  <View style={styles.narrativeTag}>
                    <Text style={styles.narrativeTagLabel}>Era</Text>
                    <Text style={styles.narrativeTagValue}>{pl.era}</Text>
                  </View>
                  <View style={styles.narrativeTag}>
                    <Text style={styles.narrativeTagLabel}>Role</Text>
                    <Text style={styles.narrativeTagValue}>{pl.role}</Text>
                  </View>
                  <View style={styles.narrativeTag}>
                    <Text style={styles.narrativeTagLabel}>Region</Text>
                    <Text style={styles.narrativeTagValue}>{pl.region}</Text>
                  </View>
                </View>
                {toArr(pl.keyExperiences).length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.narrativeSubLabel}>Key Experiences</Text>
                    {toArr(pl.keyExperiences).map((e: string, i: number) => (
                      <Text key={i} style={styles.narrativeItem}>◆ {e}</Text>
                    ))}
                  </View>
                )}
                {pl.unfinishedBusiness && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.narrativeSubLabel}>Unfinished Business</Text>
                    <Text style={styles.narrativeItem}>{pl.unfinishedBusiness}</Text>
                  </View>
                )}
              </LinearGradient>
            </>
          )}

          {/* karmic debts */}
          {kd.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚖️ Karmic Debts</Text>
              {kd.map((d: any, i: number) => (
                <Accordion key={i} title={`${d.planet} in House ${d.house}`} color="#E74C3C">
                  <Text style={styles.accordionDesc}>{d.description}</Text>
                  {d.resolution && <Text style={styles.accordionRes}>✅ Resolution: {d.resolution}</Text>}
                </Accordion>
              ))}
            </>
          )}

          {/* inherited gifts */}
          {gifts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🎁 Inherited Gifts</Text>
              <View style={styles.pillsRow}>
                {gifts.map((g, i) => <InfoPill key={i} text={g} color="#27AE60" />)}
              </View>
            </>
          )}

          {/* karmic relationships */}
          {kr.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🫂 Karmic Relationships</Text>
              {kr.map((r: any, i: number) => (
                <Accordion key={i} title={`${r.type} (${r.planetIndicator})`} color="#9B59B6">
                  <Text style={styles.accordionDesc}>{r.description}</Text>
                  {r.lesson && <Text style={styles.accordionRes}>💡 Lesson: {r.lesson}</Text>}
                </Accordion>
              ))}
            </>
          )}

          {/* current life purpose + spiritual path */}
          {result.currentLifePurpose && (
            <LinearGradient colors={['#0d2240', '#0a1a30']} style={styles.purposeCard}>
              <Text style={styles.purposeLabel}>🌟 Current Life Purpose</Text>
              <Text style={styles.purposeText}>{result.currentLifePurpose}</Text>
              {result.spiritualPath && (
                <>
                  <Text style={[styles.purposeLabel, { marginTop: 14 }]}>🧘 Spiritual Path</Text>
                  <Text style={styles.purposeText}>{result.spiritualPath}</Text>
                </>
              )}
            </LinearGradient>
          )}

          {/* nadi indicators */}
          {nadi.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>📿 Nadi Indicators</Text>
              <LinearGradient colors={['#1a0810', '#100508']} style={styles.remedyCard}>
                {nadi.map((n: string, i: number) => (
                  <Text key={i} style={styles.remedyText}>🔺 {n}</Text>
                ))}
              </LinearGradient>
            </>
          )}

          {/* karmic remedies */}
          {remedies.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🪔 Karmic Remedies</Text>
              <LinearGradient colors={['#0a1508', '#050a04']} style={styles.remedyCard}>
                {remedies.map((r: string, i: number) => (
                  <Text key={i} style={styles.remedyText}>🌿 {r}</Text>
                ))}
              </LinearGradient>
            </>
          )}

          {result.disclaimer && (
            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── input form ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StarField2 />
      <LinearGradient colors={['#0d0022cc', '#0d0022aa']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backTouchable}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔄 Past Life Analysis</Text>
        <View style={{ width: 80 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formPad} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1e0040', '#0d0022']} style={styles.introBanner}>
          <Text style={styles.introEmoji}>☸️</Text>
          <Text style={styles.introTitle}>Nadi Jyotisha Karma Reading</Text>
          <Text style={styles.introText}>
            Unlock the secrets of your past lives through the ancient science of Nadi Jyotisha.
            Your Rahu–Ketu axis, Saturn, 12th house, Atmakaraka, and 5th house (purva punya) reveal
            karmic debts, inherited gifts, and your soul's journey across lifetimes.
          </Text>
        </LinearGradient>

        <DatePickerField label="Date of Birth" value={birthDate} onChangeText={setBirthDate} maximumDate={new Date()} />
        <TimePickerField label="Time of Birth" value={birthTime} onChangeText={setBirthTime} />
        <PlaceInput label="Place of Birth" value={birthPlace} onChangeText={setBirthPlace} placeholder="City, State, Country" />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.gold} />
            <Text style={styles.loadingText}>Decoding your soul's journey…</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleAnalyse} activeOpacity={0.85} style={{ marginTop: 8 }}>
            <LinearGradient colors={['#7B2FBE', '#4A1080']} style={styles.unveilBtn}>
              <Text style={styles.unveilBtnText}>☸️ Unveil Past Life</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />
        <Text style={styles.footNote}>
          🔮 Analysis powered by Vedic astrology and Nadi Jyotisha principles.
          For spiritual guidance only.
        </Text>
      </ScrollView>
    </View>
  );
};

// ── styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08001a' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backTouchable: {},
  backArrow: { color: theme.colors.gold, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // input form
  formPad: { paddingHorizontal: 18, paddingBottom: 48 },
  introBanner: { borderRadius: 18, padding: 22, marginBottom: 24, alignItems: 'center' },
  introEmoji: { fontSize: 44, marginBottom: 8 },
  introTitle: { color: '#D4A843', fontSize: 17, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  introText: { color: '#c8b8e0', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  formLabel: { color: '#a888cc', fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 6 },
  errorText: { color: '#ff6b6b', marginTop: 12, textAlign: 'center' },

  loadingBox: { alignItems: 'center', marginTop: 30 },
  loadingText: { color: '#a888cc', marginTop: 12, fontSize: 14 },

  unveilBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  unveilBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: '#ffffff10', marginVertical: 24 },
  footNote: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // result
  resultPad: { paddingHorizontal: 16, paddingBottom: 48 },

  karmaBanner: { borderRadius: 20, padding: 22, marginBottom: 16, alignItems: 'center' },
  karmaEmoji: { fontSize: 42, marginBottom: 6 },
  karmaBannerTitle: { color: '#D4A843', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  karmaBannerText: { color: '#e0d0f8', fontSize: 14, lineHeight: 21, textAlign: 'center' },

  soulCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  soulLabel: { color: '#9B59B6', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  soulText: { color: '#d8c8f0', fontSize: 14, lineHeight: 21 },

  sectionTitle: { color: '#D4A843', fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 10 },

  narrativeCard: { borderRadius: 16, padding: 16, marginBottom: 10 },
  narrativeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  narrativeTag: { backgroundColor: '#ffffff0d', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  narrativeTagLabel: { color: '#888', fontSize: 10, textTransform: 'uppercase' },
  narrativeTagValue: { color: '#E8C97C', fontSize: 13, fontWeight: '700' },
  narrativeSubLabel: { color: '#9B59B6', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  narrativeItem: { color: '#d0c0e8', fontSize: 13, lineHeight: 20, marginBottom: 2 },

  accordion: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  accordionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  accordionChevron: { fontSize: 11, marginLeft: 8 },
  accordionBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff12' },
  accordionDesc: { color: '#d4c8e8', fontSize: 13, lineHeight: 19 },
  accordionRes: { color: '#27AE60', fontSize: 12, marginTop: 6, lineHeight: 17 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600' },

  purposeCard: { borderRadius: 16, padding: 18, marginBottom: 10 },
  purposeLabel: { color: '#D4A843', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  purposeText: { color: '#d4d4f0', fontSize: 14, lineHeight: 21 },

  remedyCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  remedyText: { color: '#c8dcc8', fontSize: 13, lineHeight: 22 },

  disclaimer: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16, fontStyle: 'italic' },
});
