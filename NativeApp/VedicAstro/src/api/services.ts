import { apiPost, apiGet } from './apiClient';

//  Simple input shapes used by screens 

export interface SimplePersonInput {
  name?: string;
  dateOfBirth: string;      // YYYY-MM-DD
  timeOfBirth?: string;     // HH:MM or HH:MM AM/PM — normalised before sending
  placeOfBirth: string;     // "City, Country"
}

export interface CoordinatesResponse {
  latitude: number;
  longitude: number;
}

// ─── Time normaliser ─────────────────────────────────────────────────────────
// Accepts any user input: "04:25AM", "4:25 am", "16:30", "04:25", "04:25:00"
// Returns 24-hour "HH:mm:ss" which .NET 9 TimeOnly JSON deserialiser requires.
export function normalizeTime(t: string | undefined): string {
  if (!t) return '00:00:00';
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return '00:00:00';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const sec = m[3] ?? '00';
  const mer = (m[4] || '').toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}:${sec}`;
}

//  Parse "Place, Country" into { city, state, country } helper 

function parsePlaceOfBirth(place: string): { city: string; state: string; country: string } {
  const parts = place.split(',').map(s => s.trim());
  if (parts.length >= 3) return { city: parts[0], state: parts[1], country: parts[2] };
  if (parts.length === 2) return { city: parts[0], state: '', country: parts[1] };
  return { city: parts[0], state: '', country: '' };
}

//  predictionsApi 

export const predictionsApi = {
  // Daily horoscope by zodiac sign
  getDailyHoroscope: (zodiacSign: string) =>
    apiPost<any>('/api/predictions/horoscope', { zodiacSign, period: 'daily' }),

  // Fetch only the natal chart (Swiss Ephemeris, accurate planet signs + houses)
  fetchBirthChart: async (input: SimplePersonInput) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    const birthTime = normalizeTime(input.timeOfBirth);
    return apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.dateOfBirth,
      birthTime,
      ...loc,
    }, 45000);
  },

  // Generate detailed prediction from an already-fetched chart (avoids duplicate chart call)
  generateDetailedPredictionFromChart: (chart: any) =>
    apiPost<any>('/api/predictions/generate-detailed-prediction', chart, 60000),

  // Generate basic chart prediction.
  generateBasicChartPrediction: async (input: SimplePersonInput) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    const birthTime = normalizeTime(input.timeOfBirth);
    const chart = await apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.dateOfBirth,
      birthTime,
      ...loc,
    });
    return apiPost<any>('/api/predictions/generate-basic-chart-prediction', chart);
  },

  // Generate detailed prediction (legacy — kept for other callers)
  generateDetailedPrediction: async (input: SimplePersonInput) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    const birthTime = normalizeTime(input.timeOfBirth);
    const chart = await apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.dateOfBirth,
      birthTime,
      ...loc,
    }, 45000);
    return apiPost<any>('/api/predictions/generate-detailed-prediction', chart, 60000);
  },
};

//  horoscopeApi 

export const horoscopeApi = {
  // South Indian chart / Panchang
  getSouthIndian: (input: { date: string; latitude: number; longitude: number }) =>
    apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.date,
      birthTime: '06:00:00',
      latitude: input.latitude,
      longitude: input.longitude,
      city: '', state: '', country: '',
    }),

  // Ask the AI astrologer
  ask: (input: { question: string; name?: string; dateOfBirth?: string; timeOfBirth?: string; placeOfBirth?: string }) => {
    const loc = input.placeOfBirth ? parsePlaceOfBirth(input.placeOfBirth) : { city: '', state: '', country: '' };
    // DateOnly on the server cannot bind an empty string — fall back to today
    const birthDate = input.dateOfBirth || new Date().toISOString().split('T')[0];
    const birthTime = input.timeOfBirth ? normalizeTime(input.timeOfBirth) : '00:00:00';
    return apiPost<any>('/api/horoscope/ask', {
      question: input.question,
      name: input.name || 'Seeker',
      birthDate,
      birthTime,
      ...loc,
    });
  },
};

//  yearlyApi 

export const yearlyApi = {
  generate: (input: SimplePersonInput & { targetYear: number }) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    return apiPost<any>('/api/yearlyhoroscope/generate', {
      birthDate: input.dateOfBirth,
      birthTime: normalizeTime(input.timeOfBirth),
      year: input.targetYear,
      ...loc,
    }, 90_000); // 90s — GPT-heavy
  },
};

//  remediesApi 

export const remediesApi = {
  getPersonalized: (input: SimplePersonInput & { concern?: string }) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    return apiPost<any>('/api/remedies/personalized', {
      birthDate: input.dateOfBirth,
      birthTime: normalizeTime(input.timeOfBirth),
      areasOfConcern: input.concern ? [input.concern] : [],
      ...loc,
    }, 90_000); // 90s — GPT-heavy
  },
};

//  matchmakingApi 

export const matchmakingApi = {
  analyze: (input: { person1: SimplePersonInput; person2: SimplePersonInput }) => {
    const loc1 = parsePlaceOfBirth(input.person1.placeOfBirth);
    const loc2 = parsePlaceOfBirth(input.person2.placeOfBirth);
    return apiPost<any>('/api/matchmaking/analyze', {
      person1Name: input.person1.name ?? 'Person 1',
      person1BirthDate: input.person1.dateOfBirth,
      person1BirthTime: normalizeTime(input.person1.timeOfBirth),
      person1City: loc1.city, person1State: loc1.state, person1Country: loc1.country,
      person2Name: input.person2.name ?? 'Person 2',
      person2BirthDate: input.person2.dateOfBirth,
      person2BirthTime: normalizeTime(input.person2.timeOfBirth),
      person2City: loc2.city, person2State: loc2.state, person2Country: loc2.country,
    }, 90_000); // 90s — GPT-heavy
  },
};

//  geoApi 

export const geoApi = {
  getCoordinates: (cityQuery: string): Promise<CoordinatesResponse> =>
    apiPost<CoordinatesResponse>('/api/geo/coordinates', { city: cityQuery, state: '', country: '' }),

  autocomplete: (input: string) =>
    apiGet<Array<{ description: string; placeId: string }>>(`/api/geo/autocomplete?input=${encodeURIComponent(input)}`),
};

//  paymentsApi 

export const paymentsApi = {
  /** Premium birth-chart prediction – one-time / weekly / monthly */
  chargeForPremium: (req: {
    plan: string;
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>('/api/payments/charge', req),

  /** Q&A package – qna-10 / qna-unlimited */
  chargeForQNA: (req: {
    plan: string;
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>('/api/payments/chargeForQNA', req),

  /** Matchmaking analysis */
  chargeForMatchmaking: (req: {
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
    person1Name: string;
    person1BirthDate: string;
    person1BirthTime: string;
    person1BirthPlace: string;
    person2Name: string;
    person2BirthDate: string;
    person2BirthTime: string;
    person2BirthPlace: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>(
      '/api/payments/chargeForMatchmaking',
      req,
    ),

  /** Numerology deep reading */
  chargeForNumerology: (req: {
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
    birthDate: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>(
      '/api/payments/chargeForNumerology',
      req,
    ),

  /** Gemstone recommendation – $1.99 per prediction */
  chargeForGemstone: (req: {
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
    birthDate: string;
    birthPlace: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>(
      '/api/payments/chargeForGemstone',
      req,
    ),

  /** One-time feature unlocks */
  chargeForFeature: (req: {
    feature: 'palmistry' | 'nakshatra-aura-ar' | 'gemstone-try-ar' | 'soul-sketch';
    amountUsd: number;
    name: string;
    email: string;
    paymentMethodId: string;
  }) =>
    apiPost<{ success: boolean; error?: string }>(
      '/api/payments/chargeForFeature',
      req,
    ),
};

//  numerologyApi 

export const numerologyApi = {
  /** Get detailed numerology insights from the server */
  getDetails: (birthDate: string) =>
    apiPost<{
      lifePathNumber: number;
      destinyNumber: number;
      soulUrgeNumber: number;
      luckyNumbers: number[];
      careerDirection: string;
      lovePrediction: string;
      moneyPrediction: string;
      remedies: string[];
    }>('/api/predictions/get-numerology-details', { birthDate }),
};

// ─── transitApi ───────────────────────────────────────────────────────────────

export const transitApi = {
  getAlerts: (zodiacSign: string) =>
    apiPost<any>('/api/transits/current', { zodiacSign }),
};

// ─── muhuratApi ───────────────────────────────────────────────────────────────

export const muhuratApi = {
  calculate: (req: {
    activityType: string;
    city: string;
    state: string;
    country: string;
    fromDate: string;
    toDate: string;
  }) => apiPost<any>('/api/muhurat/calculate', req),
};

// ─── gemstoneApi ──────────────────────────────────────────────────────────────

export const gemstoneApi = {
  recommend: (req: {
    birthDate: string;
    birthTime: string;
    city: string;
    state: string;
    country: string;
  }) => apiPost<any>('/api/gemstone/recommend', req),
};

// ─── festivalApi ──────────────────────────────────────────────────────────────

export const festivalApi = {
  getCalendar: (month: number, year: number) =>
    apiGet<any>(`/api/festivals/calendar?month=${month}&year=${year}`),
};

// ─── palmistryApi ─────────────────────────────────────────────────────────────

export const palmistryApi = {
  analyzePalm: (imageBase64: string, userName?: string) =>
    apiPost<any>('/api/palmistry/analyze', { imageBase64, userName }, 90_000), // 90s — GPT Vision takes ~40-60s
};

// ─── faceReadingApi ───────────────────────────────────────────────────────────

export const faceReadingApi = {
  analyze: (imageBase64: string, nakshatraName: string, nakshatraPlanet: string) =>
    apiPost<any>('/api/facereading/analyze', { imageBase64, nakshatraName, nakshatraPlanet }, 90_000),
};

// ─── pastLifeApi ──────────────────────────────────────────────────────────────

export const pastLifeApi = {
  analyze: (req: { birthDate: string; birthTime: string; city: string; state: string; country: string }) =>
    apiPost<any>('/api/pastlife/analyze', req, 90_000), // 90s — GPT past-life takes ~40s
};

// ─── soulSketchApi ────────────────────────────────────────────────────────────

export const soulSketchApi = {
  generate: (req: {
    birthDate: string;
    birthTime: string;
    city: string;
    state: string;
    country: string;
    gender: string;
    partnerGender: string;
  }) => apiPost<{
    imageUrl: string;
    visualDescription: string;
    originReading: string;
    marriageAgeReading: string;
    soulmateNarrative: string;
    astroTraits: { label: string; value: string }[];
  }>('/api/soulsketch/generate', req, 120_000), // 120s — GPT + DALL-E takes ~45-90s
};
