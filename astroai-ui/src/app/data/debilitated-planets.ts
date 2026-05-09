// ──────────────────────────────────────────────────────────────────────────────
// Debilitated Planets Data — Vedic Astrology Static Content
// Covers all 9 planets × overview + 12 houses = 9 + 108 pages
// ──────────────────────────────────────────────────────────────────────────────

export interface DebilitatedPlanetData {
  planet: string;
  planetSanskrit: string;
  glyph: string;
  debilitationSign: string;
  debilitationDegree: string;
  slug: string;
  title: string;
  metaDescription: string;
  overview: string;
  challenges: string[];
  cancellationYogas: string[];
  neechabhangaExplanation: string;
  careerChallenges: string;
  relationshipChallenges: string;
  healthChallenges: string;
  spiritualLesson: string;
  remedies: string[];
  keywords: string[];
}

export interface DebilitatedPlanetHouseData {
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
  neechabhangaYogas: string[];
  keywords: string[];
}

// ── Planet meta ───────────────────────────────────────────────────────────────

const DEBILITATED_PLANETS_META: DebilitatedPlanetData[] = [
  {
    planet: 'Sun',
    planetSanskrit: 'Surya',
    glyph: '☀️',
    debilitationSign: 'Libra',
    debilitationDegree: '10°',
    slug: 'debilitated-sun',
    title: 'Debilitated Sun (Surya Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'The Sun debilitated in Libra at 10° weakens authority and self-confidence. Learn the challenges, powerful Neechabhanga yogas and effective remedies for debilitated Sun in Vedic astrology.',
    overview: 'When the Sun is placed in Libra at 10° — its sign of debilitation — its natural authority, vitality and sense of self become subdued. The native may struggle with self-confidence, father relationships and finding their authentic identity in society. However, Neechabhanga yoga (cancellation of debilitation) can transform these very challenges into extraordinary strengths, producing individuals who rise to authority through genuine humility and earned respect.',
    challenges: [
      'Low self-confidence, self-doubt and difficulty asserting authority',
      'Difficult or distant relationship with father or authority figures',
      'Struggles in government-related matters and official recognition',
      'Health vulnerabilities related to heart, eyes or immune system',
      'Tendency to seek excessive external validation and approval',
      'Conflict between personal identity and social obligations',
    ],
    cancellationYogas: [
      'Lord of Libra (Venus) is placed in a Kendra (1st, 4th, 7th, 10th) or Trikona (1st, 5th, 9th) from Lagna or Moon',
      'Sun\'s exaltation lord Mars is in a Kendra from Lagna',
      'Venus is placed in its own sign (Taurus or Libra) or exaltation (Pisces)',
      'A strong, beneficial planet aspects the debilitated Sun directly',
      'Sun is conjunct with or aspected by Jupiter or Venus',
    ],
    neechabhangaExplanation: 'When Neechabhanga yoga is present, the debilitated Sun\'s energy is reversed — the native who once struggled with authority often rises to positions of extraordinary power and influence through a unique path of humility, service and earned respect rather than inherited privilege.',
    careerChallenges: 'Difficulty in leadership roles, government jobs and gaining recognition; may face conflicts with authority figures; career advancement tends to be slow unless Neechabhanga is active',
    relationshipChallenges: 'Father-son tensions, difficulty asserting needs in partnerships, tendency to compromise too much in search of balance and approval',
    healthChallenges: 'Weak immunity, heart-related vulnerabilities, eye strain or poor eyesight, low vitality and energy depletion if Sun is unassisted by benefics',
    spiritualLesson: 'Deep humility, surrendering ego to divine will, finding true self-worth beyond external recognition and embodying the light of service',
    remedies: [
      'Offer water to the Sun (Surya Arghya) every morning at sunrise facing east — this is the most powerful remedy',
      'Chant Aditya Hridayam or Om Hraam Hreem Hraum Sah Suryaya Namah 108 times daily',
      'Donate wheat, jaggery, copper or red items on Sundays to deserving people',
      'Wear a ruby (Manikya) in gold on the ring finger of the right hand — only after thorough astrological consultation',
      'Strengthen Venus (lord of Libra) through its remedies to activate Neechabhanga yoga',
      'Visit a Surya or Vishnu temple on Sundays and serve with devotion',
    ],
    keywords: ['debilitated sun', 'surya neecha', 'sun in libra', 'neecha sun effects', 'weak sun vedic astrology', 'neechabhanga sun', 'sun debilitation remedies'],
  },
  {
    planet: 'Moon',
    planetSanskrit: 'Chandra',
    glyph: '🌕',
    debilitationSign: 'Scorpio',
    debilitationDegree: '3°',
    slug: 'debilitated-moon',
    title: 'Debilitated Moon (Chandra Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Moon debilitated in Scorpio at 3° creates emotional turbulence and deep psychological intensity. Discover challenges, Neechabhanga yogas and remedies for debilitated Moon.',
    overview: 'The Moon loses its nurturing stability in Scorpio at 3°, the sign of transformation and hidden depths. Emotional turbulence, psychological intensity, deep-seated fears and complex mother relationships are common themes. Yet with proper remedies and understanding, this placement can evolve into extraordinary emotional intelligence and transformative healing power that few others possess.',
    challenges: [
      'Emotional instability, intense mood swings and chronic anxiety',
      'Complex, difficult or traumatic relationship with mother or maternal figures',
      'Deep-seated psychological fears, insecurities and hidden wounds',
      'Tendency towards obsessive, suspicious or destructive thought patterns',
      'Sleep disturbances, hormonal imbalances and digestive sensitivity',
      'Difficulty trusting others and tendency towards emotional isolation',
    ],
    cancellationYogas: [
      'Lord of Scorpio (Mars) is placed in a Kendra or Trikona from Lagna or Moon',
      'Moon\'s exaltation sign lord (Venus) is strong, well-placed or in own sign',
      'Jupiter aspects the debilitated Moon directly with its benefic gaze',
      'Mars is placed in its own sign (Aries or Scorpio) or exaltation (Capricorn)',
      'Moon receives aspect of both Venus and Jupiter simultaneously',
    ],
    neechabhangaExplanation: 'Neechabhanga Moon can produce individuals of extraordinary emotional depth and psychological insight — therapists, healers, investigators and transformational leaders who understand the darkest corners of the human psyche precisely because they have navigated them personally.',
    careerChallenges: 'Emotional reactivity at work, difficulty in public-facing or nurturing roles, trust issues with colleagues and vulnerability to moody decision-making',
    relationshipChallenges: 'Emotional intensity creating turbulence in relationships, fear of abandonment, difficulty with vulnerability and cyclical emotional conflicts',
    healthChallenges: 'Mental health conditions, hormonal imbalances, digestive disorders, poor sleep quality and susceptibility to water-borne or reproductive health issues',
    spiritualLesson: 'Profound transformation through emotional surrender, healing deep ancestral wounds and developing true, unconditional compassion from personal experience of suffering',
    remedies: [
      'Chant Om Shraam Shreem Shraum Sah Chandramasay Namah 108 times on Mondays',
      'Fast on Mondays and offer milk to a Shiva lingam with white flowers',
      'Donate white items — rice, white cloth, milk, silver — on Mondays',
      'Wear a natural pearl (Moti) in silver on the little finger of the right hand after consulting a Jyotishi',
      'Practise meditation, emotional healing and mindfulness practices regularly',
      'Strengthen Mars (Scorpio lord) through disciplined physical activity and courage',
    ],
    keywords: ['debilitated moon', 'chandra neecha', 'moon in scorpio', 'neecha moon effects', 'weak moon vedic astrology', 'neechabhanga moon', 'moon debilitation remedies'],
  },
  {
    planet: 'Mars',
    planetSanskrit: 'Mangal',
    glyph: '🔴',
    debilitationSign: 'Cancer',
    debilitationDegree: '28°',
    slug: 'debilitated-mars',
    title: 'Debilitated Mars (Mangal Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Mars debilitated in Cancer at 28° weakens assertiveness and physical energy. Learn the challenges, Neechabhanga yogas and remedies for debilitated Mars in Vedic astrology.',
    overview: 'Mars is debilitated in Cancer at 28°, where its fiery, decisive energy is dampened by Cancerian emotional sensitivity and fluctuation. The native may struggle with assertiveness, direct confrontation and sustained physical energy. However, this placement can produce deeply empathetic warriors and emotionally intelligent leaders when Neechabhanga yoga operates — combining courage with compassion uniquely.',
    challenges: [
      'Lack of direct assertiveness and difficulty making decisive, rapid action',
      'Emotional reactivity replacing constructive courage and strategic thinking',
      'Low or inconsistent physical stamina and chronic energy depletion',
      'Conflicts arising around property, land, mother and domestic life',
      'Difficulty completing ambitious projects and sustaining long-term motivation',
      'Passive-aggressive expressions of anger rather than direct confrontation',
    ],
    cancellationYogas: [
      'Lord of Cancer (Moon) is placed in a Kendra or Trikona from Lagna or Moon',
      'Mars\' exaltation lord Saturn is strong, in Kendra or in its own sign',
      'Jupiter aspects the debilitated Mars in Cancer with its benefic gaze',
      'Moon is placed in its own sign (Cancer) or exaltation (Taurus)',
      'Mars is in close association with a strong benefic planet',
    ],
    neechabhangaExplanation: 'Neechabhanga Mars in Cancer produces the nurturing warrior — individuals who combine emotional intelligence with physical courage, making them exceptional in healing arts, social work, family law and compassionate leadership.',
    careerChallenges: 'Hesitation in leadership positions, delayed action in competitive environments and difficulty sustaining energy in goal-oriented careers',
    relationshipChallenges: 'Passive-aggressive tendencies, emotional neediness in relationships and difficulty expressing anger or boundaries healthily',
    healthChallenges: 'Blood disorders, anaemia, low haemoglobin, digestive weakness, muscular fatigue and inconsistent physical energy',
    spiritualLesson: 'Transforming raw aggression into compassionate strength, discovering true courage through emotional wisdom and vulnerability',
    remedies: [
      'Chant Mangal mantra: Om Kraam Kreem Kraum Sah Bhoumaya Namah 108 times on Tuesdays',
      'Donate red lentils, copper items, red flowers or red clothes on Tuesdays',
      'Visit a Hanuman or Kartikeya temple on Tuesdays and offer red flowers',
      'Wear a red coral (Moonga) in gold or copper on the ring finger after consulting a Jyotishi',
      'Strengthen the Moon (Cancer lord) through its remedies to activate Neechabhanga',
      'Engage in regular disciplined physical exercise to build and channel Martian energy',
    ],
    keywords: ['debilitated mars', 'mangal neecha', 'mars in cancer', 'neecha mars effects', 'weak mars vedic astrology', 'neechabhanga mars', 'mars debilitation remedies'],
  },
  {
    planet: 'Mercury',
    planetSanskrit: 'Budha',
    glyph: '💚',
    debilitationSign: 'Pisces',
    debilitationDegree: '15°',
    slug: 'debilitated-mercury',
    title: 'Debilitated Mercury (Budha Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Mercury debilitated in Pisces at 15° scatters logical thinking and practical reasoning. Learn challenges, Neechabhanga yogas and remedies for debilitated Mercury.',
    overview: 'Mercury loses its analytical precision in Pisces at 15°, where the boundless, intuitive Piscean energy dissolves logical structure. The native may struggle with clarity of thought, communication and practical reasoning. Yet this placement often produces visionary artists, intuitive healers and spiritual communicators of rare depth who access wisdom beyond the analytical mind.',
    challenges: [
      'Scattered thinking, mental fog and difficulty with sustained logical analysis',
      'Frequent communication misunderstandings and unclear or vague expression',
      'Challenges in business, commerce, accounting and financial management',
      'Learning difficulties, inability to focus and poor study habits',
      'Over-idealism and magical thinking replacing practical, grounded reasoning',
      'Forgetfulness and difficulty with contracts, details and deadlines',
    ],
    cancellationYogas: [
      'Lord of Pisces (Jupiter) is placed in a Kendra or Trikona from Lagna or Moon',
      'Jupiter is placed in its own signs (Sagittarius or Pisces) or exaltation (Cancer)',
      'Venus is strongly placed in a Kendra and aspects or conjuncts Mercury',
      'Mercury receives the benefic aspect of Jupiter or Venus from a strong sign',
      'Jupiter is conjunct or closely aspecting the debilitated Mercury',
    ],
    neechabhangaExplanation: 'Neechabhanga Mercury in Pisces produces inspired communicators, visionary poets, spiritual writers and intuitive teachers who convey profound truths that the purely logical mind can never reach — their power lies precisely in transcending ordinary Mercury.',
    careerChallenges: 'Difficulty in detail-oriented roles, data analysis, accounting, structured communication and deadline management',
    relationshipChallenges: 'Communication gaps, frequent misunderstandings, difficulty expressing personal needs and emotional vagueness',
    healthChallenges: 'Nervous system sensitivity, skin conditions, speech impediments, respiratory issues and mental fogginess',
    spiritualLesson: 'Transcending the rational mind, developing intuitive and divine intelligence, communicating from the heart rather than the intellect alone',
    remedies: [
      'Chant Om Braam Breem Braum Sah Budhaya Namah 108 times on Wednesdays',
      'Donate green items — green lentils, green vegetables, books — on Wednesdays',
      'Feed green grass to cows on Wednesdays and serve students',
      'Wear a natural emerald (Panna) in gold on the little finger after thorough consultation',
      'Strengthen Jupiter (Pisces lord) through its remedies to activate Neechabhanga',
      'Practise journaling and mindful writing to develop clarity of expression',
    ],
    keywords: ['debilitated mercury', 'budha neecha', 'mercury in pisces', 'neecha mercury effects', 'weak mercury vedic astrology', 'neechabhanga mercury', 'mercury debilitation'],
  },
  {
    planet: 'Jupiter',
    planetSanskrit: 'Guru',
    glyph: '🟡',
    debilitationSign: 'Capricorn',
    debilitationDegree: '5°',
    slug: 'debilitated-jupiter',
    title: 'Debilitated Jupiter (Guru Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Jupiter debilitated in Capricorn at 5° constrains wisdom and reduces fortune. Discover challenges, Neechabhanga yogas and remedies for debilitated Jupiter in Vedic astrology.',
    overview: 'Jupiter is debilitated in Capricorn at 5°, where its expansive, philosophical nature is constrained by Saturnian structure, materialism and limitation. The native may struggle with wisdom, ethical judgment, children, finances and spiritual connection. Neechabhanga can produce highly disciplined yet deeply wise individuals who earn their wisdom through hard experience rather than inherited grace.',
    challenges: [
      'Reduced wisdom, clouded judgment and occasional ethical lapses',
      'Financial difficulties, missed opportunities and reduced prosperity',
      'Challenges with children, students, disciples and younger generations',
      'Weakened spiritual faith, sense of purpose and dharmic direction',
      'Difficult or absent relationships with teachers, mentors and gurus',
      'Tendency toward excessive materialism at the expense of higher values',
    ],
    cancellationYogas: [
      'Lord of Capricorn (Saturn) is placed in a Kendra or Trikona from Lagna or Moon',
      'Saturn is in its own sign (Capricorn or Aquarius) or exaltation (Libra)',
      'A benefic planet is placed in Kendra from Jupiter and aspects it',
      'Jupiter is aspected by Venus or receives association of Mercury in good strength',
      'Jupiter is in the Navamsa of its own or exalted sign',
    ],
    neechabhangaExplanation: 'Neechabhanga Jupiter in Capricorn creates individuals who earn wisdom through the school of hard knocks — their practical, disciplined approach to knowledge and dharma makes them uniquely effective teachers, advisors and leaders who understand real-world constraints.',
    careerChallenges: 'Ethical compromises under pressure, poor financial decisions, strained relationships with superiors and difficulty receiving recognition for wisdom',
    relationshipChallenges: 'Difficulty giving or receiving guidance gracefully, emotional distance in family relationships and over-materialistic approach to partnerships',
    healthChallenges: 'Liver and gallbladder issues, weight management challenges, poor fat metabolism and reduced endocrine vitality',
    spiritualLesson: 'Finding wisdom through limitation and failure, earning divine grace through disciplined righteous action rather than expectation',
    remedies: [
      'Chant Om Graam Greem Graum Sah Gurave Namah 108 times on Thursdays',
      'Donate yellow items — yellow cloth, turmeric, yellow lentils, bananas — on Thursdays',
      'Fast on Thursdays and visit a Vishnu, Jupiter or Brihaspati temple',
      'Wear a natural yellow sapphire (Pukhraj) in gold on the index finger after thorough consultation',
      'Strengthen Saturn (Capricorn lord) through disciplined service, punctuality and righteous hard work',
      'Study sacred scriptures and share knowledge freely as a form of guru-seva',
    ],
    keywords: ['debilitated jupiter', 'guru neecha', 'jupiter in capricorn', 'neecha jupiter effects', 'weak jupiter vedic astrology', 'neechabhanga jupiter', 'jupiter debilitation'],
  },
  {
    planet: 'Venus',
    planetSanskrit: 'Shukra',
    glyph: '⚪',
    debilitationSign: 'Virgo',
    debilitationDegree: '27°',
    slug: 'debilitated-venus',
    title: 'Debilitated Venus (Shukra Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Venus debilitated in Virgo at 27° disrupts harmony, beauty and romance. Learn the challenges, Neechabhanga yogas and remedies for debilitated Venus in Vedic astrology.',
    overview: 'Venus is debilitated in Virgo at 27°, where its desire for beauty, pleasure and harmony is disrupted by Virgoan criticism, perfectionism and analytical coldness. Relationships, creative expression and the enjoyment of life\'s pleasures may be hampered. Yet this placement can produce brilliant analytical artists and dedicated healers who serve selflessly through beauty and refined craft.',
    challenges: [
      'Difficulty forming and sustaining romantic relationships and marriages',
      'Over-critical and perfectionistic attitude suppressing spontaneous joy',
      'Reduced creative expression, blocked artistic flow and aesthetic dissatisfaction',
      'Financial challenges, inability to attract or retain material comforts',
      'Health vulnerabilities related to reproductive organs, kidneys and skin',
      'Tendency to analyse love rather than fully experiencing it',
    ],
    cancellationYogas: [
      'Lord of Virgo (Mercury) is placed in a Kendra or Trikona from Lagna or Moon',
      'Mercury is in its own sign (Gemini or Virgo) or exaltation (Virgo at 15°)',
      'Jupiter aspects the debilitated Venus with its benefic gaze',
      'Venus is conjunct with Mercury or receives Mercury\'s aspect',
      'Venus is in the Navamsa of its own or exalted sign at 27° Virgo',
    ],
    neechabhangaExplanation: 'Neechabhanga Venus in Virgo produces gifted healers, precise artists, devoted servants and analytical counselors who bring extraordinary craftsmanship and dedication to the expression of beauty, love and service.',
    careerChallenges: 'Perfectionism blocking natural creative flow, relationship difficulties in collaborative creative fields, hesitation in performing arts',
    relationshipChallenges: 'Over-criticism of romantic partners, difficulty with physical intimacy and emotional vulnerability, setting impossibly high standards',
    healthChallenges: 'Kidney stress and urinary system vulnerabilities, hormonal imbalances, skin conditions and reproductive health challenges',
    spiritualLesson: 'Pure, unconditional love beyond perfectionism and attachment, serving through beauty and transforming personal desire into selfless devotion',
    remedies: [
      'Chant Om Draam Dreem Draum Sah Shukraya Namah 108 times on Fridays',
      'Donate white items — white cloth, rice, sugar, white flowers — on Fridays',
      'Wear a natural diamond or white sapphire (Heera/Safed Pukhraj) after thorough consultation',
      'Strengthen Mercury (Virgo lord) through its remedies to activate Neechabhanga',
      'Practise acts of beauty as devotional service — flower offering, artistic creation, music',
      'Cultivate gratitude for beauty in daily life to awaken Venus\'s higher vibration',
    ],
    keywords: ['debilitated venus', 'shukra neecha', 'venus in virgo', 'neecha venus effects', 'weak venus vedic astrology', 'neechabhanga venus', 'venus debilitation remedies'],
  },
  {
    planet: 'Saturn',
    planetSanskrit: 'Shani',
    glyph: '🔵',
    debilitationSign: 'Aries',
    debilitationDegree: '20°',
    slug: 'debilitated-saturn',
    title: 'Debilitated Saturn (Shani Neecha) — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Saturn debilitated in Aries at 20° creates impatience, karmic debts and sudden reversals. Learn the challenges, Neechabhanga yogas and remedies for debilitated Saturn.',
    overview: 'Saturn is debilitated in Aries at 20°, where its slow, methodical energy clashes with Aries\' impulsive, fiery nature. The native may struggle with patience, long-term discipline, karmic accountability and consistent planning. With Neechabhanga, this produces dynamic, energetic reformers who break old limiting structures to build vibrant new ones with unusual speed and decisiveness.',
    challenges: [
      'Impatience, rashness and chronically poor long-term planning',
      'Accumulated karmic debts, sudden reversals of fortune and instability',
      'Difficult relationships with employees, servants and subordinates',
      'Health vulnerabilities related to bones, joints, teeth and inflammatory conditions',
      'Legal complications, justice delayed and governmental obstacles',
      'Inconsistent discipline making it difficult to sustain structures built',
    ],
    cancellationYogas: [
      'Lord of Aries (Mars) is placed in a Kendra or Trikona from Lagna or Moon',
      'Saturn\'s exaltation lord Venus is strongly placed and aspecting Saturn',
      'Mars is in its own sign (Aries or Scorpio) or exaltation (Capricorn)',
      'Saturn receives the benefic aspect of Jupiter from a powerful position',
      'Mars and Saturn are in mutual reception or benefic exchange',
    ],
    neechabhangaExplanation: 'Neechabhanga Saturn in Aries creates fearless reformers and disciplined pioneers who achieve in a single lifetime what others take many to accomplish, combining Saturn\'s structure with Aries\' speed in a unique and potent blend.',
    careerChallenges: 'Inconsistent work ethic, poor sustained discipline in structured corporate environments and vulnerability to sudden career reversals',
    relationshipChallenges: 'Impatience with partners, difficulty honouring long-term commitments and repeating karmic relationship patterns',
    healthChallenges: 'Bone density issues, joint inflammation (arthritis), dental problems, skin conditions and inflammatory disorders',
    spiritualLesson: 'Mastering patience through inherent urgency, serving selflessly despite impatience, earning grace through disciplined consistent action',
    remedies: [
      'Chant Om Praam Preem Praum Sah Shanaischaraya Namah 108 times on Saturdays',
      'Donate black sesame seeds, blue or black clothing, mustard oil or iron items on Saturdays',
      'Feed crows, serve the elderly, homeless or underprivileged on Saturdays',
      'Wear a blue sapphire (Neelam) in silver — ONLY after very thorough and careful astrological consultation',
      'Strengthen Mars (Aries lord) through physical discipline, courage and righteous action',
      'Practise long-term planning exercises and keep consistent daily routines',
    ],
    keywords: ['debilitated saturn', 'shani neecha', 'saturn in aries', 'neecha saturn effects', 'weak saturn vedic astrology', 'neechabhanga saturn', 'saturn debilitation remedies'],
  },
  {
    planet: 'Rahu',
    planetSanskrit: 'Rahu',
    glyph: '🌑',
    debilitationSign: 'Sagittarius',
    debilitationDegree: '20°',
    slug: 'debilitated-rahu',
    title: 'Debilitated Rahu — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Rahu debilitated in Sagittarius creates confusion around dharma and misguided ambitions. Discover the challenges, Neechabhanga yogas and remedies for debilitated Rahu.',
    overview: 'Rahu is considered debilitated in Sagittarius by many classical Vedic schools, where its materialistic and deceptive tendencies conflict with Sagittarius\' dharmic, philosophical nature. The native may struggle with false beliefs, misplaced ambitions, misleading teachers and confusion about higher values. With proper awareness and remedies, this evolves into genuine, deeply tested dharmic seeking and earned wisdom.',
    challenges: [
      'Deep confusion between true dharma and false or misleading ideologies',
      'Attraction to deceptive or misguided spiritual teachers and philosophies',
      'Over-ambitious worldly pursuits without a solid ethical foundation',
      'Problematic issues with foreign travel, higher education and institutional learning',
      'Self-deception about spiritual progress, beliefs and life purpose',
      'Tendency to follow unorthodox paths that create social complications',
    ],
    cancellationYogas: [
      'Lord of Sagittarius (Jupiter) is strongly placed in a Kendra from Lagna',
      'Jupiter is in its own sign (Sagittarius or Pisces) or exaltation (Cancer)',
      'Rahu is in close association with benefic planets Jupiter or Venus',
      'A strongly placed Jupiter directly aspects the debilitated Rahu',
      'Jupiter is in mutual exchange or close friendship with the Lagna lord',
    ],
    neechabhangaExplanation: 'Neechabhanga Rahu in Sagittarius produces genuine seekers who, after traversing false paths, discover and embody authentic dharma with a depth and conviction that purely comfortable believers rarely achieve.',
    careerChallenges: 'Risk of associating with misleading authority figures, confused career goals built on unethical foundations',
    relationshipChallenges: 'Deception and misrepresentation in relationships, seeking partners for spiritually misaligned reasons',
    healthChallenges: 'Hip and thigh vulnerabilities, toxic accumulation in the body, respiratory challenges and neurological sensitivity',
    spiritualLesson: 'Surrendering all false beliefs and illusions to discover genuine dharma through honest, sometimes painful, self-inquiry',
    remedies: [
      'Chant Om Bhraam Bhreem Bhraum Sah Rahave Namah 108 times on Saturdays',
      'Donate black sesame, dark-coloured lentils, blue items and coconuts on Saturdays',
      'Seek guidance exclusively from a verified, genuine spiritual teacher or guru',
      'Wear hessonite garnet (Gomed) in silver — only after very thorough astrological consultation',
      'Strengthen Jupiter significantly to activate Neechabhanga yoga',
      'Study authentic scriptures and spiritual texts under qualified, verified guidance',
    ],
    keywords: ['debilitated rahu', 'rahu neecha', 'rahu in sagittarius', 'neecha rahu effects', 'weak rahu vedic astrology', 'neechabhanga rahu', 'rahu debilitation'],
  },
  {
    planet: 'Ketu',
    planetSanskrit: 'Ketu',
    glyph: '🌒',
    debilitationSign: 'Gemini',
    debilitationDegree: '20°',
    slug: 'debilitated-ketu',
    title: 'Debilitated Ketu — Challenges, Remedies & Neechabhanga in Vedic Astrology',
    metaDescription: 'Ketu debilitated in Gemini creates mental confusion and fragmented spirituality. Discover the challenges, Neechabhanga yogas and remedies for debilitated Ketu.',
    overview: 'Ketu is debilitated in Gemini by many classical Vedic schools, where its moksha-seeking dissolution is disrupted by Gemini\'s worldly intellect and scattered communicative activity. The native may experience mental confusion, fragmented spiritual practice and difficulty integrating past-life wisdom into present-life communication. With remedies, this evolves into the ability to express profound spiritual truths through ordinary language.',
    challenges: [
      'Mental confusion, restlessness and inability to find sustained inner stillness',
      'Fragmented, inconsistent spiritual practice with insufficient depth or commitment',
      'Significant difficulty with communication and expressing inner knowing clearly',
      'Scattered, unreliable intuition and inconsistent psychic impressions',
      'Painful conflicts between intellectual conceptual knowing and direct spiritual realisation',
      'Tendency to change spiritual paths frequently without achieving mastery in any',
    ],
    cancellationYogas: [
      'Lord of Gemini (Mercury) is strongly placed in a Kendra from Lagna',
      'Mercury is in its own sign (Gemini or Virgo) or exaltation (Virgo at 15°)',
      'Jupiter aspects the debilitated Ketu directly with its benefic, expansive gaze',
      'Ketu is in conjunction with benefic planets in Gemini',
      'A strong Mercury in a good house aspects or conjuncts Ketu',
    ],
    neechabhangaExplanation: 'Neechabhanga Ketu in Gemini produces gifted spiritual communicators who uniquely bridge the gap between esoteric inner wisdom and everyday language, making them valuable teachers, writers and guides.',
    careerChallenges: 'Difficulty sustaining focus in communication-based careers, scattered professional identity and inability to commit to a single specialisation',
    relationshipChallenges: 'Emotional unavailability, excessive detachment at inopportune moments and difficulty achieving genuine spiritual intimacy with partners',
    healthChallenges: 'Nervous system hypersensitivity, respiratory conditions, skin issues and mental restlessness leading to burnout',
    spiritualLesson: 'Integrating spiritual depth with ordinary worldly communication, learning to embody and transmit wisdom through clear, accessible expression',
    remedies: [
      'Chant Om Sraam Sreem Sraum Sah Ketave Namah 108 times on Tuesdays',
      'Donate multi-coloured items, sesame seeds and blankets on Tuesdays',
      'Worship Lord Ganesha regularly to calm Ketu\'s scattered and disruptive energy',
      'Wear cat\'s eye (Lahsuniya) in silver — only after very thorough astrological consultation',
      'Strengthen Mercury significantly to activate Neechabhanga yoga',
      'Practise a single, consistent meditation technique daily without changing it frequently',
    ],
    keywords: ['debilitated ketu', 'ketu neecha', 'ketu in gemini', 'neecha ketu effects', 'weak ketu vedic astrology', 'neechabhanga ketu', 'ketu debilitation'],
  },
];

// ── House focus context ───────────────────────────────────────────────────────

const HOUSE_FOCUS: Record<number, { focus: string; bodyArea: string }> = {
  1:  { focus: 'self, physical body and overall personality',           bodyArea: 'head and brain' },
  2:  { focus: 'wealth, family, speech and accumulated resources',      bodyArea: 'face, throat and right eye' },
  3:  { focus: 'courage, siblings, short travels and communication',    bodyArea: 'shoulders, arms and chest' },
  4:  { focus: 'home, mother, land, vehicles and inner peace',          bodyArea: 'chest, heart and lungs' },
  5:  { focus: 'creativity, children, intelligence and romance',        bodyArea: 'stomach and upper abdomen' },
  6:  { focus: 'service, daily work, health and overcoming enemies',    bodyArea: 'digestive organs and lower abdomen' },
  7:  { focus: 'marriage, partnerships, business and public image',     bodyArea: 'kidneys and lower back' },
  8:  { focus: 'transformation, longevity, research and hidden wealth', bodyArea: 'reproductive organs and excretory system' },
  9:  { focus: 'dharma, fortune, higher wisdom and spiritual grace',    bodyArea: 'hips, thighs and sciatic nerve' },
  10: { focus: 'career, public reputation, authority and legacy',       bodyArea: 'knees and skeletal structure' },
  11: { focus: 'gains, social network, elder siblings and wishes',      bodyArea: 'calves, ankles and circulatory system' },
  12: { focus: 'spirituality, foreign lands, expenses and moksha',      bodyArea: 'feet and lymphatic system' },
};

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildDebilitatedPlanetHouseData(): DebilitatedPlanetHouseData[] {
  const result: DebilitatedPlanetHouseData[] = [];

  DEBILITATED_PLANETS_META.forEach(pm => {
    for (let h = 1; h <= 12; h++) {
      const hf = HOUSE_FOCUS[h];
      const ordinal = getOrdinal(h);
      const slug = `debilitated-${pm.planet.toLowerCase()}-${ordinal}-house`;

      result.push({
        planet: pm.planet,
        planetSanskrit: pm.planetSanskrit,
        house: h,
        slug,
        title: `Debilitated ${pm.planet} in the ${ordinal} House — Vedic Astrology Effects & Remedies`,
        metaDescription: `Debilitated ${pm.planet} (${pm.planetSanskrit} Neecha) in the ${ordinal} house introduces challenges to ${hf.focus}. Learn the effects, Neechabhanga yogas and powerful remedies.`,
        summary: `A debilitated ${pm.planet} (${pm.planetSanskrit} Neecha) placed in the ${ordinal} house introduces specific challenges in the domain of ${hf.focus}. Understanding these karmic patterns and applying targeted remedies — especially activating Neechabhanga yoga — can transform these difficulties into remarkable and lasting strengths.`,
        generalEffects: [
          `The weakened ${pm.planet} casts a challenged influence upon the ${ordinal} house, affecting all matters of ${hf.focus} — these effects are most pronounced during ${pm.planet}'s Dasha periods.`,
          `The core challenges — ${pm.challenges[0].toLowerCase()} and ${pm.challenges[1].toLowerCase()} — manifest most intensely through the themes of this specific house.`,
          `Neechabhanga yoga can fully reverse these effects when the right planetary conditions exist — specifically when ${pm.cancellationYogas[0].toLowerCase()}.`,
          `The body areas governed by the ${ordinal} house (${hf.bodyArea}) may experience additional vulnerability under this placement without proper remedies.`,
          `Dedicated remedies performed during ${pm.planet}'s Dasha are especially effective and can dramatically shift the quality of this placement's expression.`,
        ],
        career: `${pm.careerChallenges} In the context of the ${ordinal} house (${hf.focus}), ethical conduct, disciplined application and conscious self-development can substantially mitigate career challenges over time.`,
        relationships: `${pm.relationshipChallenges} The ${ordinal} house themes of ${hf.focus} intensify these relational dynamics, making conscious healing work in this area both necessary and highly rewarding.`,
        health: `${pm.healthChallenges} The body areas specifically governed by the ${ordinal} house (${hf.bodyArea}) may experience heightened vulnerability, requiring proactive preventive care and lifestyle attention.`,
        spiritual: `${pm.spiritualLesson} The ${ordinal} house arena of ${hf.focus} is precisely where this karmic transformation will unfold with greatest intensity and ultimate meaning.`,
        remedies: pm.remedies,
        neechabhangaYogas: pm.cancellationYogas,
        keywords: [
          `debilitated ${pm.planet.toLowerCase()} in ${ordinal} house`,
          `${pm.planetSanskrit.toLowerCase()} neecha ${ordinal} house`,
          `neecha ${pm.planet.toLowerCase()} ${h}th house vedic astrology`,
          `debilitated ${pm.planet.toLowerCase()} house ${h} effects`,
          ...pm.keywords.slice(0, 2),
        ],
      });
    }
  });

  return result;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const DEBILITATED_PLANET_DATA: DebilitatedPlanetData[] = DEBILITATED_PLANETS_META;
export const DEBILITATED_PLANET_HOUSE_DATA: DebilitatedPlanetHouseData[] = buildDebilitatedPlanetHouseData();

export function getDebilitatedPlanetBySlug(slug: string): DebilitatedPlanetData | undefined {
  return DEBILITATED_PLANET_DATA.find(p => p.slug === slug);
}

export function getDebilitatedPlanetHouseBySlug(slug: string): DebilitatedPlanetHouseData | undefined {
  return DEBILITATED_PLANET_HOUSE_DATA.find(p => p.slug === slug);
}

export function getDebilitatedPlanetHousesByPlanet(planet: string): DebilitatedPlanetHouseData[] {
  return DEBILITATED_PLANET_HOUSE_DATA.filter(p => p.planet === planet);
}
