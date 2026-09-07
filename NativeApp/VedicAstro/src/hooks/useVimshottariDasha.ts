/**
 * useVimshottariDasha.ts
 *
 * Computes the Vimshottari Dasha (120-year planetary period) timeline
 * from a birth date using the Moon's sidereal nakshatra position.
 *
 * Classic rules:
 *  — 27 Nakshatras, each ruled by one of 9 planets
 *  — Starting dasha = lord of Moon's natal nakshatra
 *  — Position within nakshatra determines elapsed portion of first dasha
 *  — Order: Ketu → Venus → Sun → Moon → Mars → Rahu → Jupiter → Saturn → Mercury
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ── Nakshatra lords (0-26) ───────────────────────────────────────────────────
const NAKSHATRA_LORDS: string[] = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 0-8
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 9-17
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury', // 18-26
];

const NAKSHATRA_NAMES: string[] = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

// ── Dasha order & durations ──────────────────────────────────────────────────
export const DASHA_ORDER = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
];
export const DASHA_YEARS: Record<string, number> = {
  Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17,
};

// ── Visual themes per planet ─────────────────────────────────────────────────
export const DASHA_THEMES: Record<string, {
  color: string; bgA: string; bgB: string;
  emoji: string; theme: string; lesson: string;
}> = {
  Ketu:    { color:'#AAAAAA', bgA:'#1a1a2e', bgB:'#0d0d1a', emoji:'💫', theme:'Detachment & Spiritual Liberation',  lesson:'Release attachments; seek moksha' },
  Venus:   { color:'#FF85C2', bgA:'#2d1020', bgB:'#1a0812', emoji:'✨', theme:'Love, Beauty & Material Pleasures',  lesson:'Embrace harmony and creative flow' },
  Sun:     { color:'#FFD700', bgA:'#2e1800', bgB:'#1a0e00', emoji:'☀️', theme:'Soul, Authority & Vitality',         lesson:'Step into your power with integrity' },
  Moon:    { color:'#D0D8E8', bgA:'#0a1520', bgB:'#060d14', emoji:'🌙', theme:'Mind, Emotions & Mother',            lesson:'Flow with feelings; nurture others' },
  Mars:    { color:'#FF5533', bgA:'#2e0800', bgB:'#1a0500', emoji:'🔴', theme:'Courage, Energy & Action',           lesson:'Channel ambition with discipline' },
  Rahu:    { color:'#A080D0', bgA:'#0f0020', bgB:'#080012', emoji:'🌑', theme:'Illusion, Obsession & Foreign Karma', lesson:'See through maya; face your shadows' },
  Jupiter: { color:'#FFA500', bgA:'#1e1200', bgB:'#120b00', emoji:'🟡', theme:'Wisdom, Expansion & Divine Grace',   lesson:'Trust the universe; be generous' },
  Saturn:  { color:'#9980CC', bgA:'#1a0a2e', bgB:'#0e061a', emoji:'🪐', theme:'Discipline, Karma & Longevity',      lesson:'Embrace patience; earn your gifts' },
  Mercury: { color:'#80FF80', bgA:'#0a2010', bgB:'#06120a', emoji:'🟢', theme:'Intellect, Communication & Trade',   lesson:'Sharpen your mind; speak your truth' },
};

// ── Moon sidereal longitude (simplified VSOP87 Moon, same as useSkyPlanets) ──
function toJD(date: Date): number { return date.getTime() / 86400000 + 2440587.5; }
function ayanamsha(jd: number): number { return 23.85 + 0.0136 * (jd - 2451545) / 36525; }

function moonSiderealLon(dob: string): number {
  const [y, m, d] = dob.split('-').map(Number);
  const jd = toJD(new Date(y, m - 1, d, 12)); // noon of birth date
  const T  = (jd - 2451545) / 36525;
  const L  = ((218.316 + 481267.881 * T) % 360 + 360) % 360;
  const e  = 0.0549;
  const M  = ((L - 318.015) % 360 + 360) % 360;
  const Mr = M * DEG;
  const C  = (2 * e - e ** 3 / 4) * Math.sin(Mr) + (5 / 4) * e * e * Math.sin(2 * Mr);
  const tropLon = ((L + C * RAD) % 360 + 360) % 360;
  return ((tropLon - ayanamsha(jd)) % 360 + 360) % 360;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface DashaPeriod {
  planet:    string;
  startDate: Date;
  endDate:   Date;
  years:     number;
  isCurrent: boolean;
  isPast:    boolean;
  nakshatra?: string;   // only on the first period
}

export interface VimshottariResult {
  periods:       DashaPeriod[];
  moonSign:      string;
  janmaNakshatra: string;
  currentDasha:  DashaPeriod | null;
}

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

// ── Main computation ─────────────────────────────────────────────────────────
export function computeVimshottariDasha(dob: string): VimshottariResult {
  const moonLon  = moonSiderealLon(dob);
  const nakIdx   = Math.floor(moonLon / (360 / 27)) % 27;
  const posInNak = (moonLon % (360 / 27)) / (360 / 27); // 0–1 fraction through nakshatra

  const lord     = NAKSHATRA_LORDS[nakIdx];
  const lordIdx  = DASHA_ORDER.indexOf(lord);
  const elapsed  = posInNak * DASHA_YEARS[lord]; // years elapsed in first dasha at birth

  const [y, m, d]    = dob.split('-').map(Number);
  const birth        = new Date(y, m - 1, d);
  const MS_PER_YEAR  = 365.25 * 24 * 3600 * 1000;
  const now          = new Date();
  const moonSign     = SIGNS[Math.floor(moonLon / 30) % 12];
  const janmaNakshatra = NAKSHATRA_NAMES[nakIdx];

  // First dasha started before birth
  let cursor = new Date(birth.getTime() - elapsed * MS_PER_YEAR);

  const periods: DashaPeriod[] = [];

  for (let i = 0; i <= 11; i++) {
    const planet = DASHA_ORDER[(lordIdx + i) % 9];
    const yrs    = DASHA_YEARS[planet];
    const start  = new Date(cursor);
    const end    = new Date(cursor.getTime() + yrs * MS_PER_YEAR);
    periods.push({
      planet,
      startDate: start,
      endDate:   end,
      years:     yrs,
      isCurrent: now >= start && now < end,
      isPast:    now >= end,
      nakshatra: i === 0 ? janmaNakshatra : undefined,
    });
    cursor = end;
  }

  return {
    periods,
    moonSign,
    janmaNakshatra,
    currentDasha: periods.find(p => p.isCurrent) ?? null,
  };
}

// React hook wrapper
import { useMemo } from 'react';
export function useVimshottariDasha(dob: string | undefined): VimshottariResult | null {
  return useMemo(() => {
    if (!dob) return null;
    try { return computeVimshottariDasha(dob); } catch { return null; }
  }, [dob]);
}
