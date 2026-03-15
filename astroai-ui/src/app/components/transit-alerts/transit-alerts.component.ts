import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_EMOJIS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
};

export interface PlanetaryTransit {
  planet: string;
  transitSign: string;
  effect: string;
  intensity: 'High' | 'Medium' | 'Low';
  duration: string;
  advice: string;
}

export interface TransitAlertsResponse {
  zodiacSign: string;
  asOfDate: string;
  overallTheme: string;
  transits: PlanetaryTransit[];
  keyOpportunities: string;
  keyChallenges: string;
}

@Component({
  selector: 'app-transit-alerts',
  templateUrl: './transit-alerts.component.html',
  styleUrls: ['./transit-alerts.component.scss']
})
export class TransitAlertsComponent {
  readonly signs = SIGNS;
  readonly signEmojis = SIGN_EMOJIS;

  selectedSign = 'Aries';
  loading = false;
  error = '';
  result: TransitAlertsResponse | null = null;

  constructor(private http: HttpClient) {}

  getAlerts(): void {
    this.loading = true;
    this.error = '';
    this.result = null;

    this.http.post<TransitAlertsResponse>(
      `${environment.apiBaseUrl}/api/transits/current`,
      { zodiacSign: this.selectedSign }
    ).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => { this.error = err?.error?.error ?? 'Failed to fetch transit alerts.'; this.loading = false; }
    });
  }

  intensityClass(i: string): string {
    return i === 'High' ? 'high' : i === 'Medium' ? 'medium' : 'low';
  }
}
