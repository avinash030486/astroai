import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Request to backend South Indian chart API
export interface BirthChartRequest {
  city: string;
  state: string;
  country: string;
  birthDate: string; // yyyy-MM-dd
  birthTime: string; // HH:mm:ss
  latitude?: number | null;
  longitude?: number | null;
  timeZoneId?: string | null;
}

// Response models mirroring IKpHoroscopeService.cs
export interface House {
  number: number;
  sign: string;
  occupants: string[];
  rasiLord: string;
  nakshatra: string;
  nakshatraLord: string;
  subLord: string;
  subSubLord: string;
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  siderealLongitude: number;
  sign: string;
  house: number;
  rasiLord: string;
  nakshatra: string;
  nakshatraLord: string;
  subLord: string;
  subSubLord: string;
}

export interface SouthIndianChart {
  ayanamshaName: string;
  ayanamshaDegrees: number;
  ascendantSiderealLongitude: number;
  ascendantSign: string;
  birthDateTimeUtc: string; // ISO datetime string
  currentDateTimeUtc: string; // ISO datetime string
  houses: House[];
  planets: PlanetPosition[];
}

export interface AskQuestionRequest {
  city: string;
  state: string;
  country: string;
  birthDate: string;   // yyyy-MM-dd
  birthTime: string;   // HH:mm:ss
  question: string;
  latitude?: number | null;
  longitude?: number | null;
  timeZoneId?: string | null;
}

export interface AskQuestionResponse {
  summary: string;
  answer: string;
  cautions: string;
}

export interface PlaceSuggestion {
  description: string;
  placeId: string;
}

export interface NumerologyRequest {
  birthDate: string; // yyyy-MM-dd
}

export interface NumerologyDetailsResponse {
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  luckyNumbers: number[];
  careerDirection: string;
  lovePrediction: string;
  moneyPrediction: string;
  remedies: string[];
}

@Injectable({ providedIn: 'root' })
export class HoroscopeService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  generateSouthIndianChart(req: BirthChartRequest): Observable<SouthIndianChart> {
    return this.http.post<SouthIndianChart>(`${this.baseUrl}/horoscope/south-indian`, req);
  }

  askQuestion(req: AskQuestionRequest): Observable<AskQuestionResponse> {
    return this.http.post<AskQuestionResponse>(`${this.baseUrl}/horoscope/ask`, req);
  }

  getPlaceSuggestions(input: string): Observable<PlaceSuggestion[]> {
    return this.http.get<PlaceSuggestion[]>(`${this.baseUrl}/geo/autocomplete?input=${encodeURIComponent(input)}`);
  }

  getNumerologyDetails(req: NumerologyRequest): Observable<NumerologyDetailsResponse> {
    return this.http.post<NumerologyDetailsResponse>(`${this.baseUrl}/predictions/get-numerology-details`, req);
  }
}
