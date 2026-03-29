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

export interface PlanetHouseData {
  planet: PlanetName;
  planetSanskrit: string;
  house: number; // 1-12
  slug: string; // e.g. 'jupiter-in-1st-house'
  title: string;
  summary: string;
  generalEffects: string[];
  career: string;
  relationships: string;
  health: string;
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
  healthTheme: string;
  spiritualTheme: string;
  baseKeywords: string[];
}

interface HouseMeta {
  house: number;
  name: string;
  focus: string;
  positive: string;
  challenge: string;
}

const PLANETS: PlanetMeta[] = [
  {
    key: 'Sun',
    planetSanskrit: 'Surya',
    glyph: '☀️',
    nature: 'soul, authority, vitality and self-expression',
    beneficFocus: 'leadership, recognition and confidence',
    challengeTheme: 'ego clashes, burnout or rigid pride',
    careerAreas: 'leadership, government, administration, politics and roles of visibility',
    relationshipTone: 'seeks respect and authenticity; sometimes appears domineering if afflicted',
    healthTheme: 'vitality, heart, eyes and overall immunity',
    spiritualTheme: 'connection with Atman, purpose and inner light',
    baseKeywords: ['sun in house', 'surya graha effects'],
  },
  {
    key: 'Moon',
    planetSanskrit: 'Chandra',
    glyph: '🌙',
    nature: 'mind, emotions, habits and nourishment',
    beneficFocus: 'emotional stability, receptivity and caring nature',
    challengeTheme: 'mood swings, insecurity and over-sensitivity',
    careerAreas: 'nurturing roles, psychology, hospitality, public dealings and creative work',
    relationshipTone: 'seeks emotional security and nurturing bonds',
    healthTheme: 'digestion, fluids, sleep patterns and mental balance',
    spiritualTheme: 'devotion, mantra, bhakti and emotional surrender',
    baseKeywords: ['moon in house', 'chandra graha effects'],
  },
  {
    key: 'Mars',
    planetSanskrit: 'Mangal',
    glyph: '🔴',
    nature: 'energy, courage, aggression and initiative',
    beneficFocus: 'drive, competitiveness and ability to fight for goals',
    challengeTheme: 'anger, impulsiveness and conflicts',
    careerAreas: 'engineering, military, sports, surgery, real estate and technical fields',
    relationshipTone: 'high passion; needs constructive outlets to avoid conflict',
    healthTheme: 'muscles, blood, accidents and inflammations',
    spiritualTheme: 'disciplined sadhana, tapas and courage to transform',
    baseKeywords: ['mars in house', 'mangal graha effects'],
  },
  {
    key: 'Mercury',
    planetSanskrit: 'Budha',
    glyph: '💚',
    nature: 'intellect, speech, logic and communication',
    beneficFocus: 'learning, trade, analysis and adaptability',
    challengeTheme: 'restlessness, nervousness and overthinking',
    careerAreas: 'business, writing, teaching, communication, technology and analysis',
    relationshipTone: 'values communication, humour and mental connection',
    healthTheme: 'nervous system, skin and speech-related concerns',
    spiritualTheme: 'study of scriptures, mantra and clear discrimination (viveka)',
    baseKeywords: ['mercury in house', 'budha graha effects'],
  },
  {
    key: 'Jupiter',
    planetSanskrit: 'Guru',
    glyph: '🟡',
    nature: 'wisdom, expansion, prosperity and guidance',
    beneficFocus: 'growth, blessings, fortune and dharmic alignment',
    challengeTheme: 'over-indulgence, dogma or laziness',
    careerAreas: 'teaching, counseling, law, finance, spirituality and advisory roles',
    relationshipTone: 'protective, guiding and generous; may become preachy if afflicted',
    healthTheme: 'liver, fat metabolism and weight management',
    spiritualTheme: 'faith, Guru-tattva and higher learning',
    baseKeywords: ['jupiter in house', 'guru graha effects'],
  },
  {
    key: 'Venus',
    planetSanskrit: 'Shukra',
    glyph: '⚪',
    nature: 'love, pleasure, beauty and harmony',
    beneficFocus: 'artistry, charm, relationships and comforts',
    challengeTheme: 'over-attachment, indulgence or relationship issues',
    careerAreas: 'arts, design, entertainment, luxuries, finance and counseling on relationships',
    relationshipTone: 'seeks harmony, romance and aesthetic connection',
    healthTheme: 'reproductive system, kidneys and sugar balance',
    spiritualTheme: 'bhakti, refinement and learning through relationships',
    baseKeywords: ['venus in house', 'shukra graha effects'],
  },
  {
    key: 'Saturn',
    planetSanskrit: 'Shani',
    glyph: '🔵',
    nature: 'discipline, karma, delay and structure',
    beneficFocus: 'endurance, realism, responsibility and long-term gains',
    challengeTheme: 'fear, limitation, sorrow or chronic issues',
    careerAreas: 'administration, engineering, labour, law, large organisations and long-term projects',
    relationshipTone: 'serious and committed; may feel lonely or burdened initially',
    healthTheme: 'bones, joints, chronic conditions and ageing',
    spiritualTheme: 'detachment, discipline and deep karmic purification',
    baseKeywords: ['saturn in house', 'shani graha effects'],
  },
  {
    key: 'Rahu',
    planetSanskrit: 'Rahu',
    glyph: '🌑',
    nature: 'obsession, amplification, worldly desires and unconventional paths',
    beneficFocus: 'innovation, foreign connections and breaking limitations',
    challengeTheme: 'confusion, illusion, addictions and sudden swings',
    careerAreas: 'foreign trade, technology, mass media, unconventional or cutting-edge fields',
    relationshipTone: 'intense, unusual or foreign influences; can create karmic entanglements',
    healthTheme: 'allergic reactions, psychological stress and sudden imbalances',
    spiritualTheme: 'lessons through maya, detachment and shadow work',
    baseKeywords: ['rahu in house', 'rahu effects'],
  },
  {
    key: 'Ketu',
    planetSanskrit: 'Ketu',
    glyph: '🌒',
    nature: 'moksha, detachment, past-life karma and subtle insight',
    beneficFocus: 'spiritual insight, intuition and dispassion',
    challengeTheme: 'confusion, isolation or sudden separations',
    careerAreas: 'research, spirituality, healing, metaphysics and behind-the-scenes work',
    relationshipTone: 'can withdraw from worldly attachment; seeks inner connection more than form',
    healthTheme: 'nervous sensitivity, mysterious or hard-to-diagnose issues',
    spiritualTheme: 'moksha, liberation and deep inner enquiry',
    baseKeywords: ['ketu in house', 'ketu effects'],
  },
];

const HOUSES: HouseMeta[] = [
  {
    house: 1,
    name: '1st House (Lagna)',
    focus: 'self, body, temperament and overall life direction',
    positive: 'strong identity, initiative and personal charisma',
    challenge: 'identity crises, ego issues or physical strain',
  },
  {
    house: 2,
    name: '2nd House',
    focus: 'speech, family, early upbringing, values and accumulated wealth',
    positive: 'financial stability, cultured speech and supportive family atmosphere',
    challenge: 'family disputes, value conflicts or financial ups and downs',
  },
  {
    house: 3,
    name: '3rd House',
    focus: 'courage, efforts, communication, siblings and short travels',
    positive: 'strong initiative, communication skills and practical courage',
    challenge: 'restlessness, over-competition or strained sibling relations',
  },
  {
    house: 4,
    name: '4th House',
    focus: 'home, mother, inner peace, property and emotional foundation',
    positive: 'comfort, emotional security and good support from home environment',
    challenge: 'inner restlessness, real estate concerns or emotional insecurity',
  },
  {
    house: 5,
    name: '5th House',
    focus: 'intelligence, creativity, children, romance and purva-punya',
    positive: 'intuitive intelligence, creativity and joy from children or creative pursuits',
    challenge: 'romantic complications, speculative losses or issues with children',
  },
  {
    house: 6,
    name: '6th House',
    focus: 'service, health, daily work, debts, enemies and obstacles',
    positive: 'capacity to solve problems, serve diligently and overcome competition',
    challenge: 'stress, health vulnerabilities and ongoing conflicts or debts',
  },
  {
    house: 7,
    name: '7th House',
    focus: 'marriage, partnerships, agreements and public dealings',
    positive: 'strong partnerships, social skills and beneficial collaborations',
    challenge: 'relationship conflicts, imbalance in give-and-take or legal disputes',
  },
  {
    house: 8,
    name: '8th House',
    focus: 'transformation, longevity, secrets, joint resources and occult matters',
    positive: 'capacity for deep transformation, research and dealing with crises',
    challenge: 'sudden ups and downs, secrecy or psychological intensity',
  },
  {
    house: 9,
    name: '9th House',
    focus: 'dharma, higher learning, luck, teachers and long-distance travel',
    positive: 'fortune, blessings from Gurus and interest in philosophy and dharma',
    challenge: 'clashes with belief systems or distance from father/mentors',
  },
  {
    house: 10,
    name: '10th House',
    focus: 'career, reputation, karma and impact on the world',
    positive: 'strong professional life, visibility and capacity to shoulder responsibility',
    challenge: 'work pressure, public scrutiny or career volatility',
  },
  {
    house: 11,
    name: '11th House',
    focus: 'gains, networks, elder siblings and long-term desires',
    positive: 'steady gains, strong social circle and fulfilment of desires',
    challenge: 'over-attachment to results or unstable friendships',
  },
  {
    house: 12,
    name: '12th House',
    focus: 'losses, expenses, foreign lands, sleep and moksha',
    positive: 'capacity for spiritual retreat, charity and foreign connections',
    challenge: 'wasteful expenses, isolation or sleep disturbances',
  },
];

// Helper to build slug consistently (correct English ordinals)
function getOrdinalSuffix(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function createSlug(planet: PlanetName, house: number): string {
  return `${planet.toLowerCase()}-in-${getOrdinalSuffix(house)}-house`;
}

function buildPlanetHouseData(): PlanetHouseData[] {
  const result: PlanetHouseData[] = [];

  PLANETS.forEach(planetMeta => {
    HOUSES.forEach(houseMeta => {
      const slug = createSlug(planetMeta.key, houseMeta.house);
      const title = `${planetMeta.key} in the ${houseMeta.name}`;
      const summary = `${planetMeta.key} in the ${houseMeta.name} highlights ${houseMeta.focus} through the lens of ${planetMeta.nature}. When well placed, it supports ${planetMeta.beneficFocus}; when afflicted, it can bring ${planetMeta.challengeTheme} in these areas.`;

      const generalEffects: string[] = [
        `${planetMeta.key} in this house tends to shape ${houseMeta.focus}, often amplifying your experience of these areas.`,
        `When strong and well supported, it can bring ${houseMeta.positive}, coloured by ${planetMeta.beneficFocus}.`,
        `If under affliction, it may manifest as ${houseMeta.challenge} along with ${planetMeta.challengeTheme}.`,
      ];

      const career = `In career matters, this placement connects ${planetMeta.careerAreas} with the themes of the ${houseMeta.name}, often pushing you towards roles where ${houseMeta.focus} becomes central to your work.`;

      const relationships = `In relationships, it influences how you relate to others around matters of ${houseMeta.focus}. ${planetMeta.relationshipTone}`;

      const health = `Health-wise, attention may be needed around ${planetMeta.healthTheme}, especially during challenging dashas or transits touching this house.`;

      const spiritual = `Spiritually, this placement invites growth through ${planetMeta.spiritualTheme} while working consciously with the lessons of the ${houseMeta.name}.`;

      const remedies: string[] = [
        `Honour ${planetMeta.planetSanskrit} through simple daily remembrance and gratitude for the lessons of this house.`,
        'Maintain sattvic lifestyle habits, especially on the weekday associated with the planet, as guided by your astrologer.',
        'Engage in charity or service connected to the house themes (for example, supporting education, health, or spiritual causes).',
      ];

      const keywords = [
        `${planetMeta.key.toLowerCase()} in ${houseMeta.house}th house`,
        `${planetMeta.planetSanskrit.toLowerCase()} in ${houseMeta.house}th house`,
        `${planetMeta.key.toLowerCase()} ${houseMeta.house}th house vedic astrology`,
        ...planetMeta.baseKeywords,
      ];

      result.push({
        planet: planetMeta.key,
        planetSanskrit: planetMeta.planetSanskrit,
        house: houseMeta.house,
        slug,
        title,
        summary,
        generalEffects,
        career,
        relationships,
        health,
        spiritual,
        remedies,
        keywords,
      });
    });
  });

  return result;
}

export const PLANET_HOUSE_DATA: PlanetHouseData[] = buildPlanetHouseData();

export function getPlanetHouseBySlug(slug: string): PlanetHouseData | undefined {
  return PLANET_HOUSE_DATA.find(p => p.slug === slug);
}

export function getPlanetHousesByPlanet(planet: PlanetName): PlanetHouseData[] {
  return PLANET_HOUSE_DATA.filter(p => p.planet === planet).sort((a, b) => a.house - b.house);
}

export function getAllPlanets(): PlanetMeta[] {
  return PLANETS;
}

