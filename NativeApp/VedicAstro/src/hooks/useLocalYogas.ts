/**
 * useLocalYogas.ts
 *
 * Detects classical Vedic yogas purely from natal planet sign positions.
 * No API call needed — works fully offline using the same ephemeris
 * engine as usePersonalDayScore.
 *
 * Yogas covered:
 *  Beneficial : Gajakesari, Budha-Aditya, Hamsa, Malavya, Ruchaka, Bhadra, Sasha
 *  Malefic    : Kemadruma, Vish, Angarak, Shrapit, Guru Chandal, Grahan (Solar & Lunar)
 */

import { useMemo } from 'react';
import { computeNatalChart } from './usePersonalDayScore';

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

// Own signs per planet
const OWN_SIGNS: Record<string, string[]> = {
  Sun:     ['Leo'],
  Moon:    ['Cancer'],
  Mars:    ['Aries', 'Scorpio'],
  Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'],
  Venus:   ['Taurus', 'Libra'],
  Saturn:  ['Capricorn', 'Aquarius'],
};

// Exaltation sign per planet
const EXALTATION: Record<string, string> = {
  Sun:     'Aries',
  Moon:    'Taurus',
  Mars:    'Capricorn',
  Mercury: 'Virgo',
  Jupiter: 'Cancer',
  Venus:   'Pisces',
  Saturn:  'Libra',
};

export interface LocalYoga {
  name: string;
  category: 'beneficial' | 'malefic';
  description: string;
  /** high = verifiable purely from signs; medium = kendra check needs ascendant */
  confidence: 'high' | 'medium';
}

/** 1-indexed sign distance (house number) from `from` sign to `to` sign */
function signDist(from: string, to: string): number {
  const a = SIGNS.indexOf(from);
  const b = SIGNS.indexOf(to);
  if (a < 0 || b < 0) return -1;
  return ((b - a + 12) % 12) + 1;
}

export function detectLocalYogas(dateOfBirth: string, timeOfBirth?: string): LocalYoga[] {
  const natal = computeNatalChart(dateOfBirth, timeOfBirth);
  const ps    = natal.planetSigns;
  const yogas: LocalYoga[] = [];

  // ── Pancha Mahapurusha Yogas ─────────────────────────────────────────────
  // Planet in own sign OR exaltation. Fully active only when also in a kendra
  // house from ascendant — we note that caveat since we don't have ascendant.
  const pmpy: [string, string][] = [
    ['Jupiter', 'Hamsa Yoga'],
    ['Venus',   'Malavya Yoga'],
    ['Mars',    'Ruchaka Yoga'],
    ['Mercury', 'Bhadra Yoga'],
    ['Saturn',  'Sasha Yoga'],
  ];
  for (const [planet, yoga] of pmpy) {
    const sign = ps[planet];
    const isExalted = EXALTATION[planet] === sign;
    const isOwn     = OWN_SIGNS[planet]?.includes(sign) ?? false;
    if (isExalted || isOwn) {
      yogas.push({
        name: yoga,
        category: 'beneficial',
        description:
          `${planet} is in ${sign} (${isExalted ? 'exalted' : 'own sign'}). ` +
          `${yoga} grants leadership, wisdom and mastery in its significations. ` +
          `It becomes fully potent when ${planet} also occupies a kendra house ` +
          `(1st, 4th, 7th or 10th) — confirm with exact birth place for house analysis.`,
        confidence: 'medium',
      });
    }
  }

  // ── Gajakesari Yoga ───────────────────────────────────────────────────────
  // Jupiter in kendra from Moon (1, 4, 7 or 10 signs away)
  const jupFromMoon = signDist(ps['Moon'], ps['Jupiter']);
  if ([1, 4, 7, 10].includes(jupFromMoon)) {
    yogas.push({
      name: 'Gajakesari Yoga',
      category: 'beneficial',
      description:
        `Jupiter (${ps['Jupiter']}) is in house ${jupFromMoon} from your Moon (${ps['Moon']}), ` +
        `forming a powerful kendra relationship. Gajakesari bestows intelligence, eloquence, ` +
        `prosperity and a distinguished reputation throughout life.`,
      confidence: 'high',
    });
  }

  // ── Budha-Aditya Yoga ─────────────────────────────────────────────────────
  // Sun and Mercury in the same sign
  if (ps['Sun'] === ps['Mercury']) {
    yogas.push({
      name: 'Budha-Aditya Yoga',
      category: 'beneficial',
      description:
        `Sun and Mercury are both in ${ps['Sun']}, uniting solar authority with Mercurial ` +
        `intellect. This yoga sharpens analytical thinking, communication and professional ` +
        `acumen — especially in fields requiring intellect and public presentation.`,
      confidence: 'high',
    });
  }

  // ── Kemadruma Yoga ────────────────────────────────────────────────────────
  // Moon has no planets in its own sign, 2nd sign or 12th sign; and no planets conjunct
  const moonIdx = SIGNS.indexOf(ps['Moon']);
  const prev    = SIGNS[(moonIdx + 11) % 12];
  const next    = SIGNS[(moonIdx + 1)  % 12];
  const classicPlanets = ['Sun','Mars','Mercury','Jupiter','Venus','Saturn'];
  const classicSigns   = classicPlanets.map(p => ps[p]);
  const moonIsAlone =
    !classicSigns.includes(prev) &&
    !classicSigns.includes(next) &&
    !classicPlanets.some(p => ps[p] === ps['Moon'] && p !== 'Moon');
  if (moonIsAlone) {
    yogas.push({
      name: 'Kemadruma Yoga',
      category: 'malefic',
      description:
        `Moon in ${ps['Moon']} has no classical planets in the adjacent signs or conjunct, ` +
        `creating emotional isolation and periodic financial fluctuations. ` +
        `Remedy: Worship Goddess Durga, fast on Mondays, chant Chandra mantra "Om Som Somaya Namah".`,
      confidence: 'high',
    });
  }

  // ── Vish Yoga ─────────────────────────────────────────────────────────────
  // Saturn and Moon in the same sign
  if (ps['Saturn'] === ps['Moon']) {
    yogas.push({
      name: 'Vish Yoga',
      category: 'malefic',
      description:
        `Saturn and Moon are conjunct in ${ps['Moon']}, mixing cold saturnine energy with ` +
        `the sensitive mind — causing emotional restriction and periodic melancholy. ` +
        `Remedy: Worship Shiva, chant "Om Namah Shivaya", offer milk to Shiva on Mondays.`,
      confidence: 'high',
    });
  }

  // ── Angarak Yoga ──────────────────────────────────────────────────────────
  // Mars and Rahu in the same sign
  if (ps['Mars'] === ps['Rahu']) {
    yogas.push({
      name: 'Angarak Yoga',
      category: 'malefic',
      description:
        `Mars and Rahu are conjunct in ${ps['Mars']}, amplifying impulsiveness, anger and ` +
        `accident-prone tendencies. Channel this intense energy into sports, surgery or ` +
        `competitive fields. Remedy: Chant Hanuman Chalisa daily, wear red coral after consultation.`,
      confidence: 'high',
    });
  }

  // ── Shrapit Yoga ──────────────────────────────────────────────────────────
  // Saturn and Rahu in the same sign
  if (ps['Saturn'] === ps['Rahu']) {
    yogas.push({
      name: 'Shrapit Yoga',
      category: 'malefic',
      description:
        `Saturn and Rahu are conjunct in ${ps['Saturn']}, indicating karmic burden from past ` +
        `lives — causing delays in relationships and career. ` +
        `Remedy: Perform Pitru Tarpan on Amavasya, worship Lord Shiva, chant "Om Namah Shivaya".`,
      confidence: 'high',
    });
  }

  // ── Guru Chandal Yoga ─────────────────────────────────────────────────────
  // Jupiter and Rahu in the same sign
  if (ps['Jupiter'] === ps['Rahu']) {
    yogas.push({
      name: 'Guru Chandal Yoga',
      category: 'malefic',
      description:
        `Jupiter and Rahu are conjunct in ${ps['Jupiter']}, corrupting Guru's wisdom with ` +
        `Rahu's illusion — leading to unorthodox beliefs and ethical confusion. ` +
        `Remedy: Worship Lord Vishnu, chant Vishnu Sahasranama, donate yellow items on Thursdays.`,
      confidence: 'high',
    });
  }

  // ── Grahan Yoga (Solar) ───────────────────────────────────────────────────
  // Sun with Rahu or Ketu
  if (ps['Sun'] === ps['Rahu'] || ps['Sun'] === ps['Ketu']) {
    const node = ps['Sun'] === ps['Rahu'] ? 'Rahu' : 'Ketu';
    yogas.push({
      name: 'Grahan Yoga (Solar)',
      category: 'malefic',
      description:
        `Sun is eclipsed by ${node} in ${ps['Sun']}, weakening identity, authority and ` +
        `relationship with the father. Remedy: Offer water to the Sun every morning, ` +
        `chant Aditya Hridayam, donate wheat on Sundays.`,
      confidence: 'high',
    });
  }

  // ── Grahan Yoga (Lunar) ───────────────────────────────────────────────────
  // Moon with Rahu or Ketu (skip if already covered by Solar Grahan in same sign)
  if (
    ps['Moon'] !== ps['Sun'] &&
    (ps['Moon'] === ps['Rahu'] || ps['Moon'] === ps['Ketu'])
  ) {
    const node = ps['Moon'] === ps['Rahu'] ? 'Rahu' : 'Ketu';
    yogas.push({
      name: 'Grahan Yoga (Lunar)',
      category: 'malefic',
      description:
        `Moon is eclipsed by ${node} in ${ps['Moon']}, disturbing emotional balance and ` +
        `the relationship with the mother. Remedy: Chant Gayatri mantra 108 times daily, ` +
        `fast on full moon days, offer milk and rice to the Moon.`,
      confidence: 'high',
    });
  }

  return yogas;
}

export function useLocalYogas(
  dateOfBirth: string | undefined,
  timeOfBirth?: string,
): LocalYoga[] {
  return useMemo(() => {
    if (!dateOfBirth) return [];
    try {
      return detectLocalYogas(dateOfBirth, timeOfBirth);
    } catch {
      return [];
    }
  }, [dateOfBirth, timeOfBirth]);
}

// ── Server-accurate yoga detection ───────────────────────────────────────────
// Accepts the `planets` array from /api/horoscope/south-indian response.
// Each element: { name: string, sign: string, house: number, ... }
// House numbers are whole-sign from ascendant (1-12).
export function detectYogasFromServerChart(planets: any[]): LocalYoga[] {
  if (!planets || planets.length === 0) return [];

  // Build lookup maps
  const ps: Record<string, string> = {};   // planet name → sign
  const ph: Record<string, number> = {};   // planet name → house number
  for (const p of planets) {
    if (p?.name) {
      ps[p.name] = p.sign ?? '';
      ph[p.name] = p.house ?? 0;
    }
  }

  const yogas: LocalYoga[] = [];

  // ── Pancha Mahapurusha Yogas ────────────────────────────────────────────
  // Condition: planet in own sign OR exaltation AND in kendra (house 1,4,7,10)
  const KENDRA = [1, 4, 7, 10];
  const pmpy: [string, string][] = [
    ['Jupiter', 'Hamsa Yoga'],
    ['Venus',   'Malavya Yoga'],
    ['Mars',    'Ruchaka Yoga'],
    ['Mercury', 'Bhadra Yoga'],
    ['Saturn',  'Sasha Yoga'],
  ];
  for (const [planet, yoga] of pmpy) {
    const sign  = ps[planet];
    const house = ph[planet];
    if (!sign || !house) continue;
    const isExalted = EXALTATION[planet] === sign;
    const isOwn     = OWN_SIGNS[planet]?.includes(sign) ?? false;
    const isKendra  = KENDRA.includes(house);
    if ((isExalted || isOwn) && isKendra) {
      yogas.push({
        name: yoga,
        category: 'beneficial',
        description:
          `${planet} is in ${sign} (${isExalted ? 'exalted' : 'own sign'}) ` +
          `in house ${house} (kendra). ${yoga} is fully active — bestowing exceptional ` +
          `strength, success and distinction in ${planet === 'Jupiter' ? 'wisdom & spirituality' : planet === 'Venus' ? 'arts, luxury & relationships' : planet === 'Mars' ? 'courage & physical prowess' : planet === 'Mercury' ? 'intellect & communication' : 'discipline & longevity'}.`,
        confidence: 'high',
      });
    } else if (isExalted || isOwn) {
      // Dignified but not in kendra — partial strength
      yogas.push({
        name: `${yoga} (Partial)`,
        category: 'beneficial',
        description:
          `${planet} is in ${sign} (${isExalted ? 'exalted' : 'own sign'}) ` +
          `in house ${house}. ${yoga} has dignified strength but is not in a kendra, ` +
          `so its full royal expression is moderate.`,
        confidence: 'high',
      });
    }
  }

  // ── Gajakesari Yoga ─────────────────────────────────────────────────────
  const jupFromMoon = signDist(ps['Moon'], ps['Jupiter']);
  if ([1, 4, 7, 10].includes(jupFromMoon)) {
    yogas.push({
      name: 'Gajakesari Yoga',
      category: 'beneficial',
      description:
        `Jupiter (${ps['Jupiter']}, house ${ph['Jupiter']}) is ${jupFromMoon} signs from Moon ` +
        `(${ps['Moon']}, house ${ph['Moon']}) — a kendra relationship. Gajakesari bestows ` +
        `eloquence, wisdom, prosperity and a lasting reputation.`,
      confidence: 'high',
    });
  }

  // ── Budha-Aditya Yoga ───────────────────────────────────────────────────
  if (ps['Sun'] === ps['Mercury']) {
    yogas.push({
      name: 'Budha-Aditya Yoga',
      category: 'beneficial',
      description:
        `Sun and Mercury are both in ${ps['Sun']} (house ${ph['Sun']}), uniting solar authority ` +
        `with Mercurial intellect — sharpening analytical thinking, communication and professional acumen.`,
      confidence: 'high',
    });
  }

  // ── Kemadruma Yoga ──────────────────────────────────────────────────────
  const moonSign  = ps['Moon'];
  const moonIdx2  = SIGNS.indexOf(moonSign);
  const prevSign  = SIGNS[(moonIdx2 + 11) % 12];
  const nextSign  = SIGNS[(moonIdx2 + 1)  % 12];
  const classicPlanets = ['Sun','Mars','Mercury','Jupiter','Venus','Saturn'];
  const classicSigns2  = classicPlanets.map(p => ps[p]);
  const moonAlone =
    !classicSigns2.includes(prevSign) &&
    !classicSigns2.includes(nextSign) &&
    !classicPlanets.some(p => ps[p] === moonSign);
  if (moonAlone) {
    yogas.push({
      name: 'Kemadruma Yoga',
      category: 'malefic',
      description:
        `Moon in ${moonSign} (house ${ph['Moon']}) has no classical planets in adjacent signs — ` +
        `creating emotional isolation and financial fluctuations. ` +
        `Remedy: Worship Goddess Durga, fast on Mondays, chant Chandra mantra.`,
      confidence: 'high',
    });
  }

  // ── Vish Yoga ───────────────────────────────────────────────────────────
  if (ps['Saturn'] === ps['Moon']) {
    yogas.push({
      name: 'Vish Yoga',
      category: 'malefic',
      description:
        `Saturn and Moon conjunct in ${ps['Moon']} (house ${ph['Moon']}) — emotional restriction ` +
        `and periodic melancholy. Remedy: Worship Shiva, chant "Om Namah Shivaya".`,
      confidence: 'high',
    });
  }

  // ── Angarak Yoga ────────────────────────────────────────────────────────
  if (ps['Mars'] === ps['Rahu']) {
    yogas.push({
      name: 'Angarak Yoga',
      category: 'malefic',
      description:
        `Mars and Rahu conjunct in ${ps['Mars']} (house ${ph['Mars']}) — impulsiveness and accident-prone ` +
        `tendencies. Remedy: Chant Hanuman Chalisa daily.`,
      confidence: 'high',
    });
  }

  // ── Shrapit Yoga ────────────────────────────────────────────────────────
  if (ps['Saturn'] === ps['Rahu']) {
    yogas.push({
      name: 'Shrapit Yoga',
      category: 'malefic',
      description:
        `Saturn and Rahu conjunct in ${ps['Saturn']} (house ${ph['Saturn']}) — karmic delays in career ` +
        `and relationships. Remedy: Perform Pitru Tarpan, worship Lord Shiva.`,
      confidence: 'high',
    });
  }

  // ── Guru Chandal Yoga ───────────────────────────────────────────────────
  if (ps['Jupiter'] === ps['Rahu']) {
    yogas.push({
      name: 'Guru Chandal Yoga',
      category: 'malefic',
      description:
        `Jupiter and Rahu conjunct in ${ps['Jupiter']} (house ${ph['Jupiter']}) — confusion in beliefs. ` +
        `Remedy: Worship Vishnu, chant Vishnu Sahasranama.`,
      confidence: 'high',
    });
  }

  // ── Grahan Yoga (Solar) ─────────────────────────────────────────────────
  if (ps['Sun'] === ps['Rahu'] || ps['Sun'] === ps['Ketu']) {
    const node = ps['Sun'] === ps['Rahu'] ? 'Rahu' : 'Ketu';
    yogas.push({
      name: 'Grahan Yoga (Solar)',
      category: 'malefic',
      description:
        `Sun eclipsed by ${node} in ${ps['Sun']} (house ${ph['Sun']}) — challenges to identity and authority. ` +
        `Remedy: Offer water to the Sun every morning, chant Aditya Hridayam.`,
      confidence: 'high',
    });
  }

  // ── Grahan Yoga (Lunar) ─────────────────────────────────────────────────
  if (ps['Moon'] !== ps['Sun'] && (ps['Moon'] === ps['Rahu'] || ps['Moon'] === ps['Ketu'])) {
    const node = ps['Moon'] === ps['Rahu'] ? 'Rahu' : 'Ketu';
    yogas.push({
      name: 'Grahan Yoga (Lunar)',
      category: 'malefic',
      description:
        `Moon eclipsed by ${node} in ${ps['Moon']} (house ${ph['Moon']}) — emotional turbulence. ` +
        `Remedy: Chant Gayatri mantra 108 times daily, fast on full moon days.`,
      confidence: 'high',
    });
  }

  return yogas;
}
