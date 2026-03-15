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

  // Generate basic chart prediction.
  // The predictions endpoint requires pre-calculated chart data (planets, houses,
  // ascendant, ayanamsha). We get that by calling /horoscope/south-indian first,
  // then pass the full chart response directly to the predictions endpoint.
  generateBasicChartPrediction: async (input: SimplePersonInput) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    const birthTime = normalizeTime(input.timeOfBirth);
    // Step 1 — calculate natal chart (planetary positions, houses, ascendant)
    const chart = await apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.dateOfBirth,
      birthTime,
      ...loc,
    });
    // Step 2 — GPT-based prediction using the computed chart
    return apiPost<any>('/api/predictions/generate-basic-chart-prediction', chart);
  },

  // Generate detailed prediction (for Yogas) — same two-step approach
  generateDetailedPrediction: async (input: SimplePersonInput) => {
    const loc = parsePlaceOfBirth(input.placeOfBirth);
    const birthTime = normalizeTime(input.timeOfBirth);
    // Step 1 — calculate natal chart
    const chart = await apiPost<any>('/api/horoscope/south-indian', {
      birthDate: input.dateOfBirth,
      birthTime,
      ...loc,
    });
    // Step 2 — detailed GPT prediction
    return apiPost<any>('/api/predictions/generate-detailed-prediction', chart);
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
    });
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
    });
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
    });
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
