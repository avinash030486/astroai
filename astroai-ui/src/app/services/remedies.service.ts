import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PersonalizedRemediesRequest {
  birthDate: string;
  birthTime: string;
  city: string;
  state: string;
  country: string;
  areasOfConcern: string[];
  latitude?: number;
  longitude?: number;
  timeZoneId?: string;
}

export interface Remedy {
  name: string;
  description: string;
  benefit: string;
  howToPractice: string;
  frequency: string;
  bestTime: string;
  effectivenessScore: number;
}

export interface PersonalizedRemediesResponse {
  chartSummary: string;
  mantras: Remedy[];
  gemstones: Remedy[];
  fastingDays: Remedy[];
  rituals: Remedy[];
  donations: Remedy[];
  lifestyleAdjustments: Remedy[];
  planetaryRemedyPriority: string;
  immediateActions: string[];
}

@Injectable({ providedIn: 'root' })
export class RemediesService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/remedies`;

  constructor(private http: HttpClient) {}

  getPersonalizedRemedies(request: PersonalizedRemediesRequest): Observable<PersonalizedRemediesResponse> {
    return this.http.post<PersonalizedRemediesResponse>(`${this.baseUrl}/personalized`, request);
  }
}
