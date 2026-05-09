// ──────────────────────────────────────────────────────────────────────────────
// Exalted Planets Data — Vedic Astrology Static Content
// Covers all 9 planets × overview + 12 houses = 9 + 108 pages
// ──────────────────────────────────────────────────────────────────────────────

export interface ExaltedPlanetData {
  planet: string;
  planetSanskrit: string;
  glyph: string;
  exaltationSign: string;
  exaltationDegree: string;
  slug: string;
  title: string;
  metaDescription: string;
  overview: string;
  keyStrengths: string[];
  careerAreas: string;
  relationshipTone: string;
  healthBenefits: string;
  spiritualTheme: string;
  famousPersonalities: string;
  keywords: string[];
}

export interface ExaltedPlanetHouseData {
  planet: string;
  planetSanskrit: string;
  house: number;
  slug: string;
  title: string;
  metaDescription: string;
  summary: string;
  generalEffects: string[];
  career: string;
  relationships: string;
  health: string;
  spiritual: string;
  remedies: string[];
  keywords: string[];
}

// ── Planet meta ───────────────────────────────────────────────────────────────

const EXALTED_PLANETS_META: ExaltedPlanetData[] = [
  {
    planet: 'Sun',
    planetSanskrit: 'Surya',
    glyph: '☀️',
    exaltationSign: 'Aries',
    exaltationDegree: '10°',
    slug: 'exalted-sun',
    title: 'Exalted Sun (Surya Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'The Sun exalted in Aries at 10° grants exceptional vitality, natural authority and leadership. Discover the full effects of exalted Sun on career, relationships, health and spirituality in Vedic astrology.',
    overview: 'The Sun reaches its highest dignity in Aries at 10°, conferring exceptional vitality, natural authority, unwavering confidence and strong leadership. An exalted Sun endows the native with a radiant personality, powerful willpower and the capacity to inspire others effortlessly. The soul-force operates at its fullest expression, granting a magnetic presence and the ability to rise to positions of prominence.',
    keyStrengths: [
      'Exceptional leadership and executive authority',
      'Radiant health and strong immunity',
      'High moral integrity and self-discipline',
      'Recognition from government and powerful figures',
      'Courage, ambition and a noble, dharmic character',
      'Strong father-relationship and ancestral blessings',
    ],
    careerAreas: 'Government service, politics, administration, medicine, law, senior management and any position of authority, visibility or public leadership',
    relationshipTone: 'Commands respect and loyalty; inspires partners and family through strength, warmth and reliability; natural protector of loved ones',
    healthBenefits: 'Strong heart, excellent eyesight, robust immune system, high energy levels and superior vitality throughout life',
    spiritualTheme: 'Atma-sakshatkar (self-realisation), dharmic living, soul-level confidence and alignment with divine will',
    famousPersonalities: 'Many heads of state, renowned doctors, celebrated performers and spiritual leaders are born with an exalted or well-placed Sun',
    keywords: ['exalted sun', 'surya uccha', 'sun in aries', 'exalted sun effects', 'strong sun vedic astrology', 'uccha surya', 'sun exaltation astrology'],
  },
  {
    planet: 'Moon',
    planetSanskrit: 'Chandra',
    glyph: '🌕',
    exaltationSign: 'Taurus',
    exaltationDegree: '3°',
    slug: 'exalted-moon',
    title: 'Exalted Moon (Chandra Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'The Moon exalted in Taurus at 3° bestows emotional stability, deep contentment, wealth and refined sensibilities. Discover the full effects of exalted Moon in Vedic astrology.',
    overview: 'The Moon is exalted in Taurus at 3°, bestowing emotional stability, deep contentment, refined sensibilities and a nurturing nature. The native enjoys a calm, receptive mind with strong intuition and an innate capacity for happiness and material comfort. Taurus grounds the Moon\'s fluid energy into lasting peace, abundance and aesthetic beauty, making this one of the most sought-after placements for emotional fulfilment.',
    keyStrengths: [
      'Emotional stability, peace and deep contentment',
      'Strong intuition and empathic sensitivity',
      'Natural wealth, comfort and material security',
      'Beautiful aesthetic sensibility and love of nature',
      'Excellent memory, fertile imagination and creative vision',
      'Harmonious family life and strong maternal relationships',
    ],
    careerAreas: 'Healing, counseling, hospitality, arts, finance, real estate, nursing and all nurturing or beauty-related professions',
    relationshipTone: 'Deeply caring, loyal and supportive; creates warm, harmonious family environments and lasting bonds of devotion',
    healthBenefits: 'Balanced hormones, restful sleep, strong digestion and excellent emotional resilience across all life phases',
    spiritualTheme: 'Bhakti, inner peace, divine motherly love, surrender and the cultivation of lasting contentment',
    famousPersonalities: 'Gifted artists, compassionate healers, prosperous financiers and devoted mothers often carry this placement',
    keywords: ['exalted moon', 'chandra uccha', 'moon in taurus', 'exalted moon effects', 'strong moon vedic astrology', 'uccha chandra'],
  },
  {
    planet: 'Mars',
    planetSanskrit: 'Mangal',
    glyph: '🔴',
    exaltationSign: 'Capricorn',
    exaltationDegree: '28°',
    slug: 'exalted-mars',
    title: 'Exalted Mars (Mangal Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Mars exalted in Capricorn at 28° channels raw energy into disciplined, goal-oriented action. Discover how exalted Mars affects career, relationships, health and spiritual life.',
    overview: 'Mars achieves its greatest potency in Capricorn at 28°, channelling raw energy into disciplined, goal-oriented action. This placement produces commanders, engineers and athletes who combine courage with strategic thinking. The fiery will of Mars is perfectly structured by Capricorn\'s ambition and patience, resulting in sustained, spectacular achievements that leave a lasting legacy.',
    keyStrengths: [
      'Disciplined, focused and strategically applied courage',
      'Outstanding physical stamina and endurance',
      'Success in competitive fields and leadership roles',
      'Excellent property acquisition and real estate gains',
      'Strong protective instincts for family and nation',
      'Ability to execute long-term plans with precision',
    ],
    careerAreas: 'Military, engineering, surgery, real estate, sports, law enforcement, executive management and all fields requiring disciplined strength',
    relationshipTone: 'Protective, loyal and passionately devoted; expects honesty and directness; admired for strength and dependability',
    healthBenefits: 'Strong muscles, robust blood and bone health, excellent physical vitality and high resistance to injury',
    spiritualTheme: 'Dharmic warfare, karma yoga and the discipline of righteous, selfless action in service of truth',
    famousPersonalities: 'Military commanders, top athletes, successful surgeons and property developers frequently carry this exaltation',
    keywords: ['exalted mars', 'mangal uccha', 'mars in capricorn', 'exalted mars effects', 'strong mars vedic astrology', 'uccha mangal'],
  },
  {
    planet: 'Mercury',
    planetSanskrit: 'Budha',
    glyph: '💚',
    exaltationSign: 'Virgo',
    exaltationDegree: '15°',
    slug: 'exalted-mercury',
    title: 'Exalted Mercury (Budha Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Mercury exalted in Virgo at 15° grants razor-sharp analytical intelligence and exceptional communication skills. Learn the full effects of exalted Mercury in Vedic astrology.',
    overview: 'Mercury is exalted in Virgo at 15°, granting razor-sharp analytical intelligence, exceptional communication skills, precise reasoning and mastery of detail. The native excels in any field requiring intellect, discrimination and systematic thinking. Virgo is Mercury\'s own sign as well, making this double-strength placement one of the most intellectually gifted in the entire zodiac.',
    keyStrengths: [
      'Brilliant analytical and logical intelligence',
      'Exceptional communication, writing and speaking skills',
      'Mastery of detail, data and complex systems thinking',
      'Outstanding success in business, trade and negotiations',
      'Quick learning ability, strong memory and fast processing',
      'Skill in medicine, law and analytical problem-solving',
    ],
    careerAreas: 'Technology, accounting, writing, journalism, research, medicine, teaching, law, software engineering and business',
    relationshipTone: 'Witty, communicative and intellectually stimulating; values mental compatibility and deep, thoughtful conversations',
    healthBenefits: 'Healthy nervous system, sharp cognitive function, good respiratory health and strong neurological resilience',
    spiritualTheme: 'Jnana yoga, mantra science, scriptural study and the path of discernment (viveka) leading to liberation',
    famousPersonalities: 'Celebrated writers, brilliant scientists, successful entrepreneurs and gifted teachers often have this placement',
    keywords: ['exalted mercury', 'budha uccha', 'mercury in virgo', 'exalted mercury effects', 'strong mercury vedic astrology', 'uccha budha'],
  },
  {
    planet: 'Jupiter',
    planetSanskrit: 'Guru',
    glyph: '🟡',
    exaltationSign: 'Cancer',
    exaltationDegree: '5°',
    slug: 'exalted-jupiter',
    title: 'Exalted Jupiter (Guru Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Jupiter exalted in Cancer at 5° pours out wisdom, abundance and spiritual grace. Discover the profound effects of exalted Jupiter on every area of life in Vedic astrology.',
    overview: 'Jupiter reaches its pinnacle of strength in Cancer at 5°, pouring out wisdom, abundance, spiritual grace and deep compassion. This is considered one of the most auspicious placements in all of Vedic astrology, bestowing great fortune, moral excellence and a life of purpose. The nurturing quality of Cancer amplifies Jupiter\'s natural magnanimity, creating individuals who inspire and uplift everyone they touch.',
    keyStrengths: [
      'Exceptional wisdom, moral integrity and spiritual depth',
      'Abundant prosperity, wealth and material security',
      'Strong family bonds, fertility and domestic happiness',
      'Natural teaching, counseling and guiding abilities',
      'Protection from major adversities throughout life',
      'Grace, generosity and the capacity to inspire deep trust',
    ],
    careerAreas: 'Teaching, law, finance, spirituality, counseling, medicine, philosophy, advisory and all wisdom-sharing professions',
    relationshipTone: 'Generous, protective and deeply guiding; fosters growth and lasting happiness in all relationships',
    healthBenefits: 'Healthy liver and endocrine system, balanced weight, overall vitality and natural longevity',
    spiritualTheme: 'Guru-bhakti, dharmic expansion, surrender to divine grace and the realisation of universal abundance',
    famousPersonalities: 'Great teachers, generous philanthropists, visionary leaders and loving family patriarchs often carry this placement',
    keywords: ['exalted jupiter', 'guru uccha', 'jupiter in cancer', 'exalted jupiter effects', 'strong jupiter vedic astrology', 'uccha guru'],
  },
  {
    planet: 'Venus',
    planetSanskrit: 'Shukra',
    glyph: '⚪',
    exaltationSign: 'Pisces',
    exaltationDegree: '27°',
    slug: 'exalted-venus',
    title: 'Exalted Venus (Shukra Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Venus exalted in Pisces at 27° expresses unconditional love, divine beauty and artistic genius. Explore the complete effects of exalted Venus in Vedic astrology.',
    overview: 'Venus reaches its highest dignity in Pisces at 27°, expressing unconditional love, divine beauty, artistic genius and spiritual refinement. This placement elevates all forms of creative expression and blesses relationships with depth, tenderness and transcendent connection. Piscean dissolution merges with Venusian love to create a quality of devotion that transcends personal desire and touches the sacred.',
    keyStrengths: [
      'Extraordinary artistic talent and supreme aesthetic sense',
      'Deep, unconditional love and fulfilling romantic partnerships',
      'Material comfort, luxury and natural financial abundance',
      'Magnetic charm, social grace and universal popularity',
      'Spiritual devotion expressed through beauty and compassion',
      'Gift of healing through art, music and creative expression',
    ],
    careerAreas: 'Fine arts, music, film, fashion, luxury goods, healing arts, spiritual counseling, design and creative industries',
    relationshipTone: 'Romantically devoted, spiritually connected and genuinely compassionate; brings out the best in every partner',
    healthBenefits: 'Balanced reproductive health, glowing complexion, excellent hormonal harmony and natural elegance in body',
    spiritualTheme: 'Bhakti yoga, unconditional love, the realisation of divine beauty in all creation and the path of sacred devotion',
    famousPersonalities: 'Beloved artists, celebrated musicians, romantic poets, compassionate healers and spiritual teachers often carry this placement',
    keywords: ['exalted venus', 'shukra uccha', 'venus in pisces', 'exalted venus effects', 'strong venus vedic astrology', 'uccha shukra'],
  },
  {
    planet: 'Saturn',
    planetSanskrit: 'Shani',
    glyph: '🔵',
    exaltationSign: 'Libra',
    exaltationDegree: '20°',
    slug: 'exalted-saturn',
    title: 'Exalted Saturn (Shani Uccha) — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Saturn exalted in Libra at 20° channels discipline and karma into justice, fairness and social wisdom. Discover the full effects of exalted Saturn in Vedic astrology.',
    overview: 'Saturn is exalted in Libra at 20°, where its energy of discipline, karma and structure is balanced by Libran justice, fairness and social wisdom. This placement produces great administrators, judges and social reformers who achieve lasting success through integrity and patient effort. Exalted Saturn rewards righteousness across lifetimes and ensures that disciplined effort eventually produces extraordinary results.',
    keyStrengths: [
      'Exceptional discipline, endurance and patience under pressure',
      'Strong sense of justice, fairness and ethical integrity',
      'Ability to build lasting institutions, systems and legacies',
      'Leadership in public service, governance and social reform',
      'Steady, long-term financial accumulation and asset building',
      'Mastery of karma yoga and the ability to work without reward',
    ],
    careerAreas: 'Law, judiciary, government administration, public policy, social work, politics and institution-building',
    relationshipTone: 'Loyal, responsible and committed; values fairness and long-term stability over fleeting passion; deeply reliable',
    healthBenefits: 'Strong skeletal structure, disciplined healthy habits, excellent longevity and resilience through structured self-care',
    spiritualTheme: 'Karma yoga, selfless service, detachment from results, righteous endurance and the deepening of wisdom through trial',
    famousPersonalities: 'Distinguished judges, respected administrators, dedicated social reformers and disciplined yogis often carry this placement',
    keywords: ['exalted saturn', 'shani uccha', 'saturn in libra', 'exalted saturn effects', 'strong saturn vedic astrology', 'uccha shani'],
  },
  {
    planet: 'Rahu',
    planetSanskrit: 'Rahu',
    glyph: '🌑',
    exaltationSign: 'Gemini',
    exaltationDegree: '20°',
    slug: 'exalted-rahu',
    title: 'Exalted Rahu — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Rahu exalted in Gemini channels intense ambition into communication, technology and innovation. Discover the complete effects of exalted Rahu in Vedic astrology.',
    overview: 'Rahu is considered exalted in Gemini by many classical Vedic schools, channelling its intense desire, intelligence and worldly ambition into communication, technology and intellectual mastery. The native becomes exceptionally innovative, persuasive and successful in mass-scale ventures. Exalted Rahu here produces visionaries who redefine their era through bold, unconventional thinking and extraordinary reach.',
    keyStrengths: [
      'Exceptional intellect, innovation and out-of-the-box thinking',
      'Mastery of communication, media and cutting-edge technology',
      'Magnetic charisma, persuasive power and mass appeal',
      'Success in foreign lands and large-scale international ventures',
      'Ability to navigate complexity, disruption and rapid change',
      'Gift of reaching and influencing enormous audiences',
    ],
    careerAreas: 'Technology, media, politics, international business, research, journalism, mass communication and digital entrepreneurship',
    relationshipTone: 'Unconventional, intensely curious and magnetically attractive; seeks unique, intellectually stimulating connections',
    healthBenefits: 'Sharp mind, strong nervous system and the capacity to adapt rapidly to new environments and challenges',
    spiritualTheme: 'Transcending maya through mastery of the material, karmic burn-off through intense worldly engagement',
    famousPersonalities: 'Tech visionaries, bold politicians, groundbreaking journalists and disruptive innovators often carry this placement',
    keywords: ['exalted rahu', 'rahu uccha', 'rahu in gemini', 'exalted rahu effects', 'strong rahu vedic astrology', 'uccha rahu'],
  },
  {
    planet: 'Ketu',
    planetSanskrit: 'Ketu',
    glyph: '🌒',
    exaltationSign: 'Sagittarius',
    exaltationDegree: '20°',
    slug: 'exalted-ketu',
    title: 'Exalted Ketu — Effects, Traits & Blessings in Vedic Astrology',
    metaDescription: 'Ketu exalted in Sagittarius aligns moksha-seeking detachment with higher wisdom and dharma. Explore the profound effects of exalted Ketu in Vedic astrology.',
    overview: 'Ketu is exalted in Sagittarius per many classical Vedic schools, aligning its moksha-seeking detachment with higher wisdom, dharma and spiritual philosophy. This placement produces deeply intuitive, spiritually evolved individuals with profound wisdom accumulated across multiple lifetimes. The native possesses an innate understanding of metaphysical truths that goes far beyond book learning.',
    keyStrengths: [
      'Extraordinary spiritual insight and natural intuition',
      'Deep wisdom in philosophy, dharma and the path of liberation',
      'Genuine freedom from worldly attachments leading to inner peace',
      'Powerful healing, psychic and mediumistic abilities',
      'Access to hidden knowledge and esoteric spiritual traditions',
      'Teaching and transmitting transformative spiritual wisdom',
    ],
    careerAreas: 'Spiritual teaching, metaphysics, healing, deep research, philosophy, psychology and ashram or retreat work',
    relationshipTone: 'Deeply compassionate yet naturally detached; seeks soul-level connections over surface-level social bonds',
    healthBenefits: 'Strong subtle body, clear aura, immunity strengthened through consistent spiritual practices and inner discipline',
    spiritualTheme: 'Moksha, liberation from the cycle of rebirth, dissolution of ego and the joyful return to the source',
    famousPersonalities: 'Revered saints, gifted spiritual healers, renowned philosophers and pioneering metaphysical researchers often carry this placement',
    keywords: ['exalted ketu', 'ketu uccha', 'ketu in sagittarius', 'exalted ketu effects', 'strong ketu vedic astrology', 'uccha ketu'],
  },
];

// ── House focus context ───────────────────────────────────────────────────────

interface HouseFocus {
  focus: string;
  positive: string;
  bodyArea: string;
}

const HOUSE_FOCUS: Record<number, HouseFocus> = {
  1:  { focus: 'self, physical body and overall personality',       positive: 'charisma, health and radiant self-confidence',              bodyArea: 'head and brain' },
  2:  { focus: 'wealth, family, speech and accumulated resources',  positive: 'prosperity, eloquence and strong family harmony',           bodyArea: 'face, throat and right eye' },
  3:  { focus: 'courage, siblings, short travels and communication',positive: 'bold self-expression and powerful sibling bonds',            bodyArea: 'shoulders, arms and chest' },
  4:  { focus: 'home, mother, land, vehicles and inner peace',      positive: 'domestic bliss, property gains and emotional security',     bodyArea: 'chest, heart and lungs' },
  5:  { focus: 'creativity, children, intelligence and romance',    positive: 'brilliant intellect, joyful creativity and blessed progeny', bodyArea: 'stomach and upper abdomen' },
  6:  { focus: 'service, daily work, health and overcoming enemies', positive: 'victory over all obstacles and excellent physical health',  bodyArea: 'digestive organs and lower abdomen' },
  7:  { focus: 'marriage, partnerships, business and public image', positive: 'harmonious partnerships, fulfilling marriage and public fame', bodyArea: 'kidneys and lower back' },
  8:  { focus: 'transformation, longevity, research and hidden wealth', positive: 'deep insight, long life and mastery of the occult',     bodyArea: 'reproductive organs and excretory system' },
  9:  { focus: 'dharma, fortune, higher wisdom and spiritual grace', positive: 'exceptional luck, deep wisdom and divine protection',      bodyArea: 'hips, thighs and sciatic nerve' },
  10: { focus: 'career, public reputation, authority and legacy',   positive: 'outstanding career success, fame and lasting legacy',      bodyArea: 'knees and skeletal system' },
  11: { focus: 'gains, social network, elder siblings and wishes',  positive: 'fulfilled ambitions, wealthy social circle and abundance',  bodyArea: 'calves, ankles and circulatory system' },
  12: { focus: 'spirituality, foreign lands, expenses and moksha',  positive: 'spiritual liberation, charitable nature and peaceful retreat', bodyArea: 'feet and lymphatic system' },
};

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getWeekday(planet: string): string {
  const days: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday',
  };
  return days[planet] || 'Sunday';
}

function buildExaltedPlanetHouseData(): ExaltedPlanetHouseData[] {
  const result: ExaltedPlanetHouseData[] = [];

  EXALTED_PLANETS_META.forEach(pm => {
    for (let h = 1; h <= 12; h++) {
      const hf = HOUSE_FOCUS[h];
      const ordinal = getOrdinal(h);
      const slug = `exalted-${pm.planet.toLowerCase()}-${ordinal}-house`;

      result.push({
        planet: pm.planet,
        planetSanskrit: pm.planetSanskrit,
        house: h,
        slug,
        title: `Exalted ${pm.planet} in the ${ordinal} House — Vedic Astrology Effects & Results`,
        metaDescription: `Exalted ${pm.planet} (${pm.planetSanskrit} Uccha) in the ${ordinal} house powerfully illuminates ${hf.focus}. Discover its complete effects on career, relationships, health and spiritual life.`,
        summary: `An exalted ${pm.planet} (${pm.planetSanskrit} Uccha) placed in the ${ordinal} house powerfully illuminates the domain of ${hf.focus}. Its maximum dignity amplifies ${hf.positive} — all channelled through the refined, graceful energy of an exalted ${pm.planet}.`,
        generalEffects: [
          `The exalted ${pm.planet} casts its fullest, most beneficial rays upon the ${ordinal} house, energising all matters of ${hf.focus} at peak strength.`,
          `Natives typically experience extraordinary ${hf.positive} especially during ${pm.planet}'s Mahadasha, Antardasha and favourable transits.`,
          `${pm.planet}'s core strengths — ${pm.keyStrengths[0].toLowerCase()} and ${pm.keyStrengths[1].toLowerCase()} — manifest most prominently through the themes of this house.`,
          `Beneficial planetary aspects on this exalted ${pm.planet} further amplify results, while malefic aspects may introduce specific, manageable challenges.`,
          `The ${ordinal} house body part (${hf.bodyArea}) receives protective and strengthening energy from this exalted placement.`,
        ],
        career: `The ${ordinal} house themes of ${hf.focus} blend powerfully with ${pm.planet}'s exalted strength to propel success in ${pm.careerAreas}. Career achievements in areas related to the ${ordinal} house are especially pronounced during ${pm.planet}'s Dasha periods.`,
        relationships: `${pm.relationshipTone} The exalted dignity ensures these qualities operate at their absolute highest level, directly and positively affecting the relationship themes governed by the ${ordinal} house.`,
        health: `${pm.healthBenefits} The ${ordinal} house body areas (${hf.bodyArea}) receive exceptional protective and vitalising energy from this exalted position, reducing vulnerability to illness in these areas.`,
        spiritual: `${pm.spiritualTheme} The specific domain of ${hf.focus} governed by the ${ordinal} house becomes a powerful gateway for ${pm.planet}'s highest spiritual expression and liberation.`,
        remedies: [
          `Honour ${pm.planetSanskrit} on ${getWeekday(pm.planet)} through a simple sunrise ritual of lighting a lamp and expressing gratitude.`,
          `Chant the Beeja mantra of ${pm.planetSanskrit} 108 times daily — this amplifies and sustains the exaltation energy in your life.`,
          `Donate items associated with ${pm.planet} to those in genuine need, as an act of gratitude for this powerful gift.`,
          `Wear the primary gemstone of ${pm.planet} in the appropriate metal on the correct finger, after consulting a qualified Jyotishi.`,
          `Practise the spiritual discipline associated with ${pm.planet} (${pm.spiritualTheme.split(',')[0].toLowerCase()}) to fully embody this placement's highest blessings.`,
        ],
        keywords: [
          `exalted ${pm.planet.toLowerCase()} in ${ordinal} house`,
          `${pm.planetSanskrit.toLowerCase()} uccha ${ordinal} house`,
          `exalted ${pm.planet.toLowerCase()} ${h}th house vedic astrology`,
          `uccha ${pm.planetSanskrit.toLowerCase()} house ${h}`,
          ...pm.keywords.slice(0, 2),
        ],
      });
    }
  });

  return result;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const EXALTED_PLANET_DATA: ExaltedPlanetData[] = EXALTED_PLANETS_META;
export const EXALTED_PLANET_HOUSE_DATA: ExaltedPlanetHouseData[] = buildExaltedPlanetHouseData();

export function getExaltedPlanetBySlug(slug: string): ExaltedPlanetData | undefined {
  return EXALTED_PLANET_DATA.find(p => p.slug === slug);
}

export function getExaltedPlanetHouseBySlug(slug: string): ExaltedPlanetHouseData | undefined {
  return EXALTED_PLANET_HOUSE_DATA.find(p => p.slug === slug);
}

export function getExaltedPlanetHousesByPlanet(planet: string): ExaltedPlanetHouseData[] {
  return EXALTED_PLANET_HOUSE_DATA.filter(p => p.planet === planet);
}
