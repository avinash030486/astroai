/**
 * nakshatraAura.ts
 * Visual aura definitions for all 27 Nakshatras.
 * Each entry defines: aura colour palette, mantra, element, shakti (power),
 * and dominant planet — used by the AR Nakshatra Aura screen.
 */

export interface NakshatraAura {
  name: string;
  index: number;          // 0-26
  planet: string;         // ruling planet
  element: string;
  shakti: string;         // spiritual power
  mantra: string;
  colors: [string, string, string]; // inner → mid → outer glow
  symbol: string;         // emoji symbol
  glowIntensity: number;  // 0.4 – 1.0
}

export const NAKSHATRA_AURAS: NakshatraAura[] = [
  { index: 0,  name: 'Ashwini',          planet: 'Ketu',    element: 'Fire',  shakti: 'Healing',       mantra: 'ॐ अश्विनौ',     colors: ['#FF6B6B','#FF9F43','#FFDD59'], symbol: '🐴', glowIntensity: 0.9 },
  { index: 1,  name: 'Bharani',          planet: 'Venus',   element: 'Earth', shakti: 'Removal',        mantra: 'ॐ यमाय',        colors: ['#FF4757','#C0392B','#8E44AD'], symbol: '🔺', glowIntensity: 0.8 },
  { index: 2,  name: 'Krittika',         planet: 'Sun',     element: 'Fire',  shakti: 'Purification',   mantra: 'ॐ अग्नये',      colors: ['#FFA502','#FF6348','#FFDD59'], symbol: '🔥', glowIntensity: 1.0 },
  { index: 3,  name: 'Rohini',           planet: 'Moon',    element: 'Earth', shakti: 'Growth',          mantra: 'ॐ प्रजापतये',  colors: ['#2ED573','#1E90FF','#A8E063'], symbol: '🌱', glowIntensity: 0.85},
  { index: 4,  name: 'Mrigashirsha',       planet: 'Mars',    element: 'Air',   shakti: 'Searching',       mantra: 'ॐ सोमाय',      colors: ['#70A1FF','#5352ED','#ECCC68'], symbol: '🦌', glowIntensity: 0.7 },
  { index: 5,  name: 'Ardra',            planet: 'Rahu',    element: 'Air',   shakti: 'Effort',          mantra: 'ॐ रुद्राय',    colors: ['#1E3799','#0C2461','#4CD3C2'], symbol: '💧', glowIntensity: 0.75},
  { index: 6,  name: 'Punarvasu',        planet: 'Jupiter', element: 'Air',   shakti: 'Renewal',         mantra: 'ॐ अदित्यै',    colors: ['#F9CA24','#F0932B','#6AB04C'], symbol: '🏹', glowIntensity: 0.9 },
  { index: 7,  name: 'Pushya',           planet: 'Saturn',  element: 'Water', shakti: 'Nourishment',     mantra: 'ॐ बृहस्पतये', colors: ['#00B894','#0984E3','#74B9FF'], symbol: '🌸', glowIntensity: 0.85},
  { index: 8,  name: 'Ashlesha',         planet: 'Mercury', element: 'Water', shakti: 'Entwining',       mantra: 'ॐ सर्पेभ्यः', colors: ['#6C5CE7','#A29BFE','#FD79A8'], symbol: '🐍', glowIntensity: 0.7 },
  { index: 9,  name: 'Magha',            planet: 'Ketu',    element: 'Fire',  shakti: 'Authority',       mantra: 'ॐ पितृभ्यः',  colors: ['#D63031','#FDCB6E','#E17055'], symbol: '👑', glowIntensity: 1.0 },
  { index: 10, name: 'Purva Phalguni',   planet: 'Venus',   element: 'Fire',  shakti: 'Prosperity',      mantra: 'ॐ भगाय',       colors: ['#FD79A8','#E84393','#FDCB6E'], symbol: '🌺', glowIntensity: 0.9 },
  { index: 11, name: 'Uttara Phalguni',  planet: 'Sun',     element: 'Fire',  shakti: 'Union',           mantra: 'ॐ अर्यम्णे',  colors: ['#FFA502','#FF6B6B','#FFDD59'], symbol: '☀️', glowIntensity: 0.95},
  { index: 12, name: 'Hasta',            planet: 'Moon',    element: 'Earth', shakti: 'Gaining',         mantra: 'ॐ सवित्रे',   colors: ['#55EFC4','#00B894','#81ECEC'], symbol: '✋', glowIntensity: 0.8 },
  { index: 13, name: 'Chitra',           planet: 'Mars',    element: 'Fire',  shakti: 'Accumulation',    mantra: 'ॐ त्वष्ट्रे', colors: ['#A29BFE','#6C5CE7','#FD79A8'], symbol: '💎', glowIntensity: 0.85},
  { index: 14, name: 'Swati',            planet: 'Rahu',    element: 'Air',   shakti: 'Scattering',      mantra: 'ॐ वायवे',      colors: ['#74B9FF','#0984E3','#DFE6E9'], symbol: '⚡', glowIntensity: 0.75},
  { index: 15, name: 'Vishakha',         planet: 'Jupiter', element: 'Fire',  shakti: 'Achievement',     mantra: 'ॐ इन्द्राग्निभ्यां', colors: ['#F9CA24','#E17055','#FDCB6E'], symbol: '⚖️', glowIntensity: 0.9 },
  { index: 16, name: 'Anuradha',         planet: 'Saturn',  element: 'Fire',  shakti: 'Devotion',        mantra: 'ॐ मित्राय',   colors: ['#4CD3C2','#0984E3','#A29BFE'], symbol: '🌟', glowIntensity: 0.85},
  { index: 17, name: 'Jyeshtha',         planet: 'Mercury', element: 'Air',   shakti: 'Power',           mantra: 'ॐ इन्द्राय',  colors: ['#636E72','#B2BEC3','#6C5CE7'], symbol: '🛡️', glowIntensity: 0.8 },
  { index: 18, name: 'Mula',             planet: 'Ketu',    element: 'Fire',  shakti: 'Destruction',     mantra: 'ॐ निरृत्यै',  colors: ['#2D3436','#6C5CE7','#E17055'], symbol: '🌀', glowIntensity: 0.7 },
  { index: 19, name: 'Purva Ashadha',    planet: 'Venus',   element: 'Air',   shakti: 'Invigoration',    mantra: 'ॐ अद्भ्यः',   colors: ['#00CEC9','#0984E3','#74B9FF'], symbol: '🌊', glowIntensity: 0.85},
  { index: 20, name: 'Uttara Ashadha',   planet: 'Sun',     element: 'Earth', shakti: 'Victory',         mantra: 'ॐ विश्वेभ्यः', colors: ['#FDCB6E','#E17055','#FFA502'], symbol: '🏆', glowIntensity: 0.95},
  { index: 21, name: 'Shravana',         planet: 'Moon',    element: 'Air',   shakti: 'Connection',      mantra: 'ॐ विष्णवे',   colors: ['#81ECEC','#00CEC9','#74B9FF'], symbol: '👂', glowIntensity: 0.8 },
  { index: 22, name: 'Dhanishta',       planet: 'Mars',    element: 'Air',   shakti: 'Abundance',       mantra: 'ॐ अष्टवसुभ्यः', colors: ['#D63031','#FDCB6E','#E84393'], symbol: '🥁', glowIntensity: 0.9 },
  { index: 23, name: 'Shatabhisha',      planet: 'Rahu',    element: 'Air',   shakti: 'Healing',         mantra: 'ॐ वरुणाय',    colors: ['#0984E3','#6C5CE7','#A29BFE'], symbol: '💫', glowIntensity: 0.75},
  { index: 24, name: 'Purva Bhadrapada', planet: 'Jupiter', element: 'Fire',  shakti: 'Elevation',       mantra: 'ॐ अजैकपदे',  colors: ['#6C5CE7','#A29BFE','#FD79A8'], symbol: '🔱', glowIntensity: 0.85},
  { index: 25, name: 'Uttara Bhadrapada',planet: 'Saturn',  element: 'Water', shakti: 'Rain',            mantra: 'ॐ अहिर्बुध्न्याय', colors: ['#2D3436','#636E72','#74B9FF'], symbol: '🐉', glowIntensity: 0.8 },
  { index: 26, name: 'Revati',           planet: 'Mercury', element: 'Water', shakti: 'Nourishment',     mantra: 'ॐ पूष्णे',    colors: ['#55EFC4','#FD79A8','#FDCB6E'], symbol: '🐟', glowIntensity: 0.9 },
];

/** Derive Nakshatra index from Moon's sidereal longitude */
export function getNakshatraFromMoonLon(moonLon: number): NakshatraAura {
  const idx = Math.floor(((moonLon % 360) + 360) % 360 / (360 / 27));
  return NAKSHATRA_AURAS[idx] ?? NAKSHATRA_AURAS[0];
}

/** Gemstone colors for the AR try-on overlay */
export const GEMSTONE_COLORS: Record<string, { color: string; glow: string; emoji: string }> = {
  Ruby:        { color: '#E84C3D', glow: '#FF6B6B', emoji: '🔴' },
  Pearl:       { color: '#F8F8FF', glow: '#E8E8FF', emoji: '⚪' },
  'Red Coral': { color: '#FF6348', glow: '#FF9F7A', emoji: '🟠' },
  Emerald:     { color: '#2ECC71', glow: '#58D68D', emoji: '💚' },
  'Yellow Sapphire': { color: '#F9CA24', glow: '#FDDD7A', emoji: '💛' },
  Diamond:     { color: '#AED6F1', glow: '#D6EAF8', emoji: '💎' },
  'Blue Sapphire':   { color: '#2980B9', glow: '#5DADE2', emoji: '🔵' },
  Hessonite:   { color: '#B7950B', glow: '#D4AC0D', emoji: '🟡' },
  "Cat's Eye": { color: '#7D6608', glow: '#B7950B', emoji: '🟤' },
};

/** Map planet to its primary gemstone */
export const PLANET_GEMSTONE: Record<string, string> = {
  Sun:     'Ruby',
  Moon:    'Pearl',
  Mars:    'Red Coral',
  Mercury: 'Emerald',
  Jupiter: 'Yellow Sapphire',
  Venus:   'Diamond',
  Saturn:  'Blue Sapphire',
  Rahu:    'Hessonite',
  Ketu:    "Cat's Eye",
};

/** Correct finger for each gemstone */
export const GEMSTONE_FINGER: Record<string, { finger: string; hand: string; fingerIndex: number }> = {
  Ruby:              { finger: 'Ring finger',   hand: 'Right', fingerIndex: 3 },
  Pearl:             { finger: 'Little finger', hand: 'Right', fingerIndex: 4 },
  'Red Coral':       { finger: 'Ring finger',   hand: 'Right', fingerIndex: 3 },
  Emerald:           { finger: 'Little finger', hand: 'Right', fingerIndex: 4 },
  'Yellow Sapphire': { finger: 'Index finger',  hand: 'Right', fingerIndex: 1 },
  Diamond:           { finger: 'Middle finger', hand: 'Right', fingerIndex: 2 },
  'Blue Sapphire':   { finger: 'Middle finger', hand: 'Right', fingerIndex: 2 },
  Hessonite:         { finger: 'Middle finger', hand: 'Right', fingerIndex: 2 },
  "Cat's Eye":       { finger: 'Middle finger', hand: 'Right', fingerIndex: 2 },
};
