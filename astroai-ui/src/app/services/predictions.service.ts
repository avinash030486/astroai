import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SouthIndianChart } from './horoscope.service';

export interface BasicChartPredictionResponse {
  ageYears: number;
  ascendantSummary: string;
  planetaryHighlights: string[];
  currentDasha: string;
  currentAntarDasha: string;
  dashaEffects: string;
  antarEffects: string;
  mahaStartUtc: string;
  mahaEndUtc: string;
  antarStartUtc: string;
  antarEndUtc: string;
  narrative: string;
}

export interface DetailedChartPredictionResponse {
  ageYears: number;
  ascendantSummary: string;
  career: string;
  finance: string;
  relationships: string;
  destiny: string;
  jobWindow: string;
  marriageWindow: string;
  goodYogas: string[];
  badYogas: string[];
  remedies: string[];
  currentDasha: string;
  currentAntarDasha: string;
  dashaEffects: string;
  antarEffects: string;
  mahaStartUtc: string;
  mahaEndUtc: string;
  antarStartUtc: string;
  antarEndUtc: string;
  narrative: string;
}

export interface DailyPrediction {
  sign: string;
  career: string;
  money: string;
  love: string;
}

export interface DailyPredictionsResponse {
  dateUtc: string;
  predictions: DailyPrediction[];
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  resolvedLocation: string;
}

export interface PanchangTimes {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahuKaal: string;
  yamaganda: string;
  gulika: string;
  abhijitMuhurta: string;
}

export interface DailyPanchangResponse {
  dateUtc: string;
  coordinates: GeoPoint;
  weekday: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  moonSign: string;
  sunSign: string;
  times: PanchangTimes;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class PredictionsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  generateBasicChartPrediction(chart: SouthIndianChart): Observable<BasicChartPredictionResponse> {
    // Backend expects the chart metadata as input; we send SouthIndianChart directly.
    return this.http.post<BasicChartPredictionResponse>(`${this.baseUrl}/predictions/generate-basic-chart-prediction`, chart);
  }

  generateDetailedPrediction(chart: SouthIndianChart): Observable<DetailedChartPredictionResponse> {
    return this.http.post<DetailedChartPredictionResponse>(`${this.baseUrl}/predictions/generate-detailed-prediction`, chart);
  }

  getDailyPredictions(): Observable<DailyPredictionsResponse> {
    return this.http.get<DailyPredictionsResponse>(`${this.baseUrl}/predictions/get-daily-predictions`);
  }

  getDailyPanchang(location: string, dateUtc?: string): Observable<DailyPanchangResponse> {
    const body: any = { location };
    if (dateUtc) body.dateUtc = dateUtc;
    return this.http.post<DailyPanchangResponse>(`${this.baseUrl}/predictions/get-daily-panchang`, body);
  }
}
