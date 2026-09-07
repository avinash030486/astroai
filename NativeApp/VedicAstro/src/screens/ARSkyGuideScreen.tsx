/**
 * ARSkyGuideScreen.tsx
 *
 * Live AR Sky Guide — point your phone at the sky to see Vedic planet positions
 * overlaid on the camera feed with Jyotish meanings.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Modal, ScrollView, Animated, StatusBar, ActivityIndicator, TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { useSkyPlanets, SkyPlanet } from '../hooks/useSkyPlanets';
import { usePersonalDayScore, PersonalDayScore } from '../hooks/usePersonalDayScore';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Transit Prediction Data ───────────────────────────────────────────────────
// [planet][sign] → { effect, keywords, rating (1-5) }
type TransitEffect = { effect: string; keywords: string[]; rating: number };

const TRANSIT_PREDICTIONS: Record<string, Record<string, TransitEffect>> = {
  Sun: {
    Aries:       { effect: 'Peak vitality and leadership energy. Excellent for new ventures, asserting authority and starting bold projects.', keywords: ['Leadership','Initiative','Courage'], rating: 5 },
    Taurus:      { effect: 'Focus shifts to material security, finances and steady progress. A grounding period for the soul.', keywords: ['Finance','Stability','Patience'], rating: 3 },
    Gemini:      { effect: 'Communication and intellect are highlighted. Good for writing, networking and learning new skills.', keywords: ['Communication','Learning','Adaptability'], rating: 4 },
    Cancer:      { effect: 'Sun is debilitated here — ego conflicts with emotions. Avoid confrontations; focus on home and family healing.', keywords: ['Home','Emotions','Caution'], rating: 2 },
    Leo:         { effect: 'Sun in own sign — maximum strength. Recognition, fame and authority flow naturally. A powerful period.', keywords: ['Fame','Authority','Success'], rating: 5 },
    Virgo:       { effect: 'Analytical energy rises. Good for health routines, service work and perfecting skills. Avoid over-criticism.', keywords: ['Health','Analysis','Service'], rating: 4 },
    Libra:       { effect: 'Relationships and partnerships take centre stage. Balance and diplomacy are your greatest tools now.', keywords: ['Relationships','Balance','Diplomacy'], rating: 3 },
    Scorpio:     { effect: 'Transformation and depth. Hidden matters surface. Good for research, occult studies and healing old wounds.', keywords: ['Transformation','Hidden truths','Research'], rating: 3 },
    Sagittarius: { effect: 'Optimism and expansion. Great for higher education, travel, philosophy and spiritual pursuits.', keywords: ['Expansion','Wisdom','Travel'], rating: 4 },
    Capricorn:   { effect: 'Discipline and ambition are amplified. Career advancement favoured through hard work and structure.', keywords: ['Career','Discipline','Ambition'], rating: 4 },
    Aquarius:    { effect: 'Humanitarian and innovative energy. Group work, social causes and unconventional ideas are highlighted.', keywords: ['Innovation','Community','Ideals'], rating: 3 },
    Pisces:      { effect: 'Spiritual introspection and creativity bloom. Boundaries dissolve — protect your energy and trust intuition.', keywords: ['Spirituality','Creativity','Intuition'], rating: 3 },
  },
  Moon: {
    Aries:       { effect: 'Mind is quick, impulsive and courageous. Emotional reactions are fast — channel this fire into action, not arguments.', keywords: ['Impulse','Courage','Quick decisions'], rating: 3 },
    Taurus:      { effect: 'Moon is exalted here — peak emotional stability and comfort. Excellent for nurturing relationships and creative work.', keywords: ['Stability','Comfort','Creativity'], rating: 5 },
    Gemini:      { effect: 'Restless and curious mind. Many ideas compete for attention. Social interactions are energising today.', keywords: ['Curiosity','Socialising','Ideas'], rating: 3 },
    Cancer:      { effect: 'Moon in own sign — deeply intuitive and nurturing. Strong connection to home, mother and emotions.', keywords: ['Intuition','Home','Nurturing'], rating: 5 },
    Leo:         { effect: 'Emotions seek expression and recognition. Creativity is high — excellent for performance, romance and generosity.', keywords: ['Expression','Romance','Generosity'], rating: 4 },
    Virgo:       { effect: 'Analytical emotions — you may over-think feelings. Good for organising, health habits and practical service.', keywords: ['Analysis','Health','Practicality'], rating: 3 },
    Libra:       { effect: 'Harmony and beauty soothe the mind. Ideal for relationships, art and seeking peaceful resolutions.', keywords: ['Harmony','Art','Relationships'], rating: 4 },
    Scorpio:     { effect: 'Moon is debilitated — emotional intensity and possessiveness can peak. Avoid obsessive thoughts; journal or meditate.', keywords: ['Intensity','Caution','Inner work'], rating: 2 },
    Sagittarius: { effect: 'Optimistic and philosophical mood. Mind seeks freedom, adventure and meaning beyond the mundane.', keywords: ['Optimism','Freedom','Philosophy'], rating: 4 },
    Capricorn:   { effect: 'Practical and disciplined emotions. You may suppress feelings for duty — allow yourself to rest too.', keywords: ['Discipline','Duty','Endurance'], rating: 3 },
    Aquarius:    { effect: 'Detached, humanitarian and innovative mood. Good for collective thinking and breaking old emotional patterns.', keywords: ['Detachment','Innovation','Community'], rating: 3 },
    Pisces:      { effect: 'Highly empathetic and spiritual. Intuition peaks but boundaries dissolve. Meditation and creative arts are healing.', keywords: ['Empathy','Spirituality','Dreams'], rating: 4 },
  },
  Mars: {
    Aries:       { effect: 'Mars in own sign — raw power and initiative. Take bold action but avoid recklessness and anger.', keywords: ['Power','Action','Leadership'], rating: 5 },
    Taurus:      { effect: 'Steady, determined energy. Progress is slow but relentless. Good for building wealth and physical endurance.', keywords: ['Endurance','Wealth','Persistence'], rating: 4 },
    Gemini:      { effect: 'Quick, scattered energy. Good for debates and multitasking but guard against sharp words and arguments.', keywords: ['Debate','Agility','Communication'], rating: 3 },
    Cancer:      { effect: 'Mars is debilitated — energy turns inward or passive-aggressive. Protect emotional boundaries; avoid family conflicts.', keywords: ['Caution','Emotions','Boundaries'], rating: 2 },
    Leo:         { effect: 'Fiery ambition and creative drive. Leadership shines — a powerful period for bold, visible actions.', keywords: ['Ambition','Creativity','Leadership'], rating: 5 },
    Virgo:       { effect: 'Precise and analytical energy. Excellent for detailed work, health improvements and strategic planning.', keywords: ['Precision','Health','Strategy'], rating: 4 },
    Libra:       { effect: 'Energy is channelled into relationships and justice. Avoid indecision — commit and act on your choices.', keywords: ['Justice','Relationships','Balance'], rating: 3 },
    Scorpio:     { effect: 'Mars in own sign (classical) — deep, transformative and investigative power. Excellent for research and healing.', keywords: ['Transformation','Research','Power'], rating: 5 },
    Sagittarius: { effect: 'Energy expands outward — travel, adventure, philosophy and higher goals are favoured.', keywords: ['Adventure','Expansion','Goals'], rating: 4 },
    Capricorn:   { effect: 'Mars is exalted — disciplined, strategic and unstoppable. Peak period for career and long-term ambitions.', keywords: ['Career','Discipline','Achievement'], rating: 5 },
    Aquarius:    { effect: 'Rebellious, innovative energy. Good for social causes and group actions; avoid erratic decisions.', keywords: ['Innovation','Social causes','Reform'], rating: 3 },
    Pisces:      { effect: 'Energy is diffuse and spiritual. Good for creative and spiritual work; avoid escapism and procrastination.', keywords: ['Spirituality','Creativity','Caution'], rating: 3 },
  },
  Mercury: {
    Aries:       { effect: 'Quick, sharp thinking. Great for fast decisions, pitches and starting new intellectual projects.', keywords: ['Speed','Decisions','Wit'], rating: 4 },
    Taurus:      { effect: 'Deliberate and practical thinking. Good for financial planning, sensory arts and steady communication.', keywords: ['Practical','Finance','Steadiness'], rating: 3 },
    Gemini:      { effect: 'Mercury in own sign — peak intelligence and communication. Writing, trading, teaching and networking all excel.', keywords: ['Intelligence','Communication','Networking'], rating: 5 },
    Cancer:      { effect: 'Intuitive and emotionally driven thinking. Good for counselling and empathetic communication.', keywords: ['Intuition','Empathy','Counselling'], rating: 3 },
    Leo:         { effect: 'Dramatic and confident communication. Great for public speaking, creative writing and leading conversations.', keywords: ['Confidence','Public speaking','Creativity'], rating: 4 },
    Virgo:       { effect: 'Mercury exalted and in own sign — analytical perfection. Excellent for editing, research, health and systems thinking.', keywords: ['Analysis','Research','Perfection'], rating: 5 },
    Libra:       { effect: 'Diplomatic and balanced thinking. Excellent for mediation, contracts and weighing all perspectives.', keywords: ['Diplomacy','Contracts','Balance'], rating: 4 },
    Scorpio:     { effect: 'Deep, investigative thinking. Good for uncovering secrets, psychological work and occult studies.', keywords: ['Investigation','Psychology','Depth'], rating: 4 },
    Sagittarius: { effect: 'Mercury is debilitated — thinking may be scattered or overconfident. Focus before speaking; avoid overpromising.', keywords: ['Caution','Focus','Philosophy'], rating: 2 },
    Capricorn:   { effect: 'Structured, practical thinking. Excellent for long-term planning, business strategy and disciplined study.', keywords: ['Structure','Strategy','Business'], rating: 4 },
    Aquarius:    { effect: 'Innovative and futuristic ideas. Good for technology, humanitarian thinking and breaking mental patterns.', keywords: ['Innovation','Technology','Humanitarian'], rating: 4 },
    Pisces:      { effect: 'Mercury is debilitated — intuitive but imprecise. Lean into creativity and spirituality; double-check facts.', keywords: ['Creativity','Intuition','Caution'], rating: 2 },
  },
  Jupiter: {
    Aries:       { effect: 'Wisdom and expansion through bold action and leadership. A powerful period to start meaningful ventures.', keywords: ['Leadership','Expansion','Wisdom'], rating: 4 },
    Taurus:      { effect: 'Wealth, comfort and material expansion are blessed. Financial growth and sensory pleasures are favoured.', keywords: ['Wealth','Comfort','Growth'], rating: 5 },
    Gemini:      { effect: 'Knowledge and communication expand. Teaching, writing, publishing and networking reach wider audiences.', keywords: ['Knowledge','Teaching','Networking'], rating: 4 },
    Cancer:      { effect: 'Jupiter is exalted — maximum grace, wisdom and abundance. Emotional healing, family blessings and spiritual growth peak.', keywords: ['Grace','Abundance','Healing'], rating: 5 },
    Leo:         { effect: 'Generous, magnanimous and creative expansion. Leadership roles and public recognition are blessed.', keywords: ['Generosity','Recognition','Creativity'], rating: 5 },
    Virgo:       { effect: 'Jupiter in its fall — wisdom is over-analytical. Service and health improvements are favoured; avoid perfectionism.', keywords: ['Service','Health','Caution'], rating: 2 },
    Libra:       { effect: 'Relationships, justice and partnerships are blessed. Excellent for marriage, legal matters and social harmony.', keywords: ['Relationships','Justice','Harmony'], rating: 4 },
    Scorpio:     { effect: 'Deep wisdom and transformative grace. Excellent for spiritual research, healing and uncovering hidden truths.', keywords: ['Transformation','Wisdom','Healing'], rating: 4 },
    Sagittarius: { effect: 'Jupiter in own sign — peak expansion. Philosophy, higher education, travel and spiritual growth are all amplified.', keywords: ['Expansion','Philosophy','Spirituality'], rating: 5 },
    Capricorn:   { effect: 'Jupiter is debilitated — growth is slow and constrained by structure. Work patiently; don\'t expect quick rewards.', keywords: ['Patience','Structure','Caution'], rating: 2 },
    Aquarius:    { effect: 'Expansion through community, technology and humanitarian ideals. Group ventures and social causes flourish.', keywords: ['Community','Innovation','Ideals'], rating: 4 },
    Pisces:      { effect: 'Jupiter in own sign — spiritual expansion, compassion and creativity overflow. A deeply auspicious transit.', keywords: ['Spirituality','Compassion','Creativity'], rating: 5 },
  },
  Venus: {
    Aries:       { effect: 'Passionate, impulsive love energy. Exciting new attractions but conflicts in relationships need patience.', keywords: ['Passion','Romance','Excitement'], rating: 3 },
    Taurus:      { effect: 'Venus in own sign — sensory pleasures, beauty and love are deeply fulfilling. Excellent for art, finance and romance.', keywords: ['Luxury','Romance','Beauty'], rating: 5 },
    Gemini:      { effect: 'Charming and witty in relationships. Light-hearted love and creative collaborations flourish.', keywords: ['Charm','Wit','Collaboration'], rating: 4 },
    Cancer:      { effect: 'Nurturing and devoted love. Home beautification, family harmony and emotional bonds deepen.', keywords: ['Nurturing','Family','Devotion'], rating: 4 },
    Leo:         { effect: 'Glamorous, dramatic and generous in love. Great for romance, creative arts and social display.', keywords: ['Glamour','Generosity','Romance'], rating: 4 },
    Virgo:       { effect: 'Venus is debilitated — love may feel critical or withholding. Focus on acts of service rather than grand gestures.', keywords: ['Service','Caution','Practicality'], rating: 2 },
    Libra:       { effect: 'Venus in own sign — peak harmony, beauty and relational grace. Ideal for marriage, partnerships and artistic work.', keywords: ['Harmony','Beauty','Partnership'], rating: 5 },
    Scorpio:     { effect: 'Intense, transformative love. Deep emotional bonds form; jealousy and obsession must be consciously managed.', keywords: ['Intensity','Transformation','Depth'], rating: 3 },
    Sagittarius: { effect: 'Free-spirited and adventurous in love. Philosophy and travel add romance; commitment may feel restrictive.', keywords: ['Freedom','Adventure','Optimism'], rating: 3 },
    Capricorn:   { effect: 'Practical, long-term approach to love. Commitment and loyalty are valued over grand romantic gestures.', keywords: ['Commitment','Loyalty','Practicality'], rating: 3 },
    Aquarius:    { effect: 'Unconventional and friendly love. Open-minded relationships and creative group collaborations are favoured.', keywords: ['Unconventional','Friendship','Creativity'], rating: 3 },
    Pisces:      { effect: 'Venus is exalted — unconditional love, artistic inspiration and spiritual devotion peak. Deeply auspicious for relationships.', keywords: ['Unconditional love','Art','Spirituality'], rating: 5 },
  },
  Saturn: {
    Aries:       { effect: 'Saturn is debilitated — discipline clashes with impulsive energy. Slow down; avoid hasty decisions and overexertion.', keywords: ['Caution','Patience','Restraint'], rating: 2 },
    Taurus:      { effect: 'Steady, structured effort toward material security. Slow but lasting financial and career progress.', keywords: ['Persistence','Finance','Structure'], rating: 4 },
    Gemini:      { effect: 'Disciplined communication and structured thinking. Good for serious study, writing and long-term learning.', keywords: ['Discipline','Study','Communication'], rating: 3 },
    Cancer:      { effect: 'Emotional restrictions and family responsibilities weigh heavy. Karmic lessons around nurturing and home life.', keywords: ['Karma','Family','Responsibility'], rating: 2 },
    Leo:         { effect: 'Ego meets discipline. Authority comes through hard work, not entitlement. Karmic leadership lessons apply.', keywords: ['Humility','Leadership','Karma'], rating: 3 },
    Virgo:       { effect: 'Saturn excels here — meticulous, disciplined and service-oriented. Excellent for health routines and systematic work.', keywords: ['Discipline','Service','Health'], rating: 5 },
    Libra:       { effect: 'Saturn is exalted — peak karmic fairness and disciplined relationships. Justice, law and balanced partnerships are blessed.', keywords: ['Justice','Balance','Law'], rating: 5 },
    Scorpio:     { effect: 'Deep karmic transformation. Hidden fears surface to be resolved. Excellent for shadow work and spiritual discipline.', keywords: ['Transformation','Karma','Shadow work'], rating: 3 },
    Sagittarius: { effect: 'Disciplined philosophy and structured spiritual practice. Long-term wisdom comes through persistence and study.', keywords: ['Wisdom','Spirituality','Discipline'], rating: 3 },
    Capricorn:   { effect: 'Saturn in own sign — peak discipline, structure and ambition. Career mastery and long-term goals are powerfully supported.', keywords: ['Mastery','Career','Ambition'], rating: 5 },
    Aquarius:    { effect: 'Saturn in own sign — disciplined innovation and social reform. Technology, community and systemic change are favoured.', keywords: ['Innovation','Reform','Community'], rating: 5 },
    Pisces:      { effect: 'Karmic spiritual lessons. Boundaries dissolve between duty and dreams — find discipline within compassion.', keywords: ['Spirituality','Karma','Compassion'], rating: 3 },
  },
  Rahu: {
    Aries:       { effect: 'Rahu amplifies ambition, impulsiveness and desire for leadership. Watch for recklessness; channel drive purposefully.', keywords: ['Ambition','Drive','Caution'], rating: 3 },
    Taurus:      { effect: 'Rahu obsesses over material comfort and wealth accumulation. Excellent for financial gains but guard against greed.', keywords: ['Wealth','Desire','Material'], rating: 4 },
    Gemini:      { effect: 'Rapid mental activity, information overload and clever deception. Excellent for media, technology and communication.', keywords: ['Technology','Media','Intellect'], rating: 4 },
    Cancer:      { effect: 'Emotional confusion and deep desire for security. Foreign or unconventional family situations are highlighted.', keywords: ['Security','Emotions','Foreign'], rating: 2 },
    Leo:         { effect: 'Desire for fame, recognition and power intensifies. Public rise is possible — stay authentic and avoid ego traps.', keywords: ['Fame','Power','Authenticity'], rating: 3 },
    Virgo:       { effect: 'Obsessive focus on health, purity and analytical perfection. Excellent for research and technical mastery.', keywords: ['Health','Research','Perfection'], rating: 4 },
    Libra:       { effect: 'Obsession with relationships, beauty and fairness. Unconventional partnerships and legal matters are highlighted.', keywords: ['Relationships','Beauty','Justice'], rating: 3 },
    Scorpio:     { effect: 'Deep obsession with hidden power, occult knowledge and transformation. Secrets and sudden changes abound.', keywords: ['Occult','Transformation','Secrets'], rating: 3 },
    Sagittarius: { effect: 'Desire for spiritual authority and foreign wisdom. Watch for false gurus; seek authentic higher knowledge.', keywords: ['Spirituality','Foreign','Wisdom'], rating: 3 },
    Capricorn:   { effect: 'Intense drive for career status and worldly achievement. Foreign career opportunities and rapid rise are possible.', keywords: ['Career','Status','Achievement'], rating: 4 },
    Aquarius:    { effect: 'Obsession with technology, innovation and social networks. Excellent period for digital ventures and mass communication.', keywords: ['Technology','Innovation','Networks'], rating: 4 },
    Pisces:      { effect: 'Spiritual illusions and dissolving boundaries. Psychic sensitivity peaks — discern reality from fantasy.', keywords: ['Spirituality','Illusion','Sensitivity'], rating: 3 },
  },
  Ketu: {
    Aries:       { effect: 'Past-life warrior energy surfaces. Detachment from ego and aggression leads to spiritual courage.', keywords: ['Detachment','Courage','Past karma'], rating: 3 },
    Taurus:      { effect: 'Detachment from material comforts. Spiritual lessons around non-attachment to wealth and possessions.', keywords: ['Non-attachment','Spirituality','Simplicity'], rating: 3 },
    Gemini:      { effect: 'Mental detachment and past-life communication skills resurface. Intuitive writing and teaching abilities emerge.', keywords: ['Intuition','Past skills','Detachment'], rating: 3 },
    Cancer:      { effect: 'Detachment from emotional security and family ties. Past-life healing of maternal wounds is highlighted.', keywords: ['Healing','Detachment','Family karma'], rating: 2 },
    Leo:         { effect: 'Detachment from ego and recognition. Past-life leadership wisdom can emerge without desire for applause.', keywords: ['Wisdom','Detachment','Ego release'], rating: 3 },
    Virgo:       { effect: 'Past-life skills in healing and analysis resurface. Detachment from perfectionism leads to true service.', keywords: ['Healing skills','Service','Detachment'], rating: 4 },
    Libra:       { effect: 'Detachment from relationships and beauty. Past-life artistic or diplomatic talents emerge spontaneously.', keywords: ['Detachment','Art','Past talents'], rating: 3 },
    Scorpio:     { effect: 'Ketu in own sign — profound spiritual insight and psychic sensitivity. Liberation through surrender and letting go.', keywords: ['Liberation','Psychic','Surrender'], rating: 5 },
    Sagittarius: { effect: 'Past-life spiritual teacher energy. Wisdom comes naturally; beware of spiritual pride and dogmatism.', keywords: ['Wisdom','Spirituality','Humility'], rating: 4 },
    Capricorn:   { effect: 'Detachment from worldly ambitions. Past-life mastery in discipline resurfaces for spiritual application.', keywords: ['Detachment','Discipline','Spirituality'], rating: 3 },
    Aquarius:    { effect: 'Detachment from group identity and social networks. Sudden insights and unconventional spiritual paths emerge.', keywords: ['Insights','Detachment','Innovation'], rating: 3 },
    Pisces:      { effect: 'Ketu in Pisces — deepest spiritual liberation. Past-life mystical abilities resurface; final karmic release is near.', keywords: ['Liberation','Mysticism','Karma release'], rating: 5 },
  },
};

function getTransitPrediction(planet: string, sign: string): TransitEffect {
  return TRANSIT_PREDICTIONS[planet]?.[sign] ?? {
    effect: `${planet} transiting ${sign} brings its natural qualities into this sign's domain.`,
    keywords: [],
    rating: 3,
  };
}

function ratingStars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function ratingColor(n: number): string {
  if (n >= 5) return '#FFD700';
  if (n >= 4) return '#7FFF00';
  if (n >= 3) return theme.colors.teal;
  if (n >= 2) return '#FFA500';
  return theme.colors.error;
}

// ── Compass Rose ─────────────────────────────────────────────────────────────
const DIRS = ['N','NE','E','SE','S','SW','W','NW'];

function CompassRose({ heading }: { heading: number }) {
  return (
    <View style={compassStyles.wrap} pointerEvents="none">
      <View style={[compassStyles.ring, { transform: [{ rotate: `${-heading}deg` }] }]}>
        {DIRS.map((d, i) => {
          const angle = (i / 8) * 2 * Math.PI;
          const r = 34;
          const x = r * Math.sin(angle);
          const y = -r * Math.cos(angle);
          return (
            <View key={d} style={[compassStyles.dir, { left: 42 + x - 8, top: 42 + y - 8 }]}>
              <Text style={[compassStyles.dirTxt, d === 'N' && compassStyles.north]}>{d}</Text>
            </View>
          );
        })}
        <View style={compassStyles.needle} />
      </View>
      <Text style={compassStyles.heading}>{Math.round(heading)}°</Text>
    </View>
  );
}

const compassStyles = StyleSheet.create({
  wrap:    { position:'absolute', top: 16, right: 16, alignItems:'center' },
  ring:    { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: 'rgba(201,150,58,0.5)', backgroundColor:'rgba(8,14,26,0.7)', position:'relative' },
  dir:     { position:'absolute', width:16, height:16, alignItems:'center', justifyContent:'center' },
  dirTxt:  { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: theme.fonts.sans },
  north:   { color: theme.colors.gold, fontFamily: theme.fonts.sansSemiBold },
  needle:  { position:'absolute', top:6, left:42, width:2, height:20, backgroundColor: theme.colors.gold, borderRadius:1 },
  heading: { color: theme.colors.gold, fontSize: 11, fontFamily: theme.fonts.sans, marginTop: 4 },
});

// ── Planet Dot Overlay ────────────────────────────────────────────────────────
interface PlanetDotProps {
  planet: SkyPlanet;
  onPress: (p: SkyPlanet) => void;
  personalColor?: string;
}

function PlanetDot({ planet, onPress, personalColor }: PlanetDotProps) {
  const dotColor = personalColor ?? planet.color;
  const scale = useRef(new Animated.Value(1)).current;

  const pulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,   duration: 180, useNativeDriver: true }),
    ]).start();
    onPress(planet);
  }, [planet, onPress, scale]);

  if (!planet.inView || !planet.aboveHorizon) return null;

  return (
    <TouchableOpacity
      style={[dotStyles.touch, { left: planet.x - 28, top: planet.y - 28 }]}
      onPress={pulse}
      activeOpacity={0.8}
    >
      <Animated.View style={[dotStyles.outer, { borderColor: dotColor, transform: [{ scale }] }]}>
        <View style={[dotStyles.inner, { backgroundColor: dotColor + '33' }]}>
          <Text style={dotStyles.emoji}>{planet.emoji}</Text>
        </View>
      </Animated.View>
      <View style={[dotStyles.labelBox, { borderColor: dotColor + '88' }]}>
        <Text style={[dotStyles.label, { color: dotColor === '#FFFFFF' ? '#ddd' : dotColor }]}>
          {planet.jyotishName}
        </Text>
        <Text style={dotStyles.sign}>{planet.siderealSign}</Text>
      </View>
    </TouchableOpacity>
  );
}

const dotStyles = StyleSheet.create({
  touch:    { position:'absolute', alignItems:'center' },
  outer:    { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems:'center', justifyContent:'center' },
  inner:    { width: 48, height: 48, borderRadius: 24, alignItems:'center', justifyContent:'center' },
  emoji:    { fontSize: 22 },
  labelBox: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, backgroundColor:'rgba(8,14,26,0.75)', alignItems:'center' },
  label:    { fontSize: 11, fontFamily: theme.fonts.sansSemiBold },
  sign:     { fontSize: 9,  fontFamily: theme.fonts.sans, color: 'rgba(255,255,255,0.6)' },
});

// ── Planet Detail Sheet ───────────────────────────────────────────────────────
function PlanetSheet({ planet, onClose, personalScore }: { planet: SkyPlanet | null; onClose: () => void; personalScore?: PersonalDayScore | null }) {
  if (!planet) return null;
  const alt   = Math.round(planet.alt);
  const az    = Math.round(planet.az);
  const vis   = planet.aboveHorizon;
  const pred  = getTransitPrediction(planet.name, planet.siderealSign);
  const ps    = personalScore?.planetScores?.[planet.name];

  return (
    <Modal visible={!!planet} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={sheet.container}>
        <LinearGradient
          colors={['#111E33', '#0D1829']}
          style={sheet.inner}
        >
          {/* Handle */}
          <View style={sheet.handle} />

          {/* Header */}
          <View style={sheet.headerRow}>
            <View style={[sheet.dot, { backgroundColor: planet.color + '33', borderColor: planet.color }]}>
              <Text style={sheet.dotEmoji}>{planet.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={sheet.planetName}>{planet.jyotishName}</Text>
              <Text style={sheet.planetSub}>{planet.name} · {planet.siderealSign}</Text>
            </View>
            <View style={[sheet.visBadge, { backgroundColor: vis ? '#2ECFB033' : '#f4433622' }]}>
              <Text style={[sheet.visTxt, { color: vis ? theme.colors.teal : theme.colors.error }]}>
                {vis ? '▲ Above' : '▼ Below'}
              </Text>
            </View>
          </View>

          <View style={sheet.divider} />

          {/* Sky position */}
          <View style={sheet.row}>
            <View style={sheet.stat}>
              <Text style={sheet.statVal}>{az}°</Text>
              <Text style={sheet.statLbl}>Azimuth</Text>
            </View>
            <View style={sheet.stat}>
              <Text style={sheet.statVal}>{alt}°</Text>
              <Text style={sheet.statLbl}>Altitude</Text>
            </View>
            <View style={sheet.stat}>
              <Text style={sheet.statVal}>{planet.siderealSign}</Text>
              <Text style={sheet.statLbl}>Vedic Sign</Text>
            </View>
          </View>

          <View style={sheet.divider} />

          {/* Transit prediction */}
          <View style={sheet.predHeader}>
            <Text style={sheet.sectionTitle}>Transit Prediction</Text>
            <Text style={[sheet.stars, { color: ratingColor(pred.rating) }]}>{ratingStars(pred.rating)}</Text>
          </View>
          <Text style={sheet.roleText}>{pred.effect}</Text>

          {/* Keywords */}
          {pred.keywords.length > 0 && (
            <View style={sheet.tagRow}>
              {pred.keywords.map(k => (
                <View key={k} style={[sheet.tag, { borderColor: planet.color + '66' }]}>
                  <Text style={[sheet.tagTxt, { color: planet.color === '#FFFFFF' ? '#ddd' : planet.color }]}>{k}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={sheet.divider} />

          {/* Personal insight */}
          {ps && (
            <>
              <View style={sheet.predHeader}>
                <Text style={sheet.sectionTitle}>Your Personal Transit</Text>
                <View style={[sheet.resultBadge, { backgroundColor: ps.color + '22', borderColor: ps.color + '55' }]}>
                  <Text style={[sheet.resultTxt, { color: ps.color }]}>
                    {ps.result === 'good' ? '✓ Favourable' : ps.result === 'challenging' ? '⚠ Challenging' : '● Neutral'}
                  </Text>
                </View>
              </View>
              <Text style={sheet.houseNote}>House {ps.houseFromMoon} from your natal Moon ({personalScore?.natalChart.moonSign})</Text>
              <Text style={[sheet.roleText, { marginBottom: 14 }]}>{ps.insight}</Text>
              <View style={sheet.divider} />
            </>
          )}

          {/* Jyotish role */}
          <Text style={sheet.sectionTitle}>Significations</Text>
          <Text style={sheet.roleText}>{planet.jyotishRole}</Text>

          <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
            <Text style={sheet.closeTxt}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  backdrop:   { flex: 1 },
  container:  { position:'absolute', bottom:0, left:0, right:0 },
  inner:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor:'rgba(255,255,255,0.2)', alignSelf:'center', marginBottom: 16 },
  headerRow:  { flexDirection:'row', alignItems:'center' },
  dot:        { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems:'center', justifyContent:'center' },
  dotEmoji:   { fontSize: 26 },
  planetName: { color: theme.colors.w90, fontSize: 22, fontFamily: theme.fonts.serifSemiBold },
  planetSub:  { color: theme.colors.textSecondary, fontSize: 13, fontFamily: theme.fonts.sans },
  visBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  visTxt:     { fontSize: 11, fontFamily: theme.fonts.sans },
  divider:    { height: 1, backgroundColor:'rgba(255,255,255,0.08)', marginVertical: 14 },
  row:        { flexDirection:'row', justifyContent:'space-around' },
  stat:       { alignItems:'center' },
  statVal:    { color: theme.colors.gold, fontSize: 18, fontFamily: theme.fonts.serifSemiBold },
  statLbl:    { color: theme.colors.textSecondary, fontSize: 11, fontFamily: theme.fonts.sans, marginTop: 2 },
  sectionTitle:{ color: theme.colors.gold, fontSize: 14, fontFamily: theme.fonts.sansSemiBold, marginBottom: 8 },  predHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 8 },
  stars:       { fontSize: 14, letterSpacing: 1 },
  tagRow:      { flexDirection:'row', flexWrap:'wrap', gap: 6, marginTop: 10 },
  tag:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor:'rgba(255,255,255,0.05)' },
  tagTxt:      { fontSize: 11, fontFamily: theme.fonts.sans },  roleText:   { color: theme.colors.w70, fontSize: 14, fontFamily: theme.fonts.sans, lineHeight: 22 },
  closeBtn:    { marginTop: 18, paddingVertical: 12, borderRadius: theme.radius.pill, backgroundColor:'rgba(201,150,58,0.18)', alignItems:'center' },
  closeTxt:    { color: theme.colors.gold, fontFamily: theme.fonts.sansSemiBold, fontSize: 15 },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  resultTxt:   { fontSize: 11, fontFamily: theme.fonts.sansSemiBold },
  houseNote:   { color: theme.colors.textSecondary, fontSize: 11, fontFamily: theme.fonts.sans, marginBottom: 6, marginTop: -4 },
});

// ── Sky Reading Summary Modal ─────────────────────────────────────────────────
function SkyReadingModal({
  planets, personalScore, onClose, onAddBirthDetails,
}: {
  planets: SkyPlanet[];
  personalScore: PersonalDayScore | null;
  onClose: () => void;
  onAddBirthDetails: () => void;
}) {
  const sorted = [...planets].sort((a, b) => {
    if (personalScore) {
      const sa = personalScore.planetScores[a.name]?.score ?? 5;
      const sb = personalScore.planetScores[b.name]?.score ?? 5;
      if (a.aboveHorizon !== b.aboveHorizon) return a.aboveHorizon ? -1 : 1;
      return sb - sa;
    }
    const pa = getTransitPrediction(a.name, a.siderealSign);
    const pb = getTransitPrediction(b.name, b.siderealSign);
    if (a.aboveHorizon !== b.aboveHorizon) return a.aboveHorizon ? -1 : 1;
    return pb.rating - pa.rating;
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={sky.overlay}>
        <LinearGradient colors={['#0D1829', '#080E1A']} style={sky.container}>
          <View style={sky.handle} />
          <View style={sky.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={sky.title}>
                {personalScore ? '✨ My Day Reading' : "✨ Today's Sky Reading"}
              </Text>
              {personalScore && (
                <Text style={sky.scoreLine}>
                  {'Score: '}
                  <Text style={{ color: personalScore.dayColor }}>
                    {personalScore.dayScore}/100 · {personalScore.dayLabel}
                  </Text>
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={sky.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          {personalScore && (
            <View style={sky.summaryBox}>
              <Text style={sky.summaryTxt}>{personalScore.summary}</Text>
            </View>
          )}

          {!personalScore && (
            <TouchableOpacity style={sky.addBtn} onPress={onAddBirthDetails}>
              <Text style={sky.addTxt}>🔒 Add birth details for personal reading →</Text>
            </TouchableOpacity>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {sorted.map(p => {
              const pred = getTransitPrediction(p.name, p.siderealSign);
              const ps   = personalScore?.planetScores?.[p.name];
              const accent = ps?.color ?? (p.color === '#FFFFFF' ? '#ccc' : p.color);
              return (
                <View key={p.name} style={sky.card}>
                  <View style={sky.cardHeader}>
                    <Text style={sky.cardEmoji}>{p.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={sky.cardName}>{p.jyotishName} in {p.siderealSign}</Text>
                      {ps ? (
                        <Text style={[sky.cardStars, { color: accent }]}>
                          {ps.result === 'good' ? '✓ Favourable' : ps.result === 'challenging' ? '⚠ Challenging' : '● Neutral'}
                          {` · H${ps.houseFromMoon} from Moon`}
                        </Text>
                      ) : (
                        <Text style={[sky.cardStars, { color: accent }]}>{ratingStars(pred.rating)}</Text>
                      )}
                    </View>
                    <View style={[sky.horizBadge, { backgroundColor: p.aboveHorizon ? '#2ECFB022' : '#ffffff11' }]}>
                      <Text style={[sky.horizTxt, { color: p.aboveHorizon ? theme.colors.teal : theme.colors.textSecondary }]}>
                        {p.aboveHorizon ? '▲ Visible' : '▼ Set'}
                      </Text>
                    </View>
                  </View>
                  {ps && (
                    <Text style={[sky.cardEffect, { color: accent, marginBottom: 4 }]}>{ps.insight}</Text>
                  )}
                  <Text style={sky.cardEffect}>{pred.effect}</Text>
                  {pred.keywords.length > 0 && (
                    <View style={sky.tagRow}>
                      {pred.keywords.map(k => (
                        <View key={k} style={[sky.tag, { borderColor: accent + '55' }]}>
                          <Text style={[sky.tagTxt, { color: accent }]}>{k}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const sky = StyleSheet.create({
  overlay:    { flex: 1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.5)' },
  container:  { height: SH * 0.88, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 0 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor:'rgba(255,255,255,0.2)', alignSelf:'center', marginBottom: 16 },
  titleRow:   { flexDirection:'row', alignItems:'flex-start', marginBottom: 12 },
  title:      { color: theme.colors.gold, fontSize: 20, fontFamily: theme.fonts.serifSemiBold },
  scoreLine:  { color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.fonts.sans, marginTop: 2 },
  closeX:     { color: theme.colors.textSecondary, fontSize: 20, padding: 4 },
  summaryBox: { backgroundColor:'rgba(201,150,58,0.1)', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth:1, borderColor: theme.colors.goldBd },
  summaryTxt: { color: theme.colors.w70, fontSize: 12, fontFamily: theme.fonts.sans, lineHeight: 18 },
  addBtn:     { backgroundColor:'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth:1, borderColor:'rgba(201,150,58,0.25)' },
  addTxt:     { color: theme.colors.gold, fontSize: 13, fontFamily: theme.fonts.sans },
  card:       { backgroundColor:'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor:'rgba(255,255,255,0.07)' },
  cardHeader: { flexDirection:'row', alignItems:'center', marginBottom: 8 },
  cardEmoji:  { fontSize: 24 },
  cardName:   { color: theme.colors.w90, fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
  cardStars:  { fontSize: 11, marginTop: 2 },
  horizBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  horizTxt:   { fontSize: 10, fontFamily: theme.fonts.sans },
  cardEffect: { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 20 },
  tagRow:     { flexDirection:'row', flexWrap:'wrap', gap: 6, marginTop: 8 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, borderWidth: 1, backgroundColor:'rgba(255,255,255,0.04)' },
  tagTxt:     { fontSize: 10, fontFamily: theme.fonts.sans },
});
function BelowHorizonBar({ planets, onPress }: { planets: SkyPlanet[]; onPress: (p: SkyPlanet) => void }) {
  const below = planets.filter(p => !p.aboveHorizon);
  if (below.length === 0) return null;
  return (
    <View style={belowStyles.bar} pointerEvents="box-none">
      <Text style={belowStyles.label}>Below horizon →</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {below.map(p => (
          <TouchableOpacity key={p.name} style={belowStyles.chip} onPress={() => onPress(p)}>
            <Text style={belowStyles.emoji}>{p.emoji}</Text>
            <Text style={[belowStyles.name, { color: p.color === '#FFFFFF' ? '#ddd' : p.color }]}>{p.jyotishName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const belowStyles = StyleSheet.create({
  bar:   { position:'absolute', bottom: 12, left: 12, right: 12, flexDirection:'row', alignItems:'center', backgroundColor:'rgba(8,14,26,0.75)', borderRadius: 16, padding: 10, borderWidth: 1, borderColor:'rgba(201,150,58,0.2)' },
  label: { color: theme.colors.textSecondary, fontSize: 10, fontFamily: theme.fonts.sans, marginRight: 8 },
  chip:  { alignItems:'center', marginRight: 12 },
  emoji: { fontSize: 18 },
  name:  { fontSize: 9, fontFamily: theme.fonts.sans, marginTop: 2 },
});

// ── Calibration Toast ─────────────────────────────────────────────────────────
function CalibrationHint() {
  return (
    <View style={calStyles.wrap} pointerEvents="none">
      <Text style={calStyles.txt}>🧭 Point at the sky & tilt up</Text>
    </View>
  );
}
const calStyles = StyleSheet.create({
  wrap: { position:'absolute', top:'42%', left:0, right:0, alignItems:'center' },
  txt:  { color:'rgba(255,255,255,0.7)', fontSize:15, fontFamily: theme.fonts.sans, backgroundColor:'rgba(8,14,26,0.6)', paddingHorizontal:20, paddingVertical:10, borderRadius:20 },
});

// ── Permission Screen ─────────────────────────────────────────────────────────
function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={[perm.root, { paddingTop: insets.top + 16 }]}>
      <Text style={perm.icon}>🔭</Text>
      <Text style={perm.title}>AR Sky Guide</Text>
      <Text style={perm.body}>
        Point your phone at the sky to see real-time Vedic planet positions with Jyotish insights.{'\n\n'}
        Camera, location and motion sensor access is required.
      </Text>
      <TouchableOpacity style={perm.btn} onPress={onRequest}>
        <LinearGradient colors={[theme.colors.gold, '#D4A843']} style={perm.btnGrad}>
          <Text style={perm.btnTxt}>Grant Permissions</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const perm = StyleSheet.create({
  root:   { flex:1, alignItems:'center', justifyContent:'center', padding: 32 },
  icon:   { fontSize: 64, marginBottom: 24 },
  title:  { color: theme.colors.gold, fontSize: 30, fontFamily: theme.fonts.serifSemiBold, marginBottom: 16, textAlign:'center' },
  body:   { color: theme.colors.w70, fontSize: 15, fontFamily: theme.fonts.sans, lineHeight: 24, textAlign:'center', marginBottom: 36 },
  btn:    { width:'100%', borderRadius: theme.radius.pill, overflow:'hidden' },
  btnGrad:{ paddingVertical: 15, alignItems:'center' },
  btnTxt: { color: theme.colors.navy, fontFamily: theme.fonts.sansSemiBold, fontSize: 16 },
});

// ── Inline Birth Entry Sheet ──────────────────────────────────────────────────
interface BirthEntrySheetProps {
  onSave: (dob: string, tob: string, place: string) => void;
  onSkip: () => void;
}

function BirthEntrySheet({ onSave, onSkip }: BirthEntrySheetProps) {
  const [dobDay,       setDobDay]     = useState('');
  const [dobMonth,     setDobMonth]   = useState(''); 
  const [dobYear,      setDobYear]    = useState('');
  const [tobHour,      setTobHour]    = useState('');
  const [tobMin,       setTobMin]     = useState('');
  const [place,        setPlace]      = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const monthRef  = useRef<any>(null);
  const yearRef   = useRef<any>(null);
  const tobMinRef = useRef<any>(null);

  const isValid = dobDay.length > 0 && dobMonth.length > 0 && dobYear.length === 4;

  const dob = isValid
    ? `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
    : '';

  const tob = tobHour.length > 0
    ? `${tobHour.padStart(2, '0')}:${(tobMin || '00').padStart(2, '0')}`
    : '';

  const calendarDate = (() => {
    if (isValid) {
      const d = new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay));
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(1990, 0, 1);
  })();

  const onCalendarChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowCalendar(false);
    if (selected) {
      setDobDay(String(selected.getDate()));
      setDobMonth(String(selected.getMonth() + 1));
      setDobYear(String(selected.getFullYear()));
    }
  };

  return (
    <View style={bsheet.overlay}>
      <LinearGradient colors={['#111E33', '#0D1829']} style={bsheet.container}>
        <View style={bsheet.handle} />
        <Text style={bsheet.title}>🔭 Personalise Your Sky</Text>
        <Text style={bsheet.subtitle}>
          Enter your birth details to see how today’s planets affect YOU personally.
        </Text>

        {/* ── Date of Birth ─── */}
        <Text style={bsheet.fieldLabel}>Date of Birth</Text>
        <View style={bsheet.dateRow}>
          <TextInput
            style={[bsheet.dateInput, { flex: 1 }]}
            placeholder="DD"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
            value={dobDay}
            returnKeyType="next"
            onChangeText={v => {
              const n = v.replace(/\D/g, '');
              setDobDay(n);
              if (n.length === 2) monthRef.current?.focus();
            }}
          />
          <Text style={bsheet.dateSep}>/</Text>
          <TextInput
            ref={monthRef}
            style={[bsheet.dateInput, { flex: 1 }]}
            placeholder="MM"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
            value={dobMonth}
            returnKeyType="next"
            onChangeText={v => {
              const n = v.replace(/\D/g, '');
              setDobMonth(n);
              if (n.length === 2) yearRef.current?.focus();
            }}
          />
          <Text style={bsheet.dateSep}>/</Text>
          <TextInput
            ref={yearRef}
            style={[bsheet.dateInput, { flex: 2 }]}
            placeholder="YYYY"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={4}
            value={dobYear}
            onChangeText={v => setDobYear(v.replace(/\D/g, ''))}
          />
          <TouchableOpacity style={bsheet.calBtn} onPress={() => setShowCalendar(true)}>
            <Text style={bsheet.calIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* ── Time of Birth ─── */}
        <Text style={[bsheet.fieldLabel, { marginTop: 16 }]}>Time of Birth</Text>
        <View style={bsheet.dateRow}>
          <TextInput
            style={[bsheet.dateInput, { flex: 1 }]}
            placeholder="HH"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
            value={tobHour}
            returnKeyType="next"
            onChangeText={v => {
              const n = v.replace(/\D/g, '');
              setTobHour(n);
              if (n.length === 2) tobMinRef.current?.focus();
            }}
          />
          <Text style={bsheet.dateSep}>:</Text>
          <TextInput
            ref={tobMinRef}
            style={[bsheet.dateInput, { flex: 1 }]}
            placeholder="MM"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={2}
            value={tobMin}
            onChangeText={v => setTobMin(v.replace(/\D/g, ''))}
          />
          <Text style={bsheet.ampmHint}>24h</Text>
        </View>

        {/* ── Place of Birth ─── */}
        <View style={{ marginTop: 4 }}>
          <PlaceInput
            label="Place of Birth"
            value={place}
            onChangeText={setPlace}
            placeholder="City, Country"
          />
        </View>

        <TouchableOpacity
          style={[bsheet.btn, { opacity: isValid ? 1 : 0.45 }]}
          disabled={!isValid}
          onPress={() => onSave(dob, tob, place)}
        >
          <LinearGradient colors={[theme.colors.gold, '#D4A843']} style={bsheet.btnGrad}>
            <Text style={bsheet.btnTxt}>Read My Personal Sky ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={bsheet.skipBtn} onPress={onSkip}>
          <Text style={bsheet.skipTxt}>Skip — use general reading</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Calendar picker — rendered in its own full-screen Modal to avoid clipping */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={bsheet.calOverlay}>
          <View style={bsheet.calCard}>
            <Text style={bsheet.calTitle}>Select Date of Birth</Text>
            <DateTimePicker
              value={calendarDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={onCalendarChange}
              style={{ width: '100%' }}
            />
            <TouchableOpacity
              style={bsheet.calDoneBtn}
              onPress={() => {
                onCalendarChange({ type: 'dismissed' } as any, calendarDate);
              }}
            >
              <Text style={bsheet.calDoneTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const bsheet = StyleSheet.create({
  overlay:     { position:'absolute', bottom:0, left:0, right:0 },
  container:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor:'rgba(255,255,255,0.2)', alignSelf:'center', marginBottom: 20 },
  title:       { color: theme.colors.gold, fontFamily: theme.fonts.serifSemiBold, fontSize: 22, marginBottom: 8 },
  subtitle:    { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  fieldLabel:  { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 11, textTransform:'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  dateRow:     { flexDirection:'row', alignItems:'center' },
  dateInput:   { backgroundColor:'rgba(255,255,255,0.07)', borderWidth:1, borderColor: theme.colors.goldBd, borderRadius:10, paddingHorizontal:12, paddingVertical:12, color:'#fff', fontFamily: theme.fonts.sans, fontSize:17, textAlign:'center' },
  dateSep:     { color: theme.colors.textSecondary, fontSize:18, marginHorizontal:6 },
  ampmHint:    { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize:11, marginLeft:8 },
  calBtn:      { marginLeft:10, padding:8, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:8, borderWidth:1, borderColor: theme.colors.goldBd },
  calIcon:     { fontSize:20 },
  btn:         { borderRadius: theme.radius.pill, overflow:'hidden', marginTop: 20 },
  btnGrad:     { paddingVertical: 14, alignItems:'center' },
  btnTxt:      { color: theme.colors.navy, fontFamily: theme.fonts.sansSemiBold, fontSize: 15 },
  skipBtn:     { alignItems:'center', marginTop: 14 },
  skipTxt:     { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13 },
  // Calendar modal
  calOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', padding:24 },
  calCard:     { backgroundColor:'#111E33', borderRadius:20, padding:20, width:'100%', borderWidth:1, borderColor: theme.colors.goldBd, alignItems:'center' },
  calTitle:    { color: theme.colors.gold, fontFamily: theme.fonts.serifSemiBold, fontSize:17, marginBottom:12 },
  calDoneBtn:  { marginTop:16, backgroundColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingVertical:11, paddingHorizontal:40 },
  calDoneTxt:  { color: theme.colors.navy, fontFamily: theme.fonts.sansSemiBold, fontSize:15 },
});

// ── Day Score HUD ─────────────────────────────────────────────────────────────
function DayScoreHUD({ score, onPress }: { score: PersonalDayScore; onPress: () => void }) {
  return (
    <TouchableOpacity style={hud.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={[hud.circle, { borderColor: score.dayColor }]}>
        <Text style={[hud.num, { color: score.dayColor }]}>{score.dayScore}</Text>
        <Text style={hud.label}>/ 100</Text>
      </View>
      <Text style={[hud.dayLabel, { color: score.dayColor }]}>{score.dayLabel}</Text>
      <Text style={hud.moon}>🌙 {score.natalChart.moonSign}</Text>
    </TouchableOpacity>
  );
}

const hud = StyleSheet.create({
  wrap:     { position:'absolute', top: 120, right: 12, alignItems:'center', backgroundColor:'rgba(8,14,26,0.8)', borderRadius: 16, padding: 10, borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  circle:   { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems:'center', justifyContent:'center', marginBottom: 6 },
  num:      { fontFamily: theme.fonts.serifSemiBold, fontSize: 20 },
  label:    { color: theme.colors.textSecondary, fontSize: 8, fontFamily: theme.fonts.sans },
  dayLabel: { fontFamily: theme.fonts.sansSemiBold, fontSize: 10, textAlign:'center', maxWidth: 72 },
  moon:     { color: theme.colors.textSecondary, fontSize: 9, fontFamily: theme.fonts.sans, marginTop: 4 },
});

// ── Unlock Teaser Overlay ─────────────────────────────────────────────────────
function UnlockTeaser({ onEnter, onSkip }: { onEnter: () => void; onSkip: () => void }) {
  return (
    <View style={teaser.wrap} pointerEvents="box-none">
      <View style={teaser.card}>
        <Text style={teaser.icon}>🔒</Text>
        <Text style={teaser.title}>Your Sky is Personal</Text>
        <Text style={teaser.body}>
          Add your birth details to see how today's transits affect your life — career, love, health and more.
        </Text>
        <TouchableOpacity style={teaser.btn} onPress={onEnter}>
          <LinearGradient colors={[theme.colors.gold, '#D4A843']} style={teaser.btnGrad}>
            <Text style={teaser.btnTxt}>✨ Unlock Personal Reading</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip}>
          <Text style={teaser.skip}>Continue with general reading →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const teaser = StyleSheet.create({
  wrap:    { position:'absolute', bottom: 100, left: 16, right: 16, alignItems:'center' },
  card:    { backgroundColor:'rgba(8,14,26,0.92)', borderRadius: 20, padding: 24, borderWidth:1, borderColor: theme.colors.goldBd, alignItems:'center', width:'100%' },
  icon:    { fontSize: 36, marginBottom: 10 },
  title:   { color: theme.colors.gold, fontFamily: theme.fonts.serifSemiBold, fontSize: 20, marginBottom: 8 },
  body:    { color: theme.colors.w70, fontFamily: theme.fonts.sans, fontSize: 13, textAlign:'center', lineHeight: 20, marginBottom: 18 },
  btn:     { width:'100%', borderRadius: theme.radius.pill, overflow:'hidden', marginBottom: 12 },
  btnGrad: { paddingVertical: 13, alignItems:'center' },
  btnTxt:  { color: theme.colors.navy, fontFamily: theme.fonts.sansSemiBold, fontSize: 15 },
  skip:    { color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 12 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export const ARSkyGuideScreen: React.FC = () => {
  const navigation     = useNavigation();
  const insets         = useSafeAreaInsets();
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [selected, setSelected]   = useState<SkyPlanet | null>(null);
  const [showSkyReading, setShowSkyReading] = useState(false);

  // Profile data for personalisation
  const { profile } = useProfileStore();
  const [tempDob, setTempDob] = useState<string | undefined>(undefined);
  const [tempTob, setTempTob] = useState<string | undefined>(undefined);
  const [tempPlace, setTempPlace] = useState<string | undefined>(undefined);
  const [showBirthEntry, setShowBirthEntry] = useState(false);
  const [skippedPersonal, setSkippedPersonal] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  // Resolve birth data: profile first, then temp entry
  const dob = profile?.date_of_birth ?? tempDob;
  const tob = profile?.time_of_birth ?? tempTob;
  const hasPersonal = !!dob;

  const { planets, locationGranted, heading, pitch, error } = useSkyPlanets({
    screenWidth:  SW,
    screenHeight: SH,
  });

  const personalScore = usePersonalDayScore(planets, dob, tob);

  // Show teaser once planets are loaded and no birth data
  const teaserShown = useRef(false);
  React.useEffect(() => {
    if (!teaserShown.current && planets.length > 0 && !hasPersonal && !skippedPersonal) {
      teaserShown.current = true;
      // Small delay so camera loads first
      const t = setTimeout(() => setShowTeaser(true), 2000);
      return () => clearTimeout(t);
    }
  }, [planets.length, hasPersonal, skippedPersonal]);

  const camGranted = camPerm?.granted ?? false;
  const ready      = camGranted && locationGranted;

  const handleRequest = useCallback(async () => {
    await requestCamPerm();
  }, [requestCamPerm]);

  const handleBirthSave = useCallback((d: string, t: string, p: string) => {
    setTempDob(d);
    setTempTob(t);
    setTempPlace(p);
    setShowBirthEntry(false);
    setShowTeaser(false);
  }, []);

  const visibleCount = planets.filter(p => p.inView && p.aboveHorizon).length;

  if (!ready) {
    return <PermissionScreen onRequest={handleRequest} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Full-screen Camera */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Planet dots — color from personal score if available */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {planets.map(p => (
          <PlanetDot
            key={p.name}
            planet={p}
            onPress={setSelected}
            personalColor={personalScore?.planetScores?.[p.name]?.color}
          />
        ))}
      </View>

      {/* Top HUD */}
      <View style={[styles.topHud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>AR Sky Guide</Text>
          <Text style={styles.subtitle}>
            {visibleCount > 0 ? `${visibleCount} planet${visibleCount > 1 ? 's' : ''} in view` : 'Scanning sky…'}
          </Text>
        </View>
        <CompassRose heading={heading} />
      </View>

      {/* Personal Day Score HUD */}
      {personalScore && (
        <DayScoreHUD score={personalScore} onPress={() => setShowSkyReading(true)} />
      )}

      {/* Horizon line — visible when device is within ~25° of the horizon */}
      {pitch > -25 && pitch < 30 && (
        <View style={[styles.horizonLine, { top: SH / 2 - (pitch / 22.5) * (SH / 2) }]} pointerEvents="none">
          <Text style={styles.horizonTxt}>— HORIZON —</Text>
        </View>
      )}

      {visibleCount === 0 && !error && <CalibrationHint />}

      {error && (
        <View style={styles.errorToast} pointerEvents="none">
          <Text style={styles.errorTxt}>⚠ {error}</Text>
        </View>
      )}

      {/* Below-horizon scrollbar */}
      {planets.some(p => !p.aboveHorizon) && !showTeaser && !showBirthEntry && (
        <BelowHorizonBar planets={planets} onPress={setSelected} />
      )}

      {/* Sky Reading FAB */}
      {planets.length > 0 && !showTeaser && !showBirthEntry && (
        <TouchableOpacity
          style={[styles.skyReadingBtn, { bottom: planets.some(p => !p.aboveHorizon) ? 110 : 20 }]}
          onPress={() => setShowSkyReading(true)}
        >
          <LinearGradient colors={[theme.colors.gold, '#D4A843']} style={styles.skyReadingGrad}>
            <Text style={styles.skyReadingTxt}>
              {hasPersonal ? '✨ My Day Reading' : '✨ Sky Reading'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Unlock teaser (first time, no profile) */}
      {showTeaser && !showBirthEntry && (
        <UnlockTeaser
          onEnter={() => { setShowTeaser(false); setShowBirthEntry(true); }}
          onSkip={() => { setShowTeaser(false); setSkippedPersonal(true); }}
        />
      )}

      {/* Inline birth entry */}
      {showBirthEntry && (
        <BirthEntrySheet
          onSave={handleBirthSave}
          onSkip={() => { setShowBirthEntry(false); setSkippedPersonal(true); }}
        />
      )}

      {/* Sky Reading Summary */}
      {showSkyReading && (
        <SkyReadingModal
          planets={planets}
          personalScore={personalScore}
          onClose={() => setShowSkyReading(false)}
          onAddBirthDetails={() => { setShowSkyReading(false); setShowBirthEntry(true); }}
        />
      )}

      {/* Planet detail sheet */}
      <PlanetSheet planet={selected} onClose={() => setSelected(null)} personalScore={personalScore} />
    </View>
  );
};

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#000' },
  topHud:         { position:'absolute', top:0, left:0, right:0, paddingHorizontal: 16, paddingBottom: 12, flexDirection:'row', alignItems:'flex-start' },
  backBtn:        { backgroundColor:'rgba(8,14,26,0.7)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth:1, borderColor:'rgba(201,150,58,0.3)', marginTop: 4 },
  backTxt:        { color: theme.colors.gold, fontFamily: theme.fonts.sans, fontSize: 13 },
  titleWrap:      { flex: 1, alignItems:'center', marginTop: 4 },
  title:          { color: theme.colors.gold, fontFamily: theme.fonts.serifSemiBold, fontSize: 20 },
  subtitle:       { color: 'rgba(255,255,255,0.6)', fontFamily: theme.fonts.sans, fontSize: 12, marginTop: 2 },
  horizonLine:    { position:'absolute', left:0, right:0, alignItems:'center' },
  horizonTxt:     { color:'rgba(46,207,176,0.5)', fontSize: 11, fontFamily: theme.fonts.sans, letterSpacing: 3 },
  errorToast:     { position:'absolute', top:'50%', left:32, right:32, backgroundColor:'rgba(244,67,54,0.15)', borderRadius:12, borderWidth:1, borderColor:'rgba(244,67,54,0.4)', padding:14, alignItems:'center' },
  errorTxt:       { color:'#f44336', fontFamily: theme.fonts.sans, fontSize: 13, textAlign:'center' },
  skyReadingBtn:  { position:'absolute', alignSelf:'center', left: SW / 2 - 80, borderRadius: theme.radius.pill, overflow:'hidden' },
  skyReadingGrad: { paddingHorizontal: 24, paddingVertical: 11 },
  skyReadingTxt:  { color: theme.colors.navy, fontFamily: theme.fonts.sansSemiBold, fontSize: 14 },
});
