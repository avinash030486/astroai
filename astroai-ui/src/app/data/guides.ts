export type GuideCategory = 'mahadasha' | 'transit' | 'dosha' | 'fundamentals';

export interface GuideSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideData {
  slug: string;
  title: string;
  subtitle: string;
  category: GuideCategory;
  metaDescription: string;
  keywords: string[];
  readingTime: number; // minutes
  intro: string;
  sections: GuideSection[];
  remedies: string[];
  faqs: GuideFaq[];
  relatedGuides: string[]; // slugs
}

export const GUIDES: GuideData[] = [
  // ── 1. RAHU MAHADASHA ──────────────────────────────────────────────────────
  {
    slug: 'rahu-mahadasha',
    title: 'Rahu Mahadasha: Effects, Duration & Vedic Remedies',
    subtitle: '18 years of ambition, illusion and karmic acceleration — decoded',
    category: 'mahadasha',
    metaDescription:
      'Rahu Mahadasha lasts 18 years and is one of the most intense dasha periods in Vedic astrology. Discover its effects on career, relationships, health and the best remedies to navigate it.',
    keywords: [
      'rahu mahadasha', 'rahu dasha', 'rahu mahadasha effects', 'rahu dasha remedies',
      'rahu antardasha', 'rahu mahadasha career', 'rahu mahadasha marriage',
      'rahu dasha duration', '18 year rahu dasha', 'north node mahadasha',
    ],
    readingTime: 8,
    intro:
      'Rahu Mahadasha — the 18-year reign of the shadow planet Rahu — is widely regarded as the most dramatic dasha period in Vedic astrology. Rahu governs obsession, ambition, foreign lands, technology, illusion and sudden upheaval. When its mahadasha activates, it can catapult you to sudden success or create a labyrinth of confusion and desire — sometimes both at once. Understanding what to expect is the first step to navigating it wisely.',
    sections: [
      {
        heading: 'What Is Rahu Mahadasha?',
        body:
          'In the Vimshottari dasha system — the primary planetary period cycle used in Vedic astrology — Rahu governs an 18-year mahadasha (main period). During Rahu Mahadasha, Rahu\'s themes dominate every area of life: career, relationships, health, spirituality and the subconscious. Rahu is a shadow graha (planet) with no physical body. As the North Node of the Moon, it represents our karmic direction, worldly desires and the areas where we are most driven — and most easily deluded.',
        bullets: [
          'Duration: 18 years (longest dasha after Venus)',
          'Governs: ambition, foreign matters, technology, illusion, mass appeal',
          'Can bring: sudden rise, unconventional success, fame, material gains',
          'Can cause: confusion, deception, over-ambition, health irregularities, spiritual crises',
        ],
      },
      {
        heading: 'Career During Rahu Mahadasha',
        body:
          'Career is often the most visibly transformed area during Rahu Mahadasha. Rahu pushes you toward unconventional paths — technology, media, foreign companies, entrepreneurship or any field where mass influence is possible. Many people experience sudden career leaps, overseas opportunities or a complete reinvention of their professional identity during this period. However, Rahu\'s instability can also invite workplace politics, sudden reversals or pressure to compromise ethics for short-term gain.',
        bullets: [
          'Favourable fields: tech, media, politics, foreign trade, startups, finance',
          'Potential challenges: unethical shortcuts, ambition leading to burnout',
          'Best approach: stay ethical and grounded while embracing unconventional opportunities',
        ],
      },
      {
        heading: 'Relationships During Rahu Mahadasha',
        body:
          'Rahu intensifies desire and can create powerful but unstable romantic connections. Unconventional relationships, cross-cultural partnerships and obsessive attractions are common. Marriages begun during a poorly placed Rahu dasha sometimes face unusual challenges. Family relationships may feel strained as Rahu pulls the native toward external ambitions and personal reinvention. However, a well-placed Rahu can bring a deeply transformative, expansive partnership.',
      },
      {
        heading: 'Health During Rahu Mahadasha',
        body:
          'Rahu governs unusual, mysterious or misdiagnosed illnesses. Health complaints during this period may be difficult to identify — neurological issues, skin conditions, allergies, poisoning or psychosomatic disorders can emerge. Mental health deserves particular attention: anxiety, confusion, paranoia and sleep disturbances are commonly reported. Regular medical check-ups and a disciplined, sattvic lifestyle are among the most practical protective measures.',
      },
      {
        heading: 'Spiritual Life During Rahu Mahadasha',
        body:
          'Rahu can push you deep into materialistic pursuits — or, especially in the second half of the dasha, trigger a profound spiritual awakening. Many individuals pass through a sustained period of maya (illusion) before gradually seeking deeper meaning. Association with genuine spiritual teachers, meditation and consistent mantra practice become increasingly important anchors during this turbulent but transformative period.',
      },
    ],
    remedies: [
      'Chant the Rahu Beej Mantra: "Om Bhram Bhreem Bhraum Sah Rahave Namah" — 108 times daily at sunrise',
      'Worship Goddess Durga or Kali on Saturdays — offer blue flowers and coconut',
      'Donate black sesame seeds, dark blue cloth or mustard oil to those in need on Saturdays',
      'Wear a Hessonite (Gomed) gemstone set in silver — only after consultation with a qualified Vedic astrologer',
      'Keep a simple fast on Saturdays and eat sattvic, vegetarian food',
      'Serve animals and the underprivileged regularly — this directly counters Rahu\'s shadow influence',
      'Meditate daily, especially before sleep, to calm the subconscious turbulence Rahu can create',
    ],
    faqs: [
      { q: 'How long does Rahu Mahadasha last?', a: 'Rahu Mahadasha lasts exactly 18 years in the Vimshottari dasha system.' },
      { q: 'Is Rahu Mahadasha always negative?', a: 'No. A well-placed Rahu can bring tremendous success, fame and material gains. The outcome depends on Rahu\'s sign, house and its aspects in your natal chart.' },
      { q: 'Which antardasha within Rahu Mahadasha is most difficult?', a: 'Rahu-Saturn antardasha is widely considered the most challenging sub-period, marked by delays, responsibility and karmic pressure. Rahu-Sun can also bring tension with authority figures.' },
      { q: 'How do I know if my Rahu Mahadasha has started?', a: 'A qualified Vedic astrologer can calculate your current dasha from your exact birth details. Our birth chart tool and Pandit Arjun can help you identify your current dasha period.' },
    ],
    relatedGuides: ['ketu-mahadasha', 'saturn-mahadasha', 'sade-sati'],
  },

  // ── 2. SADE SATI ───────────────────────────────────────────────────────────
  {
    slug: 'sade-sati',
    title: "Saturn's Sade Sati: The 7.5-Year Transit — Complete Guide",
    subtitle: 'What it is, what to expect, and how to navigate it with grace',
    category: 'transit',
    metaDescription:
      "Saturn's Sade Sati is a 7.5-year transit cycle feared by many. Learn what Sade Sati really means, how it affects your life, and the most effective Vedic remedies to mitigate its challenges.",
    keywords: [
      'sade sati', 'shani sade sati', 'saturn sade sati', 'sade sati effects',
      'sade sati remedies', 'sade sati 2025 2026', 'who has sade sati now',
      'saturn 7.5 years transit', 'saturn moon transit', 'shani dhaiya',
    ],
    readingTime: 9,
    intro:
      "Sade Sati — meaning \"seven and a half\" in Sanskrit — is the 7.5-year period during which Saturn (Shani) transits through the sign just before your Moon sign, your Moon sign itself, and the sign just after it. It is arguably the most discussed and most feared transit in Vedic astrology. Yet many of history's greatest achievers went through their most productive periods during Sade Sati. Understanding it accurately removes the fear — and helps you use the energy wisely.",
    sections: [
      {
        heading: 'What Exactly Is Sade Sati?',
        body:
          'Your Moon sign (Rashi) in Vedic astrology is the sign the Moon occupied at your birth. Saturn takes approximately 2.5 years to transit through each zodiac sign. Sade Sati begins when Saturn enters the sign directly before your Moon sign, passes through your Moon sign (approximately 2.5 years), and ends when Saturn leaves the sign directly after your Moon sign. Total duration: 3 signs × 2.5 years = 7.5 years. Sade Sati repeats every 29–30 years (Saturn\'s full orbital cycle), so most people experience it two to three times in a lifetime.',
        bullets: [
          'Phase 1 (Rising): Saturn in the sign before your Moon sign — preparation, pressure from the background',
          'Phase 2 (Peak): Saturn in your Moon sign — deepest intensity; lessons come home',
          'Phase 3 (Setting): Saturn in the sign after your Moon sign — gradual relief, rebuilding',
        ],
      },
      {
        heading: 'What Does Sade Sati Feel Like?',
        body:
          'The experience varies enormously based on Saturn\'s placement in your natal chart and the dashas running alongside the transit. Common experiences include: increased responsibilities and burdens, delays and obstacles in key goals, health concerns (especially chronic or long-standing issues), financial pressure, relationship strain, and a general sense of life\'s weight pressing down. At its best, Sade Sati strips away what is inauthentic and builds genuine, lasting character.',
      },
      {
        heading: 'Areas of Life Most Affected',
        body:
          'The house where Saturn transits and the houses it rules in your chart determine which life areas feel the most pressure. However, since Saturn transits your Moon sign, mental and emotional well-being are almost always part of the picture. Career, home, family relationships and health also commonly come into focus. Financial matters can tighten, requiring careful management.',
        bullets: [
          'Mental/emotional: anxiety, melancholy, or deep introspection',
          'Career: slower progress, increased workload, or structural changes',
          'Relationships: family strain, separations, or deepening through shared hardship',
          'Finances: budget pressure, unexpected expenses',
        ],
      },
      {
        heading: 'Who Benefits from Sade Sati?',
        body:
          'Those who already embody Saturn\'s virtues — discipline, patience, service, integrity — often find that Sade Sati rewards them with steady, earned success. Saturn is a great judge: it removes what is built on weak foundations and reinforces what is genuine. People with a strong or well-placed natal Saturn, or those in Saturn-friendly dashas, can experience remarkable progress during this period. The key insight is that Sade Sati tests you — it does not simply punish.',
      },
    ],
    remedies: [
      'Visit a Shani temple every Saturday and offer sesame oil (til ka tel) to the Shani deity',
      'Chant the Shani Mantra: "Om Sham Shanicharaya Namah" — 108 times on Saturdays',
      'Donate black sesame seeds, black cloth, iron utensils or mustard oil to the poor on Saturdays',
      'Light a sesame oil lamp (diya) at the base of a peepal tree on Saturdays',
      'Serve the elderly, disabled, laborers and underprivileged — Saturn rewards genuine service',
      'Feed crows every day — crows are associated with Saturn and feeding them is a powerful symbolic remedy',
      'Maintain discipline, regularity and honest conduct — Saturn rewards those who embody its own virtues',
    ],
    faqs: [
      { q: 'How do I know if I am currently in Sade Sati?', a: 'You need to know your Moon sign (Rashi) and then check where Saturn is currently transiting. If Saturn is in the sign before, in, or just after your Moon sign, you are in Sade Sati. Our free birth chart tool can calculate your Moon sign instantly.' },
      { q: 'Is Sade Sati always bad?', a: 'No. For those with a strong Saturn or a well-placed Moon, Sade Sati can bring structured success, important life lessons and long-term rewards. The key is how you respond to Saturn\'s demands for discipline and maturity.' },
      { q: 'Which Moon signs are currently in Sade Sati?', a: 'Saturn\'s position changes every 2.5 years. For the current list, use our birth chart tool or ask Pandit Arjun with your exact birth details for a personalised assessment.' },
      { q: 'Can Sade Sati be completely nullified by remedies?', a: 'Remedies do not eliminate Sade Sati — nothing overrides the law of karma. But genuine remedies, especially service to others and personal discipline, measurably soften the intensity and help you extract the valuable lessons Saturn intends.' },
    ],
    relatedGuides: ['rahu-mahadasha', 'saturn-mahadasha', 'ashtama-shani'],
  },

  // ── 3. KETU MAHADASHA ──────────────────────────────────────────────────────
  {
    slug: 'ketu-mahadasha',
    title: 'Ketu Mahadasha: Spiritual Awakening, Detachment & What to Expect',
    subtitle: '7 years of liberation, loss and profound inner growth',
    category: 'mahadasha',
    metaDescription:
      'Ketu Mahadasha is a 7-year period of spiritual awakening, unexpected losses and deep karmic completion. Learn its effects on career, relationships, health and the most powerful remedies.',
    keywords: [
      'ketu mahadasha', 'ketu dasha', 'ketu mahadasha effects', 'ketu dasha remedies',
      'ketu antardasha', 'south node mahadasha', 'ketu mahadasha spirituality',
      'ketu mahadasha career', '7 year ketu dasha', 'ketu mahadasha marriage',
    ],
    readingTime: 7,
    intro:
      'Ketu Mahadasha — the 7-year period governed by the South Node of the Moon — is often misunderstood as purely destructive. In reality, it is one of the most spiritually significant periods a person can experience. Ketu governs liberation (moksha), past-life karma, renunciation, mysticism and the dissolution of ego-driven desires. Where Rahu grabs and accumulates, Ketu releases and purifies.',
    sections: [
      {
        heading: 'What Is Ketu Mahadasha?',
        body:
          'In the Vimshottari dasha system, Ketu governs a 7-year mahadasha. As a shadow planet (headless node), Ketu is opposite Rahu in your chart and represents the accumulated wisdom and karma of past lives. During Ketu Mahadasha, worldly attachments often feel loosened — sometimes voluntarily, sometimes through loss. The soul is being redirected inward, toward genuine spiritual understanding rather than external achievement.',
        bullets: [
          'Duration: 7 years',
          'Governs: spirituality, moksha, past-life karma, mysticism, renunciation',
          'Can bring: spiritual gifts, psychic sensitivity, liberation from limiting patterns',
          'Can cause: confusion, loss, identity crisis, health issues, sense of disconnection',
        ],
      },
      {
        heading: 'Career and Finances During Ketu Mahadasha',
        body:
          'Ketu does not support conventional worldly ambition. Career progress can slow, opportunities may seem elusive or dissatisfying, and there is often a sense that the goals you have been chasing no longer feel meaningful. However, Ketu strongly favours careers in healing, research, occult sciences, spiritual practice, philosophy and any work involving deep investigation or helping others transform. Financial matters can be unpredictable; savings and conservative financial planning are advised.',
      },
      {
        heading: 'Relationships During Ketu Mahadasha',
        body:
          'Ketu\'s influence on relationships is characterised by detachment. The native may feel emotionally distant from loved ones, or relationships that were built on superficial grounds may dissolve. There can be separations, relocations or the loss of loved ones. The lesson Ketu teaches is the spiritual necessity of non-attachment — not the absence of love, but the releasing of compulsive dependency. Genuinely soul-level connections often deepen during this period.',
      },
      {
        heading: 'Health During Ketu Mahadasha',
        body:
          'Ketu is associated with mysterious, hard-to-diagnose or psychosomatic conditions. It rules the abdomen, nervous system, and is connected to skin conditions and infectious diseases in some traditions. Immune challenges, hidden infections or deep-seated emotional patterns manifesting as physical symptoms are common. Ayurvedic treatment, yoga, pranayama and spiritual practices often support healing far better than conventional approaches alone.',
      },
      {
        heading: 'The Spiritual Dimension of Ketu Mahadasha',
        body:
          'This is where Ketu Mahadasha truly shines. Dreams become more vivid and meaningful. Intuition sharpens. The native may be drawn to meditation, yoga, tantra, Vedanta or other genuine spiritual paths. Experiences of insight, mystical awareness and past-life memories are more accessible. Many of the greatest spiritual teachers and mystics in history had significant Ketu influences. Ketu Mahadasha, when consciously embraced, can be the most transformative and liberating period of a person\'s life.',
      },
    ],
    remedies: [
      'Worship Lord Ganesha — Ketu is closely associated with Ganesha; chant "Om Gam Ganapataye Namah" daily',
      'Chant the Ketu Beej Mantra: "Om Stram Streem Stroom Sah Ketave Namah" — 108 times on Tuesdays',
      'Donate blankets, dark grey or multi-coloured cloth, or sesame seeds on Tuesdays',
      'Feed dogs — Ketu has a special association with dogs in Vedic tradition',
      'Practise meditation, especially Vipassana, Zen or any form of mindfulness that cultivates non-attachment',
      'Avoid intoxicants completely during this period — Ketu amplifies the shadow effects of addictive substances',
      'Serve spiritual organisations, orphanages or animal shelters — genuine selfless service is the most powerful Ketu remedy',
    ],
    faqs: [
      { q: 'Is Ketu Mahadasha always spiritually beneficial?', a: 'The intensity of the spiritual benefit depends on where Ketu is placed in your chart. A well-placed Ketu (especially in Scorpio, Sagittarius or the 12th house) can bring profound gifts. A challenging Ketu requires more deliberate effort to channel its energy constructively.' },
      { q: 'Does Ketu Mahadasha always cause loss?', a: 'Not necessarily. Ketu does loosen attachment to worldly things, but this can feel like freedom rather than loss for those who are spiritually oriented. The "loss" is often of what was inauthentic or no longer serving your true path.' },
      { q: 'Which antardasha within Ketu Mahadasha is most favourable?', a: 'Ketu-Jupiter and Ketu-Venus are generally considered the most supportive sub-periods within the dasha, bringing a mix of spiritual grace (Jupiter) or comfort and creativity (Venus). Ketu-Sun and Ketu-Mars can be more challenging.' },
    ],
    relatedGuides: ['rahu-mahadasha', 'how-to-read-kundli', 'sade-sati'],
  },

  // ── 4. HOW TO READ YOUR KUNDLI ────────────────────────────────────────────
  {
    slug: 'how-to-read-kundli',
    title: 'How to Read Your Vedic Birth Chart (Kundli): A Beginner\'s Guide',
    subtitle: 'Understand your ascendant, planets, houses and signs — step by step',
    category: 'fundamentals',
    metaDescription:
      'Learn how to read a Vedic birth chart (kundli) from scratch. Understand ascendants, houses, planets, signs and dashas with simple explanations — and discover what your chart reveals about you.',
    keywords: [
      'how to read kundli', 'how to read birth chart', 'vedic birth chart explained',
      'kundli reading guide', 'birth chart houses', 'ascendant meaning vedic',
      'what is my lagna', 'how to read horoscope chart', 'rashi chart explained',
      'south indian birth chart', 'north indian birth chart', 'kundali kaise padhe',
    ],
    readingTime: 10,
    intro:
      'Your Vedic birth chart — called a Kundli or Janma Patrika — is a precise astronomical map of the sky at the exact moment and place of your birth. It encodes the positions of the Sun, Moon and eight other planets across twelve zodiac signs and twelve houses of life experience. Reading it is not as complicated as it looks. This guide breaks it down into simple, digestible steps.',
    sections: [
      {
        heading: 'Step 1: Understand the Three Pillars — Lagna, Rashi, Nakshatra',
        body:
          'Every birth chart is built on three foundational placements. The Lagna (Ascendant) is the zodiac sign rising on the eastern horizon at the moment of your birth — it defines your body, personality and overall approach to life. The Rashi (Moon Sign) is the zodiac sign the Moon was in at birth — it governs the mind, emotions and instinctive nature. The Janma Nakshatra (Birth Star) is the specific lunar mansion (1 of 27) the Moon occupied — it adds fine-grained nuance to your character and is used to calculate your Vimshottari dasha (life periods).',
        bullets: [
          'Lagna (Ascendant): your outer self, body, how others perceive you',
          'Moon Sign (Rashi): your inner world, emotions, mind and instincts',
          'Nakshatra: your birth star — drives dasha calculation and deepest personality layer',
        ],
      },
      {
        heading: 'Step 2: The Twelve Houses — Life Areas',
        body:
          'The twelve houses divide life experience into specific domains. Each house governs a distinct area of life and is counted from the Lagna (1st house). Planets placed in or aspecting a house colour that area of life with their energy.',
        bullets: [
          '1st House: Self, body, personality',
          '2nd House: Wealth, family, speech',
          '3rd House: Courage, siblings, communication',
          '4th House: Home, mother, happiness, property',
          '5th House: Children, creativity, intelligence, romance',
          '6th House: Health, enemies, debts, daily work',
          '7th House: Marriage, partnerships, business',
          '8th House: Longevity, transformation, occult, inheritance',
          '9th House: Dharma, luck, father, higher knowledge',
          '10th House: Career, status, karma',
          '11th House: Gains, social network, desires',
          '12th House: Expenses, foreign, sleep, moksha',
        ],
      },
      {
        heading: 'Step 3: The Nine Planets and Their Meanings',
        body:
          'Vedic astrology uses nine grahas (planets): Sun (Surya), Moon (Chandra), Mars (Mangal), Mercury (Budha), Jupiter (Guru/Brihaspati), Venus (Shukra), Saturn (Shani), Rahu (North Node) and Ketu (South Node). Each planet governs specific life themes, body parts, career areas and personality traits. The sign a planet occupies modifies its expression; the house it occupies tells you which life area it activates.',
      },
      {
        heading: 'Step 4: Planetary Strength — Exaltation, Debilitation, Own Sign',
        body:
          'Not all planetary placements are equal. Each planet has a sign where it is most powerful (exaltation), a sign where its energy is weakest (debilitation) and signs it naturally rules (own sign). For example: Sun is exalted in Aries, debilitated in Libra, and owns Leo. Saturn is exalted in Libra, debilitated in Aries, and owns Capricorn and Aquarius. Strong planets deliver their results more reliably; weak planets require more effort to manifest their positive potential.',
      },
      {
        heading: 'Step 5: Reading Dashas — Your Current Life Period',
        body:
          'The Vimshottari dasha system divides your life into 120-year cycles of planetary periods. The planet ruling your Janma Nakshatra determines which dasha you start life with. Each dasha (main period) is further divided into antardasha (sub-periods) and pratyantardasha (sub-sub-periods). Knowing your current dasha is crucial — it tells you which planet\'s energy is most active in your life right now, and therefore which areas of life are being activated or tested.',
      },
    ],
    remedies: [
      'Generate your free birth chart at vedicastro.app/birth-chart to see all your planetary placements',
      'Note your Lagna, Moon sign and current dasha period — these three alone reveal 70% of your chart\'s story',
      'Study each planet\'s strength: is it exalted, debilitated, in own sign or in a neutral sign?',
      'Look at houses 1, 4, 7 and 10 (the four pillars / kendras) — these are the most powerful houses',
      'If you are confused, ask Pandit Arjun specific questions about your chart — personalised guidance beats generic reading',
    ],
    faqs: [
      { q: 'What is the difference between a Vedic chart and a Western chart?', a: 'Vedic astrology uses the sidereal zodiac (based on the actual star positions) while Western astrology uses the tropical zodiac (based on seasons). This creates roughly a 23-degree difference, which is why your Vedic Sun sign may differ from your Western Sun sign.' },
      { q: 'What is the most important planet in a birth chart?', a: 'The Lagna lord (ruler of the Ascendant sign) is considered the most important planet, as it governs the overall direction of life. The Moon is equally significant for the mind and emotional life. However, the planet ruling your current dasha is the most practically relevant at any given time.' },
      { q: 'Do I need to know my exact birth time?', a: 'Yes, for accurate Lagna (Ascendant) and house calculations. Without an accurate birth time (preferably within 10 minutes), the Lagna and house placements can be off by a full sign. Moon sign and nakshatra can usually be determined with just the birth date, unless the Moon is near a sign boundary.' },
      { q: 'Can Pandit Arjun help me understand my specific chart?', a: 'Absolutely. Pandit Arjun can answer specific questions about your placements, dashas, yogas, and what they mean for your unique life situation — for just $0.50 for 50 questions.' },
    ],
    relatedGuides: ['rahu-mahadasha', 'sade-sati', 'moon-sign-meaning'],
  },

  // ── 5. MANGLIK DOSHA ──────────────────────────────────────────────────────
  {
    slug: 'manglik-dosha-guide',
    title: 'Manglik Dosha (Mangal Dosha) Explained: Facts, Myths & Remedies',
    subtitle: 'The truth about Mars affliction in marriage — without the fear',
    category: 'dosha',
    metaDescription:
      'Manglik Dosha (Mangal Dosha) is one of the most misunderstood concepts in Vedic astrology. Learn what it actually means, how it affects marriage, who has it, and the most effective remedies.',
    keywords: [
      'manglik dosha', 'mangal dosha', 'manglik dosha effects', 'manglik dosha marriage',
      'how to check manglik dosha', 'manglik dosha remedies', 'is manglik dosha dangerous',
      'mangal dosha in kundli', 'mars affliction vedic astrology', 'double manglik',
    ],
    readingTime: 8,
    intro:
      'Manglik Dosha (also called Mangal Dosha, Kuja Dosha or Angaraka Dosha) is one of the most talked-about — and most misrepresented — concepts in Vedic astrology. Families have cancelled marriages over it. Individuals have lived in fear of it. But what does it actually mean, and how seriously should you take it? The answer, as with most things in Vedic astrology, is nuanced.',
    sections: [
      {
        heading: 'What Is Manglik Dosha?',
        body:
          'Manglik Dosha occurs when Mars (Mangal) is placed in specific houses of the birth chart. Mars is a planet of energy, aggression, passion and will-power. When placed in houses related to partnerships and life, it can intensify these qualities in ways that require careful management. The dosha is formed when Mars occupies the 1st, 2nd, 4th, 7th, 8th or 12th house from the Lagna (Ascendant), Moon or Venus, depending on the tradition. Some astrologers include only Lagna-based assessment; others include all three. This variation is why interpretations differ so widely.',
        bullets: [
          'Houses that create Manglik Dosha: 1st, 2nd, 4th, 7th, 8th, 12th (from Lagna or Moon)',
          'Approximately 40–50% of all charts have some form of Manglik Dosha',
          'Severity varies enormously based on Mars\'s sign, aspects and the rest of the chart',
        ],
      },
      {
        heading: 'What Does Manglik Dosha Actually Cause?',
        body:
          'The traditional concern is that Manglik Dosha creates tensions in marriage — conflict, separation or in extreme traditional beliefs, harm to the partner. In practical terms, what Mars in sensitive houses more commonly creates is: a tendency toward impulsiveness in relationships, a strong personality that may dominate or clash with a spouse, high physical energy and passion that needs healthy outlets, and a need for independence within a partnership. None of this is inherently catastrophic.',
      },
      {
        heading: 'The "Cancellation" of Manglik Dosha',
        body:
          'Classical texts list numerous conditions that neutralise or reduce the dosha. If both partners are Manglik, the dosha is considered cancelled. If Mars occupies its own signs (Aries or Scorpio), it is considered strong but less destructive. If Mars is in Cancer (debilitated) or Capricorn (exalted), the intensity differs significantly. Benefic planetary aspects on Mars — especially from Jupiter or Venus — also reduce the dosha\'s impact substantially. A chart must always be read as a whole, never just by isolating one placement.',
        bullets: [
          'Double Manglik (both partners): dosha is mutually cancelled',
          'Mars in Aries/Scorpio: strong but modified by sign ownership',
          'Jupiter aspecting Mars: considerable mitigation of negative effects',
          'Mars in 2nd house: some traditions do not consider this house fully Manglik',
        ],
      },
      {
        heading: 'The Statistical Reality',
        body:
          'Statistical studies on Manglik Dosha in large sample populations have not found clear evidence of the dire outcomes traditionally predicted. Hundreds of millions of Manglik individuals have long, happy marriages. Many non-Manglik charts show far more difficult relationship patterns. Relying solely on this one factor to determine marital compatibility is an oversimplification that classical astrology itself does not endorse — it is the result of feature-by-feature chart reading rather than holistic analysis.',
      },
    ],
    remedies: [
      'Marry a fellow Manglik person — this is the most commonly cited traditional resolution',
      'Perform Mangal Shanti Puja — a Vedic ritual to pacify Mars energy, ideally on a Tuesday',
      'Worship Lord Hanuman every Tuesday — chant the Hanuman Chalisa or offer red flowers',
      'Donate red lentils (masoor dal), red cloth or copper items to a Brahmin or temple on Tuesdays',
      'Chant the Mars Beej Mantra: "Om Kram Kreem Kroom Sah Bhaumaya Namah" — 108 times on Tuesdays',
      'Physical exercise and martial arts — healthy physical outlets channel Mars energy constructively',
      'Avoid arguments and aggressive behaviour on Tuesdays; practice patience deliberately',
    ],
    faqs: [
      { q: 'How common is Manglik Dosha?', a: 'Given that Mars can occupy 6 of 12 houses, roughly 40–50% of the population has some form of Manglik Dosha. It is far too common to be considered a rare affliction.' },
      { q: 'Is Manglik Dosha the most important factor in marriage compatibility?', a: 'No. Classical Vedic matchmaking (Guna Milan, Ashtakoot system) considers 8 different compatibility dimensions. The overall score, dashas, Navamsa chart and Venus/7th house analysis are all equally or more important.' },
      { q: 'Does Manglik Dosha go away after age 28?', a: 'Some traditions teach that Manglik Dosha reduces in intensity after age 28, as the Mars cycle completes. However, this is a folk belief and is not universally accepted in classical Vedic astrology.' },
      { q: 'Should I be afraid of Manglik Dosha?', a: 'No. Fear itself, and the rigid decisions it produces, causes far more relationship difficulties than the actual dosha. Consult a knowledgeable astrologer who reads your full chart — not just this one placement.' },
    ],
    relatedGuides: ['how-to-read-kundli', 'moon-sign-meaning', 'sade-sati'],
  },

  // ── 6. MOON SIGN MEANING ──────────────────────────────────────────────────
  {
    slug: 'moon-sign-meaning',
    title: 'Moon Sign in Vedic Astrology: Why It Matters More Than Sun Sign',
    subtitle: 'The Rashi that governs your mind, emotions and inner world',
    category: 'fundamentals',
    metaDescription:
      'In Vedic astrology, your Moon sign (Rashi) is more important than your Sun sign. Discover what your Moon sign reveals about your mind, emotions, relationships and life path.',
    keywords: [
      'moon sign vedic astrology', 'rashi meaning', 'moon sign vs sun sign',
      'what is my moon sign', 'janma rashi', 'moon sign importance', 'rashi chart',
      'chandra rashi', 'moon sign personality', 'vedic moon sign calculator',
    ],
    readingTime: 7,
    intro:
      'Ask a Western astrologer "What\'s your sign?" and they mean your Sun sign. Ask a Vedic astrologer the same question and they mean your Moon sign — your Rashi. In Vedic astrology, the Moon sign is the foundational identity marker. It governs the mind (manas), emotions, instincts, the mother, public life and the rhythm of daily experience. Understanding your Moon sign is understanding the inner architecture of how you think, feel and respond to life.',
    sections: [
      {
        heading: 'Why Is the Moon Sign More Important in Vedic Astrology?',
        body:
          'Sun moves through one zodiac sign per month — meaning everyone born in the same month shares the same Sun sign. The Moon, however, changes signs every 2.5 days. It is therefore a far more precise and personal indicator. Additionally, Vedic astrology places the Moon at the centre of its dasha (planetary period) system — your Janma Nakshatra, which determines your entire sequence of life periods, is calculated from the Moon\'s position at birth. The Moon is also considered to represent the soul\'s vehicle in its current incarnation — the mind that experiences life.',
        bullets: [
          'Sun sign changes monthly — 1 in 12 people share it',
          'Moon sign changes every 2.5 days — far more individual',
          'Moon sign drives the Vimshottari dasha (life period) calculation',
          'Moon represents: mind, emotions, mother, public image, daily habits',
        ],
      },
      {
        heading: 'The Twelve Moon Signs (Rashis) and Their Meanings',
        body:
          'Each of the twelve zodiac signs colours the Moon\'s expression differently. Aries Moon: impulsive, pioneering mind with a need for independence. Taurus Moon: steady, comfort-seeking, sensually aware. Gemini Moon: curious, communicative, restless intellect. Cancer Moon: deeply nurturing, emotionally sensitive, home-loving. Leo Moon: proud, warm, needs recognition and creative expression. Virgo Moon: analytical, detail-focused, service-oriented. Libra Moon: harmony-seeking, socially aware, aesthetically sensitive. Scorpio Moon: intense, psychologically penetrating, deeply feeling. Sagittarius Moon: philosophical, freedom-loving, optimistic. Capricorn Moon: disciplined, achievement-oriented, quietly resilient. Aquarius Moon: humanitarian, unconventional, intellectually detached. Pisces Moon: dreamy, empathic, spiritually inclined.',
      },
      {
        heading: 'How Your Moon Sign Affects Relationships',
        body:
          'The Moon sign is the primary indicator of emotional compatibility in Vedic relationship analysis. The ancient Guna Milan system compares Moon signs of prospective partners across eight dimensions (ashtakoot) to arrive at a compatibility score out of 36. A score above 18 is generally considered compatible. The Rashi dimension specifically compares the relative positions of both partners\' Moon signs — some combinations are naturally harmonious, others require more conscious effort. But Moon sign compatibility is only one dimension; the full chart must be considered.',
      },
      {
        heading: 'Moon Sign vs. Lagna (Ascendant)',
        body:
          'The Lagna (Ascendant) governs your outer personality, physical body and the way you project yourself into the world. The Moon sign governs your inner world — your emotional responses, habitual patterns and the quality of your inner experience. People close to you will often recognise your Moon sign character more readily than your Lagna, because the Moon sign is what you show when you relax and let your guard down. Both are essential for a complete reading.',
      },
    ],
    remedies: [
      'Know your Moon sign — generate your free Vedic birth chart at vedicastro.app/birth-chart',
      'Honour the Moon on Mondays: chant "Om Chandraya Namah" 108 times and offer white flowers',
      'Eat light, fresh food on Mondays and avoid heavily processed or tamasic foods',
      'Meditate during full moon nights — the Moon\'s influence on the mind is strongest then',
      'Spend time near water bodies when feeling emotionally overwhelmed — water naturally soothes the Moon',
      'Read about your Moon sign\'s associated nakshatra for even deeper self-understanding',
    ],
    faqs: [
      { q: 'How do I find my Vedic Moon sign?', a: 'You need your date, time and place of birth. Our free birth chart calculator at vedicastro.app/birth-chart will instantly calculate your Moon sign and all planetary positions.' },
      { q: 'Can my Western Sun sign be the same as my Vedic Moon sign?', a: 'Yes, this can happen, though it is coincidental. The two systems use different zodiacs (tropical vs. sidereal), so all your Vedic planetary signs will typically be different from your Western signs.' },
      { q: 'Which Moon sign is considered most powerful?', a: 'There is no universally "best" Moon sign. Each sign has strengths and challenges. Moon in Taurus is considered exalted (strongest expression); Moon in Scorpio is debilitated (more challenged expression). But a person\'s overall chart, dashas and conscious choices matter far more than sign strength alone.' },
    ],
    relatedGuides: ['how-to-read-kundli', 'rahu-mahadasha', 'ketu-mahadasha'],
  },

  // ── 7. SATURN MAHADASHA ───────────────────────────────────────────────────
  {
    slug: 'saturn-mahadasha',
    title: 'Saturn Mahadasha (Shani Dasha): Effects on Career, Health & Life',
    subtitle: '19 years of discipline, karma and earned reward — or delay and restriction',
    category: 'mahadasha',
    metaDescription:
      'Saturn Mahadasha lasts 19 years and is governed by the planet of karma and discipline. Learn its effects on career, relationships, health and how to navigate it with Vedic remedies.',
    keywords: [
      'saturn mahadasha', 'shani mahadasha', 'shani dasha', 'saturn dasha effects',
      'saturn mahadasha career', 'saturn mahadasha health', 'shani mahadasha remedies',
      '19 year saturn dasha', 'saturn antardasha', 'shani mahadasha marriage',
    ],
    readingTime: 8,
    intro:
      'Saturn Mahadasha is the longest major dasha in the Vimshottari system at 19 years. It is ruled by Shani — the planet of karma, discipline, hard work, delays and ultimately, earned reward. If Rahu Mahadasha is the wildfire of ambition, Saturn Mahadasha is the slow, steady forge. Those who align themselves with Saturn\'s virtues — integrity, patience, service and structure — can build remarkable, lasting achievements. Those who resist these lessons may find the period exceptionally challenging.',
    sections: [
      {
        heading: 'What Is Saturn Mahadasha?',
        body:
          'Saturn Mahadasha spans 19 years. In the Vimshottari sequence, it typically comes after one of the other major dashas and represents a period of karmic accountability. Saturn is a natural malefic — it restricts, delays and disciplines — but it is also the greatest judge and equaliser in the zodiac. A strong Saturn in your natal chart can make this the most productive and structurally transformative period of your life.',
        bullets: [
          'Duration: 19 years',
          'Governs: karma, discipline, structure, hard work, delays, longevity',
          'Can bring: lasting career success, property, wisdom through experience',
          'Can cause: delays, health issues, isolation, heavy responsibilities, financial pressure',
        ],
      },
      {
        heading: 'Career and Professional Life',
        body:
          'Saturn rewards sustained, ethical effort. During Saturn Mahadasha, shortcuts typically fail. Success comes through consistency, expertise and building genuine value over time. Real estate, law, engineering, government service, mining, agriculture and management are all Saturn-aligned fields. If your career involves integrity and structure, Saturn can make this a period of steady climb and lasting recognition — though rarely overnight.',
      },
      {
        heading: 'Relationships and Family',
        body:
          'Saturn tests relationships for authenticity and durability. Shallow or inauthentic connections often dissolve during this period. Marriages that are built on solid foundations can deepen significantly. There may be increased responsibilities within the family — caring for elderly parents, shouldering household burdens or managing long-term family obligations. The key lesson Saturn teaches in relationships is maturity: the shift from romantic idealism to practical, enduring love.',
      },
      {
        heading: 'Health During Saturn Mahadasha',
        body:
          'Saturn governs the skeletal system, joints, skin, teeth and chronic (long-duration) conditions. Arthritis, bone issues, skin dryness, dental problems and chronic fatigue are among the most common health themes. Cold, damp environments and insufficient sleep can exacerbate Saturn-related health challenges. Discipline in diet, sleep and exercise — all Saturn virtues — are the most effective preventive measures.',
      },
    ],
    remedies: [
      'Visit a Shani temple every Saturday and offer sesame oil to the Shani idol',
      'Chant "Om Sham Shanicharaya Namah" — 108 times on Saturdays',
      'Feed the poor, elderly and disabled regularly — Saturn is the karaka of the under-privileged',
      'Donate iron, black sesame, black cloth or blue sapphire (after astrological consultation) on Saturdays',
      'Light a sesame oil lamp under a peepal tree every Saturday evening',
      'Maintain strict discipline: regular sleep, healthy diet and consistent work habits — live Saturn\'s virtues',
      'Avoid shortcuts, dishonesty or unethical practices — Saturn\'s karmic judgment is swift in its own dasha',
    ],
    faqs: [
      { q: 'Is Saturn Mahadasha always difficult?', a: 'No. For those with a well-placed Saturn (especially exalted in Libra, or in own signs Capricorn/Aquarius), the dasha can bring steady, lasting success. Even a challenging Saturn dasha delivers important lessons that build character and long-term strength.' },
      { q: 'What happens at the end of Saturn Mahadasha?', a: 'The dasha that follows Saturn depends on the Vimshottari sequence for your chart. Typically, the end of Saturn dasha brings some easing of burdens and a sense of having passed through a great test. The karma of the 19 years becomes more visible.' },
    ],
    relatedGuides: ['sade-sati', 'rahu-mahadasha', 'how-to-read-kundli'],
  },

  // ── 8. ASHTAMA SHANI ──────────────────────────────────────────────────────
  {
    slug: 'ashtama-shani',
    title: "Ashtama Shani: Saturn in the 8th from Your Moon Sign — Complete Guide",
    subtitle: 'The 2.5-year pressure transit explained — facts over fear',
    category: 'transit',
    metaDescription:
      "Ashtama Shani occurs when Saturn transits the 8th house from your Moon sign. Learn its real effects, which Moon signs are affected now, and powerful remedies to navigate this challenging transit.",
    keywords: [
      'ashtama shani', 'saturn 8th house transit', 'shani ashtama', 'saturn in 8th from moon',
      'ashtama shani effects', 'ashtama shani remedies', 'ashtama shani duration',
      'saturn transit 8th house', '8th house saturn moon', 'when does ashtama shani end',
    ],
    readingTime: 6,
    intro:
      "Ashtama Shani is the transit of Saturn (Shani) through the 8th sign from your natal Moon sign. Along with Sade Sati, it is one of the two most closely watched Saturn transits in Vedic astrology. The 8th house is associated with hidden matters, transformation, obstacles, longevity and sudden changes. When Saturn passes through this house from the Moon, it activates all of these themes simultaneously — creating a period that demands resilience and wisdom.",
    sections: [
      {
        heading: 'What Is Ashtama Shani?',
        body:
          "Ashtama means \"eighth\" in Sanskrit. When Saturn transits the zodiac sign that is 8 signs ahead of your natal Moon sign, it is called Ashtama Shani. Since Saturn spends approximately 2.5 years in each sign, this transit also lasts 2.5 years. For example, if your Moon sign is Aries, Ashtama Shani occurs when Saturn transits Scorpio (the 8th sign from Aries). If your Moon is in Taurus, it occurs when Saturn is in Sagittarius — and so on.",
        bullets: [
          'Duration: approximately 2.5 years',
          'Frequency: every 29–30 years (one full Saturn cycle)',
          'Governed by: 8th house themes — transformation, obstacles, hidden matters, longevity',
        ],
      },
      {
        heading: 'Common Effects of Ashtama Shani',
        body:
          "The 8th house is the house of sudden changes, deep transformation and the hidden dimensions of life. When Saturn activates it through transit, common experiences include: unexpected obstacles or delays in career or finances, health challenges that require sustained attention, increased expenses or financial pressures, psychological depth and interest in esoteric or research-oriented subjects, and the dissolution of situations that have been held together through unsustainable effort. It is rarely comfortable, but it is rarely without purpose.",
        bullets: [
          'Career: obstacles, slower progress, potential structural changes',
          'Health: increased vulnerability, especially chronic or hidden conditions',
          'Finances: unexpected expenses, the need for conservative management',
          'Relationships: depth over breadth; superficial connections may fade',
        ],
      },
      {
        heading: 'Ashtama Shani vs. Sade Sati — Which Is Harder?',
        body:
          "Sade Sati is generally considered more intense and wide-ranging because it passes directly through the Moon sign itself (the peak phase). Ashtama Shani is narrower in scope but can be more sudden and hidden in its manifestations — because the 8th house rules concealed matters. They are different in character: Sade Sati is like a sustained weight, Ashtama Shani is like sudden turbulence. Both deserve respectful awareness and appropriate remedies.",
      },
    ],
    remedies: [
      'Chant "Om Sham Shanicharaya Namah" 108 times every Saturday',
      'Feed black sesame seeds to crows daily during this transit',
      'Donate to the poor, elderly or disabled on Saturdays',
      'Avoid major new financial risks or speculative investments during this period',
      'Maintain physical health through regular exercise, adequate sleep and a simple diet',
      'Worship Lord Hanuman — recite the Hanuman Chalisa on Saturdays and Tuesdays',
    ],
    faqs: [
      { q: 'How do I know if I am in Ashtama Shani right now?', a: 'Identify your Vedic Moon sign, then count 8 signs forward (inclusive). Check if Saturn is currently transiting that 8th sign. Our birth chart tool calculates your Moon sign, and you can then cross-reference with current Saturn position to confirm.' },
      { q: 'Is Ashtama Shani worse than Sade Sati?', a: 'Generally no — Sade Sati is considered more intense because it directly transits the Moon sign. Ashtama Shani is challenging but more focused in scope.' },
    ],
    relatedGuides: ['sade-sati', 'saturn-mahadasha', 'how-to-read-kundli'],
  },
];

export function getGuideBySlug(slug: string): GuideData | undefined {
  return GUIDES.find(g => g.slug === slug);
}

export function getGuidesByCategory(category: GuideCategory): GuideData[] {
  return GUIDES.filter(g => g.category === category);
}

export function getRelatedGuides(slugs: string[]): GuideData[] {
  return GUIDES.filter(g => slugs.includes(g.slug));
}
