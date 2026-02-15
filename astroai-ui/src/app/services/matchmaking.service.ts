import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MatchmakingRequest {
  person1Name: string;
  person1BirthDate: string;
  person1BirthTime: string;
  person1City: string;
  person1State: string;
  person1Country: string;
  person1Latitude?: number;
  person1Longitude?: number;
  person1TimeZoneId?: string;
  
  person2Name: string;
  person2BirthDate: string;
  person2BirthTime: string;
  person2City: string;
  person2State: string;
  person2Country: string;
  person2Latitude?: number;
  person2Longitude?: number;
  person2TimeZoneId?: string;
}

export interface CompatibilityArea {
  name: string;
  score: number;
  analysis: string;
}

export interface KutaDetail {
  name: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface MatchmakingResponse {
  overallScore: number;
  compatibilityLevel: string;
  synastryAnalysis: string;
  areasOfCompatibility: CompatibilityArea[];
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  nextSteps: string;
  kutaScore: string;
  kutaBreakdown: KutaDetail[];
}

@Injectable({ providedIn: 'root' })
export class MatchmakingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/matchmaking`;

  constructor(private http: HttpClient) {}

  analyzeCompatibility(request: MatchmakingRequest): Observable<MatchmakingResponse> {
    return this.http.post<MatchmakingResponse>(`${this.baseUrl}/analyze`, request);
  }
}
