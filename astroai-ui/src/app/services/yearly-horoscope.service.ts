import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface YearlyHoroscopeRequest {
  birthDate: string;
  birthTime: string;
  city: string;
  state: string;
  country: string;
  year: number;
  latitude?: number;
  longitude?: number;
  timeZoneId?: string;
}

export interface LifeAreaPrediction {
  area: string;
  score: number;
  overview: string;
  keyPoints: string[];
}

export interface MonthlyHighlight {
  month: number;
  monthName: string;
  careerOutlook: string;
  financeOutlook: string;
  relationshipOutlook: string;
  healthOutlook: string;
  luckyDays: string;
}

export interface KeyDate {
  dateUtc: string;
  event: string;
  significance: string;
  recommendation: string;
}

export interface YearlyHoroscopeResponse {
  year: number;
  overallTheme: string;
  lifeAreas: LifeAreaPrediction[];
  monthlyHighlights: MonthlyHighlight[];
  importantDates: KeyDate[];
  yearlyRemedies: string[];
  dashaTransitions: string;
}

@Injectable({ providedIn: 'root' })
export class YearlyHoroscopeService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/yearlyhoroscope`;

  constructor(private http: HttpClient) {}

  generateYearlyHoroscope(request: YearlyHoroscopeRequest): Observable<YearlyHoroscopeResponse> {
    return this.http.post<YearlyHoroscopeResponse>(`${this.baseUrl}/generate`, request);
  }
}
