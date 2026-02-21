export interface YogaData {
  id: string;
  name: string;
  slug: string;
  category: 'beneficial' | 'malefic';
  shortDescription: string;
  keywords: string[];
  planetaryCombination: string[];
  effects: string[];
  remedies?: string[];
  details: string;
}

export const VEDIC_YOGAS: YogaData[] = [
  // Beneficial Yogas
  {
    id: '1',
    name: 'Hamsa Yoga',
    slug: 'hamsa-yoga',
    category: 'beneficial',
    shortDescription: 'A powerful Pancha Mahapurusha Yoga formed by Jupiter in a kendra house in its own sign or exaltation, bestowing wisdom, prosperity, spiritual inclination, and elevated status in society.',
    keywords: ['hamsa yoga', 'jupiter yoga', 'pancha mahapurusha yoga', 'wisdom yoga', 'prosperity yoga'],
    planetaryCombination: ['Jupiter in kendra (1st, 4th, 7th, 10th) house', 'Jupiter in own sign (Sagittarius/Pisces) or exalted (Cancer)', 'Jupiter strong and unafflicted'],
    effects: ['Exceptional wisdom and intelligence', 'Prosperity through righteous means', 'Elevated social status', 'Strong spiritual inclination', 'Success in teaching or counseling'],
    details: 'Hamsa Yoga is one of the five Pancha Mahapurusha Yogas formed by Jupiter. It creates individuals with exceptional wisdom, moral character, and prosperity. The yoga brings success in education, spirituality, and ethical professions.'
  },
  {
    id: '2',
    name: 'Malavya Yoga',
    slug: 'malavya-yoga',
    category: 'beneficial',
    shortDescription: 'A Pancha Mahapurusha Yoga formed by Venus in a kendra in its own sign or exaltation, bestowing exceptional beauty, artistic talents, luxury, and successful relationships.',
    keywords: ['malavya yoga', 'venus yoga', 'beauty yoga', 'luxury yoga', 'artistic talents'],
    planetaryCombination: ['Venus in kendra (1st, 4th, 7th, 10th) house', 'Venus in own sign (Taurus/Libra) or exalted (Pisces)', 'Venus strong and well-placed'],
    effects: ['Exceptional physical beauty', 'Strong artistic abilities', 'Love for luxury and comfort', 'Harmonious relationships', 'Success in arts or entertainment'],
    details: 'Malavya Yoga is formed by Venus in kendra houses. It creates individuals with exceptional beauty, artistic talents, and refined tastes. The yoga brings success in creative fields and harmonious relationships.'
  },
  {
    id: '3',
    name: 'Ruchaka Yoga',
    slug: 'ruchaka-yoga',
    category: 'beneficial',
    shortDescription: 'A dynamic Pancha Mahapurusha Yoga formed by Mars in a kendra in its own sign or exaltation, conferring courage, leadership, competitive success, and physical strength.',
    keywords: ['ruchaka yoga', 'mars yoga', 'courage yoga', 'leadership yoga', 'warrior yoga'],
    planetaryCombination: ['Mars in kendra (1st, 4th, 7th, 10th) house', 'Mars in own sign (Aries/Scorpio) or exalted (Capricorn)', 'Mars strong and well-placed'],
    effects: ['Exceptional courage and fearlessness', 'Strong leadership abilities', 'Physical strength and vitality', 'Success in competitive fields', 'Victory over opponents'],
    details: 'Ruchaka Yoga is formed by Mars in kendra houses. It creates individuals with exceptional courage, physical strength, and leadership abilities. The yoga brings success in military, sports, engineering, and competitive fields.'
  },
  {
    id: '4',
    name: 'Bhadra Yoga',
    slug: 'bhadra-yoga',
    category: 'beneficial',
    shortDescription: 'A Pancha Mahapurusha Yoga formed by Mercury in a kendra in its own sign or exaltation, granting exceptional intelligence, communication skills, and business acumen.',
    keywords: ['bhadra yoga', 'mercury yoga', 'intelligence yoga', 'communication yoga', 'business yoga'],
    planetaryCombination: ['Mercury in kendra (1st, 4th, 7th, 10th) house', 'Mercury in own sign (Gemini/Virgo) or exalted (Virgo)', 'Mercury strong and unafflicted'],
    effects: ['Exceptional intelligence', 'Outstanding communication skills', 'Business acumen', 'Analytical abilities', 'Success in writing or speaking'],
    details: 'Bhadra Yoga is formed by Mercury in kendra houses. It creates intellectually brilliant individuals with exceptional communication and business skills. The yoga brings success in commerce, writing, teaching, and intellectual pursuits.'
  },
  {
    id: '5',
    name: 'Sasha Yoga',
    slug: 'sasha-yoga',
    category: 'beneficial',
    shortDescription: 'A Pancha Mahapurusha Yoga formed by Saturn in a kendra in its own sign or exaltation, providing discipline, persistence, organizational skills, and long-term success.',
    keywords: ['sasha yoga', 'saturn yoga', 'discipline yoga', 'success through effort', 'organizational skills'],
    planetaryCombination: ['Saturn in kendra (1st, 4th, 7th, 10th) house', 'Saturn in own sign (Capricorn/Aquarius) or exalted (Libra)', 'Saturn strong and well-dignified'],
    effects: ['Strong discipline and organization', 'Patience and persistence', 'Success through hard work', 'Leadership in structured environments', 'Respect in later life'],
    details: 'Sasha Yoga is formed by Saturn in kendra houses. It creates disciplined individuals who achieve success through persistent effort. The yoga brings rewards in the second half of life and confers lasting achievements.'
  },
  {
    id: '6',
    name: 'Amala Yoga',
    slug: 'amala-yoga',
    category: 'beneficial',
    shortDescription: 'An auspicious yoga formed when benefic planets occupy the 10th house from Moon or Ascendant, granting spotless reputation, prosperity, and fame through ethical conduct.',
    keywords: ['amala yoga', 'pure yoga', 'spotless reputation', 'fame yoga', 'ethical success'],
    planetaryCombination: ['Benefic planet in 10th from Ascendant or Moon', '10th house free from malefic influence', 'Benefic strong and well-placed'],
    effects: ['Spotless reputation', 'Fame through ethical means', 'Professional success', 'Respect from society', 'Lasting legacy'],
    details: 'Amala Yoga is formed when benefic planets occupy the 10th house. It creates individuals whose reputation remains untarnished throughout life, bringing enduring fame and prosperity built on ethical foundations.'
  },
  {
    id: '7',
    name: 'Vimala Yoga',
    slug: 'vimala-yoga',
    category: 'beneficial',
    shortDescription: 'A beneficial yoga formed when the 12th lord is placed in the 12th house, granting spiritual inclination, foreign connections, and peaceful life.',
    keywords: ['vimala yoga', 'spiritual yoga', 'foreign connections', 'moksha yoga', 'peaceful life'],
    planetaryCombination: ['12th lord in 12th house', '12th lord strong and well-placed', 'Free from severe afflictions'],
    effects: ['Strong spiritual inclination', 'Success in foreign lands', 'Peaceful approach to life', 'Charitable nature', 'Protection during travels'],
    details: 'Vimala Yoga is formed when the 12th lord occupies the 12th house. Despite the 12th being a dusthana house, this self-placement creates strength, bringing spiritual benefits and success in foreign matters.'
  },
  {
    id: '8',
    name: 'Adhi Yoga',
    slug: 'adhi-yoga',
    category: 'beneficial',
    shortDescription: 'A powerful yoga formed when benefic planets occupy the 6th, 7th, and 8th houses from Moon, conferring authority, wealth, and influential positions.',
    keywords: ['adhi yoga', 'minister yoga', 'authority yoga', 'wealth yoga', 'influential positions'],
    planetaryCombination: ['Benefics in 6th from Moon', 'Benefics in 7th from Moon', 'Benefics in 8th from Moon'],
    effects: ['Rise to authority positions', 'Wealth through position', 'Political or government success', 'Ministerial roles', 'Command and influence'],
    details: 'Adhi Yoga is formed when benefic planets occupy houses 6, 7, and 8 from Moon. It creates individuals destined for positions of authority, wealth, and influence, particularly in government or ministerial roles.'
  },
  {
    id: '9',
    name: 'Gajakesari Yoga',
    slug: 'gajakesari-yoga',
    category: 'beneficial',
    shortDescription: 'One of the most celebrated yogas formed when Jupiter and Moon are in kendras from each other, bestowing wisdom, emotional intelligence, and prosperity.',
    keywords: ['gajakesari yoga', 'jupiter moon yoga', 'wisdom yoga', 'prosperity yoga', 'elephant lion yoga'],
    planetaryCombination: ['Jupiter in kendra from Moon', 'Both Jupiter and Moon strong', 'Jupiter not debilitated'],
    effects: ['Exceptional wisdom and emotional intelligence', 'Material prosperity', 'Moral strength', 'Respected position', 'Balanced life'],
    details: 'Gajakesari Yoga, meaning Elephant-Lion Yoga, is formed when Jupiter and Moon are in kendras from each other. It creates individuals with both material prosperity and spiritual wisdom, combining strength with compassion.'
  },
  {
    id: '10',
    name: 'Budha-Aditya Yoga',
    slug: 'budha-aditya-yoga',
    category: 'beneficial',
    shortDescription: 'A yoga formed when Mercury and Sun conjunct, creating individuals with sharp intellect, excellent communication, and administrative abilities.',
    keywords: ['budha aditya yoga', 'mercury sun yoga', 'intelligence yoga', 'communication skills', 'administrative success'],
    planetaryCombination: ['Mercury and Sun conjunct', 'Works best when Mercury not combust', 'Strong in 2nd, 5th, 9th, 10th, or 11th houses'],
    effects: ['Sharp intellect', 'Excellent communication', 'Success in politics or administration', 'Business acumen', 'Persuasive abilities'],
    details: 'Budha-Aditya Yoga is formed when Mercury and Sun conjunct. It creates a powerful blend of solar authority and mercurial intelligence, producing individuals who excel in politics, administration, and intellectual fields.'
  },
  // Malefic Yogas
  {
    id: '11',
    name: 'Kala Sarpa Yoga',
    slug: 'kala-sarpa-yoga',
    category: 'malefic',
    shortDescription: 'A karmic yoga formed when all planets are hemmed between Rahu and Ketu, creating intense life challenges, psychological struggles, but also potential for transformation.',
    keywords: ['kala sarpa yoga', 'kala sarpa dosha', 'rahu ketu yoga', 'serpent yoga', 'karmic yoga'],
    planetaryCombination: ['All seven planets on one side', 'Planets between Rahu and Ketu', 'No planet on other side of Rahu-Ketu axis'],
    effects: ['Intense psychological struggles', 'Delays and obstacles', 'Recurring patterns', 'Strong karmic lessons', 'Spiritual awakening through challenges'],
    remedies: ['Worship Lord Shiva regularly', 'Chant Om Namah Shivaya 108 times', 'Perform Rahu-Ketu puja', 'Donate black items on Saturdays', 'Practice meditation and yoga'],
    details: 'Kala Sarpa Yoga represents karmic patterns from past lives creating specific challenges and lessons in this lifetime. It is formed when all visible planets are hemmed between Rahu and Ketu, the shadow planets.'
  },
  {
    id: '12',
    name: 'Manglik Dosha',
    slug: 'manglik-dosha',
    category: 'malefic',
    shortDescription: 'A commonly feared condition where Mars placement in specific houses affects marital harmony, causing delays in marriage or relationship challenges.',
    keywords: ['manglik dosha', 'mangal dosha', 'kuja dosha', 'mars dosha', 'marriage problems'],
    planetaryCombination: ['Mars in 1st, 2nd, 4th, 7th, 8th, or 12th house', 'Considered from Ascendant, Moon, and Venus', 'Intensity varies based on Mars strength'],
    effects: ['Delays in marriage', 'Conflicts with spouse', 'Aggressive behavior in relationships', 'Marital discord', 'Need for patience in marriage'],
    remedies: ['Worship Lord Hanuman', 'Recite Hanuman Chalisa daily', 'Fast on Tuesdays', 'Donate red items on Tuesdays', 'Marry another Manglik'],
    details: 'Manglik Dosha is one of the most widely known astrological considerations in marriage compatibility. It occurs when Mars occupies specific houses, potentially affecting marital harmony and relationships.'
  },
  {
    id: '13',
    name: 'Kemadruma Yoga',
    slug: 'kemadruma-yoga',
    category: 'malefic',
    shortDescription: 'A challenging yoga formed when Moon has no planets on either side, creating financial struggles, emotional loneliness, and lack of support.',
    keywords: ['kemadruma yoga', 'lonely moon', 'financial problems', 'emotional isolation', 'lack of support'],
    planetaryCombination: ['Moon has no planets in 2nd and 12th from it', 'Moon alone without companionship', 'Can be nullified by planets in kendra from Moon'],
    effects: ['Financial difficulties', 'Emotional loneliness', 'Lack of mental peace', 'Struggle for resources', 'Feeling unsupported'],
    remedies: ['Worship Goddess Durga', 'Chant Moon mantra 108 times', 'Fast on Mondays', 'Donate white items', 'Practice kindness and help others'],
    details: 'Kemadruma Yoga is formed when Moon is isolated without planets on either side. It creates challenges in financial prosperity, mental well-being, and social support systems, requiring conscious effort to overcome.'
  },
  {
    id: '14',
    name: 'Daridra Yoga',
    slug: 'daridra-yoga',
    category: 'malefic',
    shortDescription: 'Multiple poverty yogas formed by various combinations indicating financial hardship, inability to accumulate wealth, and material struggles.',
    keywords: ['daridra yoga', 'poverty yoga', 'financial problems', 'wealth blockage', 'material struggles'],
    planetaryCombination: ['11th lord in 6th, 8th, or 12th house', '5th lord in dusthana houses', 'Malefics in 2nd house', 'Weak wealth house lords'],
    effects: ['Chronic financial struggles', 'Inability to retain wealth', 'Constant monetary problems', 'Struggle for basic needs', 'Obstacles in financial growth'],
    remedies: ['Worship Goddess Lakshmi', 'Chant Lakshmi mantras', 'Keep house clean', 'Light lamp daily', 'Give charity regularly'],
    details: 'Daridra Yoga represents structural challenges in wealth creation and accumulation. Unlike temporary difficulties, this yoga indicates long-term financial challenges requiring sustained effort and remedial measures.'
  },
  {
    id: '15',
    name: 'Grahan Yoga',
    slug: 'grahan-yoga',
    category: 'malefic',
    shortDescription: 'An eclipse yoga formed when Sun or Moon conjuncts Rahu or Ketu, creating identity confusion, parent issues, and challenges with self-expression or emotions.',
    keywords: ['grahan yoga', 'eclipse yoga', 'rahu sun conjunction', 'ketu moon conjunction', 'identity issues'],
    planetaryCombination: ['Sun conjunct Rahu or Ketu', 'Moon conjunct Rahu or Ketu', 'Closer degrees create stronger effect'],
    effects: ['Identity confusion', 'Strained parental relationships', 'Emotional instability', 'Health issues', 'Challenges with authority'],
    remedies: ['Worship Sun and chant Aditya Hridayam', 'Offer water to Sun', 'Chant Gayatri Mantra', 'Perform eclipse remedies', 'Practice meditation'],
    details: 'Grahan Yoga creates a symbolic eclipse effect in the birth chart. It brings psychological, health, and relationship challenges that require spiritual awareness and targeted remedial measures.'
  },
  {
    id: '16',
    name: 'Shakata Yoga',
    slug: 'shakata-yoga',
    category: 'malefic',
    shortDescription: 'A fluctuating fortune yoga formed when Jupiter is in dusthana houses from Moon, creating ups and downs in prosperity and cyclical life patterns.',
    keywords: ['shakata yoga', 'fluctuating fortune', 'unstable wealth', 'jupiter moon yoga', 'financial ups downs'],
    planetaryCombination: ['Jupiter in 6th, 8th, or 12th from Moon', 'Creates cart-wheel effect', 'Affects financial stability'],
    effects: ['Fluctuating finances', 'Gains followed by losses', 'Unstable career', 'Difficulty maintaining prosperity', 'Cyclical life circumstances'],
    remedies: ['Worship Lord Vishnu', 'Chant Jupiter mantra', 'Fast on Thursdays', 'Donate yellow items', 'Practice financial discipline'],
    details: 'Shakata Yoga, named after the cart wheel, represents fluctuating fortunes. When Jupiter occupies dusthana houses from Moon, it creates instability in prosperity requiring careful management and patience.'
  },
  {
    id: '17',
    name: 'Shrapit Yoga',
    slug: 'shrapit-yoga',
    category: 'malefic',
    shortDescription: 'A cursed yoga formed when Saturn and Rahu conjunct, indicating ancestral karma, relationship obstacles, and challenges requiring spiritual remedies.',
    keywords: ['shrapit yoga', 'cursed yoga', 'saturn rahu conjunction', 'ancestral curse', 'pitru dosha'],
    planetaryCombination: ['Saturn and Rahu conjunct', 'Creates ancestral karma effects', 'Affects relationships and children'],
    effects: ['Relationship obstacles', 'Delays with children', 'Ancestral karma', 'Mental stress', 'Feeling cursed or unlucky'],
    remedies: ['Perform Pitru Tarpan', 'Offer food on Amavasya', 'Visit Pind Daan locations', 'Worship Shiva and Hanuman', 'Feed crows and dogs'],
    details: 'Shrapit Yoga indicates unresolved ancestral karma manifesting as obstacles in relationships, children, and general progress. It requires both spiritual remedies and karmic repayment through righteous living.'
  },
  {
    id: '18',
    name: 'Angarak Yoga',
    slug: 'angarak-yoga',
    category: 'malefic',
    shortDescription: 'An intense yoga formed when Mars and Rahu conjunct, creating explosive anger, impulsiveness, accidents, but also potential for competitive success.',
    keywords: ['angarak yoga', 'mars rahu conjunction', 'anger issues', 'accidents', 'impulsive behavior'],
    planetaryCombination: ['Mars and Rahu conjunct', 'Creates explosive energy', 'Amplifies Mars aggression'],
    effects: ['Explosive anger', 'Impulsive decisions', 'Risk of accidents', 'Relationship conflicts', 'Obsessive competitiveness'],
    remedies: ['Worship Lord Hanuman', 'Recite Hanuman Chalisa', 'Practice yoga and meditation', 'Channel energy into sports', 'Learn anger management'],
    details: 'Angarak Yoga creates an explosive combination magnifying Mars aggressive tendencies. When channeled positively through sports or competitive fields, this energy can lead to exceptional success.'
  },
  {
    id: '19',
    name: 'Guru Chandal Yoga',
    slug: 'guru-chandal-yoga',
    category: 'malefic',
    shortDescription: 'A yoga of wisdom corruption formed when Jupiter conjuncts Rahu, creating confusion in belief systems, ethical dilemmas, and unconventional thinking.',
    keywords: ['guru chandal yoga', 'jupiter rahu conjunction', 'confused wisdom', 'ethical dilemmas', 'false teachers'],
    planetaryCombination: ['Jupiter and Rahu conjunct', 'Creates wisdom-illusion conflict', 'Affects belief systems'],
    effects: ['Confusion in beliefs', 'Attraction to unconventional teachings', 'Ethical dilemmas', 'Teacher problems', 'Risk of false teachings'],
    remedies: ['Worship Lord Vishnu', 'Chant Jupiter mantra', 'Recite Vishnu Sahasranama', 'Respect teachers', 'Avoid false gurus'],
    details: 'Guru Chandal Yoga creates confusion between traditional wisdom and unconventional paths. While it can lead to innovative thinking, it also risks following false teachings requiring careful discrimination.'
  },
  {
    id: '20',
    name: 'Vish Yoga',
    slug: 'vish-yoga',
    category: 'malefic',
    shortDescription: 'A poison yoga formed when Saturn and Moon conjunct, creating emotional coldness, depression, and difficulty in expressing or experiencing emotions.',
    keywords: ['vish yoga', 'poison yoga', 'saturn moon conjunction', 'emotional coldness', 'depression'],
    planetaryCombination: ['Saturn and Moon conjunct', 'Creates emotional restriction', 'Cold approach to feelings'],
    effects: ['Emotional coldness', 'Depression and melancholy', 'Difficulty expressing emotions', 'Strained mother relationship', 'Emotional detachment'],
    remedies: ['Worship Parvati and Shiva', 'Chant Moon and Saturn mantras', 'Respect mother', 'Practice emotional healing', 'Develop compassion through service'],
    details: 'Vish Yoga creates emotional restriction and coldness. The native may have a practical but emotionally detached approach to life, requiring conscious effort to develop emotional warmth and connections.'
  }
];

export function getYogaBySlug(slug: string): YogaData | undefined {
  return VEDIC_YOGAS.find(yoga => yoga.slug === slug);
}

export function getBeneficialYogas(): YogaData[] {
  return VEDIC_YOGAS.filter(yoga => yoga.category === 'beneficial');
}

export function getMaleficYogas(): YogaData[] {
  return VEDIC_YOGAS.filter(yoga => yoga.category === 'malefic');
}
