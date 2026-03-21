export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn'
  | 'Rahu'
  | 'Ketu';

export type ZodiacSignName =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export interface PlanetSignData {
  planet: PlanetName;
  planetSanskrit: string;
  sign: ZodiacSignName;
  signSanskrit: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruler: PlanetName;
  slug: string; // e.g. 'jupiter-in-aries'
  title: string;
  summary: string;
  personality: string[];
  career: string;
  relationships: string;
  growthChallenges: string;
  spiritual: string;
  remedies: string[];
  keywords: string[];
}

interface PlanetMeta {
  key: PlanetName;
  planetSanskrit: string;
  glyph: string;
  nature: string;
  beneficFocus: string;
  challengeTheme: string;
  careerAreas: string;
  relationshipTone: string;
  spiritualTheme: string;
  baseKeywords: string[];
}

interface SignMeta {
  key: ZodiacSignName;
  signSanskrit: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruler: PlanetName;
  coreNature: string;
  strengths: string;
  challenges: string;
}

const PLANETS: PlanetMeta[] = [
  {
    key: 'Sun',
    planetSanskrit: 'Surya',
    glyph: '☀️',
    nature: 'soul, authority, vitality and self-expression',
    beneficFocus: 'leadership, recognition and confidence',
    challengeTheme: 'ego clashes or rigid pride',
    careerAreas: 'leadership, government, administration and roles of visibility',
    relationshipTone: 'seeks respect and authenticity in bonds',
    spiritualTheme: 'connection with Atman and life purpose',
    baseKeywords: ['sun in sign', 'surya in rashi'],
  },
  {
    key: 'Moon',
    planetSanskrit: 'Chandra',
    glyph: '🌙',
    nature: 'mind, emotions, instinct and nourishment',
    beneficFocus: 'emotional stability, receptivity and caring nature',
    challengeTheme: 'mood swings and insecurity',
    careerAreas: 'nurturing roles, psychology, hospitality and public contact',
    relationshipTone: 'seeks emotional safety and closeness',
    spiritualTheme: 'devotion, mantra and bhakti',
    baseKeywords: ['moon in sign', 'chandra in rashi'],
  },
  {
    key: 'Mars',
    planetSanskrit: 'Mangal',
    glyph: '🔴',
    nature: 'energy, courage, initiative and aggression',
    beneficFocus: 'drive, competitiveness and capacity to act',
    challengeTheme: 'anger, conflicts and impulsive moves',
    careerAreas: 'engineering, military, sports, surgery and technical fields',
    relationshipTone: 'high passion; needs conscious channeling of anger',
    spiritualTheme: 'tapas, disciplined effort and courage to transform',
    baseKeywords: ['mars in sign', 'mangal in rashi'],
  },
  {
    key: 'Mercury',
    planetSanskrit: 'Budha',
    glyph: '💚',
    nature: 'intellect, speech, logic and communication',
    beneficFocus: 'learning, trade, analysis and adaptability',
    challengeTheme: 'nervousness, overthinking or scattered focus',
    careerAreas: 'business, writing, teaching, communication and analytics',
    relationshipTone: 'values humour, conversation and mental rapport',
    spiritualTheme: 'study of shastras and clear discrimination',
    baseKeywords: ['mercury in sign', 'budha in rashi'],
  },
  {
    key: 'Jupiter',
    planetSanskrit: 'Guru',
    glyph: '🟡',
    nature: 'wisdom, expansion, prosperity and guidance',
    beneficFocus: 'growth, blessings, fortune and dharmic alignment',
    challengeTheme: 'over-indulgence, dogma or complacency',
    careerAreas: 'teaching, counseling, law, finance and spiritual advisory work',
    relationshipTone: 'protective, generous and guiding',
    spiritualTheme: 'faith, Guru-tattva and higher learning',
    baseKeywords: ['jupiter in sign', 'guru in rashi'],
  },
  {
    key: 'Venus',
    planetSanskrit: 'Shukra',
    glyph: '⚪',
    nature: 'love, pleasure, aesthetics and harmony',
    beneficFocus: 'artistry, romance, comforts and social ease',
    challengeTheme: 'over-attachment, indulgence or relationship complications',
    careerAreas: 'arts, design, entertainment, luxuries and relationship counseling',
    relationshipTone: 'seeks beauty, affection and mutual enjoyment',
    spiritualTheme: 'refinement and learning through relationships',
    baseKeywords: ['venus in sign', 'shukra in rashi'],
  },
  {
    key: 'Saturn',
    planetSanskrit: 'Shani',
    glyph: '🔵',
    nature: 'discipline, karma, delay and structure',
    beneficFocus: 'endurance, realism and long-term gains',
    challengeTheme: 'fear, heaviness or chronic struggles',
    careerAreas: 'administration, engineering, law, labour and large organisations',
    relationshipTone: 'serious and committed; may seem distant at first',
    spiritualTheme: 'detachment, humility and karmic purification',
    baseKeywords: ['saturn in sign', 'shani in rashi'],
  },
  {
    key: 'Rahu',
    planetSanskrit: 'Rahu',
    glyph: '🌑',
    nature: 'obsession, amplification and worldly desires',
    beneficFocus: 'innovation, foreign links and breaking limitations',
    challengeTheme: 'confusion, obsessions and sudden swings',
    careerAreas: 'technology, media, foreign trade and unconventional paths',
    relationshipTone: 'intense, unusual or foreign influences in relating',
    spiritualTheme: 'lessons through maya and desire',
    baseKeywords: ['rahu in sign', 'rahu in rashi'],
  },
  {
    key: 'Ketu',
    planetSanskrit: 'Ketu',
    glyph: '🌒',
    nature: 'moksha, detachment and past-life karma',
    beneficFocus: 'spiritual insight and dispassion',
    challengeTheme: 'confusion, isolation or abrupt separations',
    careerAreas: 'research, healing, spirituality and behind-the-scenes work',
    relationshipTone: 'may detach from form to seek deeper essence',
    spiritualTheme: 'moksha, inner enquiry and subtle realisation',
    baseKeywords: ['ketu in sign', 'ketu in rashi'],
  },
];

const SIGNS: SignMeta[] = [
  {
    key: 'Aries',
    signSanskrit: 'Mesha',
    element: 'Fire',
    modality: 'Cardinal',
    ruler: 'Mars',
    coreNature: 'direct, pioneering, action-oriented and bold',
    strengths: 'courage, initiative and ability to start new ventures',
    challenges: 'impulsiveness, impatience and tendency to rush',
  },
  {
    key: 'Taurus',
    signSanskrit: 'Vrishabha',
    element: 'Earth',
    modality: 'Fixed',
    ruler: 'Venus',
    coreNature: 'steady, sensual, value-driven and practical',
    strengths: 'persistence, loyalty and capacity to build resources',
    challenges: 'stubbornness and over-attachment to comfort',
  },
  {
    key: 'Gemini',
    signSanskrit: 'Mithuna',
    element: 'Air',
    modality: 'Mutable',
    ruler: 'Mercury',
    coreNature: 'curious, communicative, mentally agile and versatile',
    strengths: 'networking, learning and adaptability',
    challenges: 'scattered focus or inconsistency',
  },
  {
    key: 'Cancer',
    signSanskrit: 'Karka',
    element: 'Water',
    modality: 'Cardinal',
    ruler: 'Moon',
    coreNature: 'sensitive, protective, nurturing and intuitive',
    strengths: 'empathy, care and emotional intelligence',
    challenges: 'moodiness and emotional overprotectiveness',
  },
  {
    key: 'Leo',
    signSanskrit: 'Simha',
    element: 'Fire',
    modality: 'Fixed',
    ruler: 'Sun',
    coreNature: 'regal, expressive, confident and creative',
    strengths: 'leadership, charisma and generosity',
    challenges: 'ego-sensitivity and desire for constant recognition',
  },
  {
    key: 'Virgo',
    signSanskrit: 'Kanya',
    element: 'Earth',
    modality: 'Mutable',
    ruler: 'Mercury',
    coreNature: 'analytical, detail-focused, humble and service-oriented',
    strengths: 'precision, practicality and desire to improve systems',
    challenges: 'over-criticism and worry',
  },
  {
    key: 'Libra',
    signSanskrit: 'Tula',
    element: 'Air',
    modality: 'Cardinal',
    ruler: 'Venus',
    coreNature: 'harmonising, diplomatic, aesthetic and relationship-focused',
    strengths: 'negotiation, fairness and sense of beauty',
    challenges: 'indecision and people-pleasing',
  },
  {
    key: 'Scorpio',
    signSanskrit: 'Vrishchika',
    element: 'Water',
    modality: 'Fixed',
    ruler: 'Mars',
    coreNature: 'intense, investigative, private and transformative',
    strengths: 'endurance, depth and capacity for rebirth',
    challenges: 'jealousy, secrecy and extremes',
  },
  {
    key: 'Sagittarius',
    signSanskrit: 'Dhanu',
    element: 'Fire',
    modality: 'Mutable',
    ruler: 'Jupiter',
    coreNature: 'philosophical, optimistic, adventurous and truth-seeking',
    strengths: 'faith, vision and love of exploration',
    challenges: 'restlessness and bluntness',
  },
  {
    key: 'Capricorn',
    signSanskrit: 'Makara',
    element: 'Earth',
    modality: 'Cardinal',
    ruler: 'Saturn',
    coreNature: 'goal-focused, responsible, ambitious and disciplined',
    strengths: 'strategic planning, perseverance and realism',
    challenges: 'over-seriousness and workaholism',
  },
  {
    key: 'Aquarius',
    signSanskrit: 'Kumbha',
    element: 'Air',
    modality: 'Fixed',
    ruler: 'Saturn',
    coreNature: 'visionary, humanitarian, independent and unconventional',
    strengths: 'innovation, social concern and objective thinking',
    challenges: 'aloofness and stubborn idealism',
  },
  {
    key: 'Pisces',
    signSanskrit: 'Meena',
    element: 'Water',
    modality: 'Mutable',
    ruler: 'Jupiter',
    coreNature: 'sensitive, imaginative, mystical and compassionate',
    strengths: 'empathy, intuition and spiritual openness',
    challenges: 'escapism and confusion with boundaries',
  },
];

function createSlug(planet: PlanetName, sign: ZodiacSignName): string {
  return `${planet.toLowerCase()}-in-${sign.toLowerCase()}`;
}

function buildPlanetSignData(): PlanetSignData[] {
  const result: PlanetSignData[] = [];

  PLANETS.forEach(planetMeta => {
    SIGNS.forEach(signMeta => {
      const slug = createSlug(planetMeta.key, signMeta.key);
      const title = `${planetMeta.key} in ${signMeta.key}`;
      const summary = `${planetMeta.key} in ${signMeta.key} blends the nature of ${planetMeta.nature} with the ${signMeta.element.toLowerCase()} and ${signMeta.modality.toLowerCase()} qualities of ${signMeta.key}. It highlights ${signMeta.coreNature}, shaping how this planet expresses itself in life.`;

      const personality: string[] = [
        `Brings ${planetMeta.nature} into the style of ${signMeta.coreNature}.`,
        `Strengthens ${signMeta.strengths} when the planet is strong and well placed.`,
        `May trigger ${signMeta.challenges} together with ${planetMeta.challengeTheme} when under affliction.`,
      ];

      const career = `In career, this placement colours ${planetMeta.careerAreas} with the approach of ${signMeta.key}, favouring paths where ${signMeta.strengths.toLowerCase()} can be expressed.`;

      const relationships = `In relationships, it tends to show ${planetMeta.relationshipTone.toLowerCase()} expressed through the temperament of ${signMeta.key}, especially around shared values and emotional style.`;

      const growthChallenges = `Growth comes from balancing ${signMeta.challenges.toLowerCase()} with the higher expression of ${planetMeta.beneficFocus}, avoiding the lower patterns of ${planetMeta.challengeTheme}.`;

      const spiritual = `Spiritually, this combination invites you to live the ${planetMeta.spiritualTheme} of ${planetMeta.planetSanskrit} through the dharmic lessons of ${signMeta.signSanskrit} (${signMeta.key}).`;

      const remedies: string[] = [
        `Honour ${planetMeta.planetSanskrit} with simple daily remembrance and gratitude, especially on the weekday associated with the planet.`,
        'Keep company and environments that support the higher qualities of this sign, such as its strengths and sattvic expression.',
        'Engage in charity or disciplined effort that reflects the best of this planet and sign pairing (for example, teaching, service, or spiritual study).',
      ];

      const keywords = [
        `${planetMeta.key.toLowerCase()} in ${signMeta.key.toLowerCase()}`,
        `${planetMeta.planetSanskrit.toLowerCase()} in ${signMeta.signSanskrit.toLowerCase()}`,
        `${planetMeta.key.toLowerCase()} in ${signMeta.key.toLowerCase()} vedic astrology`,
        ...planetMeta.baseKeywords,
      ];

      result.push({
        planet: planetMeta.key,
        planetSanskrit: planetMeta.planetSanskrit,
        sign: signMeta.key,
        signSanskrit: signMeta.signSanskrit,
        element: signMeta.element,
        modality: signMeta.modality,
        ruler: signMeta.ruler,
        slug,
        title,
        summary,
        personality,
        career,
        relationships,
        growthChallenges,
        spiritual,
        remedies,
        keywords,
      });
    });
  });

  return result;
}

export const PLANET_SIGN_DATA: PlanetSignData[] = buildPlanetSignData();

export function getPlanetSignBySlug(slug: string): PlanetSignData | undefined {
  return PLANET_SIGN_DATA.find(p => p.slug === slug);
}

export function getPlanetSignsByPlanet(planet: PlanetName): PlanetSignData[] {
  return PLANET_SIGN_DATA.filter(p => p.planet === planet).sort((a, b) => a.sign.localeCompare(b.sign));
}

export function getAllZodiacSigns(): SignMeta[] {
  return SIGNS;
}
