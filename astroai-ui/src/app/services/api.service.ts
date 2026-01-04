import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface NatalRequest {
  fullName: string;
  birthDate: string; // yyyy-MM-dd
  birthTime: string; // HH:mm:ss
  birthPlace: string;
  focusArea: string; // e.g., career, love
}

export interface HoroscopeRequest {
  zodiacSign: string;
  period: 'daily' | 'weekly' | 'monthly';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  natal(req: NatalRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/predictions/natal`, req);
  }

  horoscope(req: HoroscopeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/predictions/horoscope`, req);
  }
}
