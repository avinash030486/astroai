/**
 * usePersonalDayScore.ts
 *
 * Compares current sky transit positions to the user's natal chart
 * and produces a personal day score using classical Vedic transit rules
 * (Gochar — transit from natal Moon sign).
 *
 * Works purely offline — no API needed — using the same VSOP87
 * ephemeris engine from useSkyPlanets.
 */

import { useMemo } from 'react';
import { SkyPlanet } from './useSkyPlanets';

// ── Shared ephemeris helpers (duplicated here to keep hook self-contained) ────
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function toJulianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function ayanamsha(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 0.0136 * T;
}

function eclipticToSidereal(lon: number, jd: number): number {
  return ((lon - ayanamsha(jd)) % 360 + 360) % 360;
}

function signIndexFromLon(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30) % 12;
}

interface OrbElems { L0:number; L1:number; e0:number; e1:number; w:number }

const NATAL_ELEMS: Record<string, OrbElems> = {
  Sun:     { L0:280.459, L1:36000.770,  e0:0.01671,  e1:-0.0000418, w:282.938 },
  Moon:    { L0:218.316, L1:481267.881, e0:0.0549,   e1:0,          w:318.015 },
  Mars:    { L0:355.433, L1:19140.296,  e0:0.09341,  e1:0.000090,   w:286.502 },
  Mercury: { L0:252.251, L1:149472.675, e0:0.20563,  e1:-0.000021,  w:77.456  },
  Jupiter: { L0:34.396,  L1:3034.746,   e0:0.04839,  e1:-0.000162,  w:14.728  },
  Venus:   { L0:181.979, L1:58517.816,  e0:0.00677,  e1:-0.000048,  w:131.533 },
  Saturn:  { L0:50.078,  L1:1222.114,   e0:0.05415,  e1:-0.000287,  w:92.861  },
};

function computeNatalLongitude(name: string, T: number): number {
  if (name === 'Rahu') return (((125.045 - 1934.136 * T) % 360) + 360) % 360;
  if (name === 'Ketu') return (((305.045 - 1934.136 * T) % 360) + 360) % 360;
  const p  = NATAL_ELEMS[name];
  const L  = ((p.L0 + p.L1 * T) % 360 + 360) % 360;
  const e  = p.e0 + p.e1 * T;
  const M  = ((L - p.w) % 360 + 360) % 360;
  const Mr = M * DEG;
  const C  = (2 * e - e * e * e / 4) * Math.sin(Mr)
           + (5 / 4) * e * e * Math.sin(2 * Mr)
           + (13 / 12) * e * e * e * Math.sin(3 * Mr);
  return ((L + C * RAD) % 360 + 360) % 360;
}

// ── Classical Vedic Gochar transit rules from natal Moon ─────────────────────
// house = 1-indexed position of transit planet from natal Moon sign
// Returns: 'good' | 'neutral' | 'challenging'
const GOCHAR_RULES: Record<string, Record<number, 'good' | 'neutral' | 'challenging'>> = {
  Sun:     { 1:'neutral',2:'challenging',3:'good',4:'neutral',5:'neutral',6:'good',7:'neutral',8:'challenging',9:'neutral',10:'good',11:'good',12:'challenging' },
  Moon:    { 1:'challenging',2:'challenging',3:'good',4:'challenging',5:'good',6:'good',7:'challenging',8:'challenging',9:'good',10:'good',11:'good',12:'challenging' },
  Mars:    { 1:'neutral',2:'challenging',3:'good',4:'challenging',5:'challenging',6:'good',7:'challenging',8:'challenging',9:'neutral',10:'neutral',11:'good',12:'challenging' },
  Mercury: { 1:'neutral',2:'good',3:'neutral',4:'good',5:'neutral',6:'good',7:'neutral',8:'good',9:'neutral',10:'good',11:'good',12:'neutral' },
  Jupiter: { 1:'neutral',2:'good',3:'challenging',4:'challenging',5:'good',6:'challenging',7:'good',8:'challenging',9:'good',10:'challenging',11:'good',12:'challenging' },
  Venus:   { 1:'good',2:'good',3:'good',4:'good',5:'good',6:'neutral',7:'neutral',8:'good',9:'good',10:'neutral',11:'good',12:'good' },
  Saturn:  { 1:'challenging',2:'challenging',3:'good',4:'challenging',5:'challenging',6:'good',7:'challenging',8:'challenging',9:'neutral',10:'challenging',11:'good',12:'challenging' },
  Rahu:    { 1:'challenging',2:'challenging',3:'good',4:'neutral',5:'challenging',6:'good',7:'challenging',8:'challenging',9:'neutral',10:'neutral',11:'good',12:'neutral' },
  Ketu:    { 1:'neutral',2:'neutral',3:'good',4:'neutral',5:'challenging',6:'good',7:'neutral',8:'challenging',9:'good',10:'neutral',11:'good',12:'neutral' },
};

// ── Insight templates per planet + result ─────────────────────────────────────
const INSIGHTS: Record<string, Record<'good'|'neutral'|'challenging', string>> = {
  Sun:     { good: 'Surya brightens your path — authority and vitality flow your way today.', neutral: 'Surya\'s energy is moderate — maintain steady effort.', challenging: 'Surya creates friction — avoid ego conflicts and power struggles.' },
  Moon:    { good: 'Chandra supports emotional harmony — your mind is calm and intuitive.', neutral: 'Chandra brings mixed emotions — stay grounded.', challenging: 'Chandra disturbs the mind — rest, avoid major decisions.' },
  Mars:    { good: 'Mangal energises you — excellent for bold actions and physical effort.', neutral: 'Mangal\'s energy is contained — channel it productively.', challenging: 'Mangal creates agitation — avoid arguments and rash decisions.' },
  Mercury: { good: 'Budha sharpens your intellect — communication, deals and learning excel.', neutral: 'Budha is moderate — routine tasks flow well.', challenging: 'Budha causes confusion — double-check communications and documents.' },
  Jupiter: { good: 'Guru blesses you with wisdom and luck — an auspicious day to expand.', neutral: 'Guru\'s grace is steady — trust the process.', challenging: 'Guru\'s wisdom is blocked — be patient; avoid overconfidence.' },
  Venus:   { good: 'Shukra brings love, beauty and comfort — relationships and creativity shine.', neutral: 'Shukra is calm — enjoy simple pleasures.', challenging: 'Shukra creates disharmony — avoid indulgence or relationship conflicts.' },
  Saturn:  { good: 'Shani rewards discipline — hard work brings lasting results today.', neutral: 'Shani is watchful — maintain your duties steadily.', challenging: 'Shani brings delays and restrictions — practice patience and acceptance.' },
  Rahu:    { good: 'Rahu opens unconventional opportunities — seize unexpected chances.', neutral: 'Rahu\'s influence is subtle — stay discerning.', challenging: 'Rahu creates confusion and illusion — verify facts before acting.' },
  Ketu:    { good: 'Ketu brings spiritual clarity and intuitive insight — meditate and reflect.', neutral: 'Ketu is detached — focus on inner work.', challenging: 'Ketu causes disorientation — ground yourself and avoid impulsive changes.' },
};

// ── Score map ────────────────────────────────────────────────────────────────
const SCORE_MAP: Record<'good'|'neutral'|'challenging', number> = {
  good: 10, neutral: 5, challenging: 1
};

const COLOR_MAP: Record<'good'|'neutral'|'challenging', string> = {
  good: '#2ECFB0', neutral: '#FFD700', challenging: '#FF4500'
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface NatalChart {
  moonSignIndex: number;
  moonSign: string;
  sunSign: string;
  planetSigns: Record<string, string>;
}

export interface PlanetPersonalScore {
  result: 'good' | 'neutral' | 'challenging';
  houseFromMoon: number;
  color: string;
  insight: string;
  score: number;
}

export interface PersonalDayScore {
  dayScore: number;         // 0–100
  dayLabel: string;
  dayColor: string;
  natalChart: NatalChart;
  planetScores: Record<string, PlanetPersonalScore>;
  topInsights: string[];    // 3 best/worst insights to surface
  summary: string;
}

// ── Birth date/time parser ────────────────────────────────────────────────────
function parseBirthDate(dateStr: string, timeStr?: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr ? timeStr.split(':').map(Number) : [6, 0];
  return new Date(y, m - 1, d, isNaN(h) ? 6 : h, isNaN(min) ? 0 : min, 0);
}

// ── Compute natal chart from birth data ──────────────────────────────────────
export function computeNatalChart(dateOfBirth: string, timeOfBirth?: string): NatalChart {
  const birth = parseBirthDate(dateOfBirth, timeOfBirth);
  const jd    = toJulianDate(birth);
  const T     = (jd - 2451545.0) / 36525;

  const planetSigns: Record<string, string> = {};
  const planetKeys = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

  for (const name of planetKeys) {
    const lon      = computeNatalLongitude(name, T);
    const sidereal = eclipticToSidereal(lon, jd);
    planetSigns[name] = SIGNS[signIndexFromLon(sidereal)];
  }

  const moonSignIndex = SIGNS.indexOf(planetSigns['Moon']);

  return {
    moonSignIndex,
    moonSign: planetSigns['Moon'],
    sunSign:  planetSigns['Sun'],
    planetSigns,
  };
}

// ── Day label from score ──────────────────────────────────────────────────────
function dayLabel(score: number): string {
  if (score >= 80) return 'Excellent Day ✨';
  if (score >= 65) return 'Good Day 🌟';
  if (score >= 50) return 'Balanced Day ⚖️';
  if (score >= 35) return 'Challenging Day ⚠️';
  return 'Difficult Day 🌑';
}

function dayColor(score: number): string {
  if (score >= 80) return '#FFD700';
  if (score >= 65) return '#2ECFB0';
  if (score >= 50) return '#4A90D9';
  if (score >= 35) return '#FFA500';
  return '#FF4500';
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function usePersonalDayScore(
  transitPlanets: SkyPlanet[],
  dateOfBirth: string | undefined,
  timeOfBirth: string | undefined,
): PersonalDayScore | null {

  return useMemo(() => {
    if (!dateOfBirth || transitPlanets.length === 0) return null;

    try {
      const natal = computeNatalChart(dateOfBirth, timeOfBirth);
      const moonIdx = natal.moonSignIndex;
      const planetScores: Record<string, PlanetPersonalScore> = {};

      let totalScore = 0;
      let count = 0;

      for (const tp of transitPlanets) {
        const transitSignIdx = SIGNS.indexOf(tp.siderealSign);
        if (transitSignIdx < 0) continue;

        // House = 1-indexed distance from natal Moon
        const house = ((transitSignIdx - moonIdx + 12) % 12) + 1;
        const rules = GOCHAR_RULES[tp.name];
        if (!rules) continue;

        const result = rules[house] ?? 'neutral';
        const score  = SCORE_MAP[result];
        const color  = COLOR_MAP[result];
        const insight = INSIGHTS[tp.name]?.[result] ?? '';

        planetScores[tp.name] = { result, houseFromMoon: house, color, insight, score };
        totalScore += score;
        count++;
      }

      const avg = count > 0 ? (totalScore / count / 10) * 100 : 50;
      const clamped = Math.round(Math.max(0, Math.min(100, avg)));

      // Top insights: pick 2 good and 1 challenging planet
      const sorted = Object.entries(planetScores).sort((a, b) => b[1].score - a[1].score);
      const topInsights = [
        ...sorted.filter(([,v]) => v.result === 'good').slice(0, 2).map(([,v]) => v.insight),
        ...sorted.filter(([,v]) => v.result === 'challenging').slice(0, 1).map(([,v]) => v.insight),
      ].filter(Boolean);

      // Summary line
      const goodCount  = Object.values(planetScores).filter(v => v.result === 'good').length;
      const badCount   = Object.values(planetScores).filter(v => v.result === 'challenging').length;
      const summary = `${goodCount} planet${goodCount !== 1 ? 's' : ''} support you today · ${badCount} need${badCount === 1 ? 's' : ''} care · Transit from ${natal.moonSign} Moon`;

      return {
        dayScore: clamped,
        dayLabel: dayLabel(clamped),
        dayColor: dayColor(clamped),
        natalChart: natal,
        planetScores,
        topInsights,
        summary,
      };
    } catch {
      return null;
    }
  }, [transitPlanets, dateOfBirth, timeOfBirth]);
}
