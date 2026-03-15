import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_EMOJIS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
};
const SIGN_ELEMENTS: Record<string, string> = {
  Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water',
  Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water',
  Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water'
};

// Kept for backward compat with existing POST endpoint
export interface PlanetaryTransit {
  planet: string; transitSign: string; effect: string;
  intensity: 'High' | 'Medium' | 'Low'; duration: string; advice: string;
}
export interface TransitAlertsResponse {
  zodiacSign: string; asOfDate: string; overallTheme: string;
  transits: PlanetaryTransit[]; keyOpportunities: string; keyChallenges: string;
}

// New interfaces
interface ZodiacSummary { sign: string; emoji: string; summary: string; dominantPlanet: string; energy: 'Favorable'|'Neutral'|'Challenging'; }
interface LifeAreaDetail { score: number; summary: string; advice: string; }
interface WeekDayForecast { day: string; date: string; energy: 'Good'|'Neutral'|'Caution'; tip: string; }
interface KeyPlanetInfo { planet: string; role: string; effect: string; }
interface DetailedTransitResult {
  sign: string; emoji: string; date: string;
  overallEnergy: 'Favorable'|'Neutral'|'Challenging'; energyScore: number; headline: string;
  currentTransits: PlanetaryTransit[];
  career: LifeAreaDetail; love: LifeAreaDetail; finance: LifeAreaDetail;
  health: LifeAreaDetail; spirituality: LifeAreaDetail;
  weeklyForecast: WeekDayForecast[]; keyPlanets: KeyPlanetInfo[];
  luckyNumbers: number[]; luckyColors: string[]; luckyGemstone: string;
  remedies: string[]; opportunities: string[]; cautionAreas: string[];
}
interface MonthlyWeek { weekNumber: number; dateRange: string; theme: string; highlights: string[]; challenges: string[]; energy: 'Favorable'|'Neutral'|'Challenging'; }
interface MonthlyTransitResult { sign: string; month: string; monthlyTheme: string; overallScore: number; weeks: MonthlyWeek[]; importantDates: {date:string;significance:string}[]; monthlyAdvice: string; }

@Component({
  selector: 'app-transit-alerts',
  templateUrl: './transit-alerts.component.html',
  styleUrls: ['./transit-alerts.component.scss']
})
export class TransitAlertsComponent implements OnInit, OnDestroy {
  readonly signs = SIGNS;
  readonly signEmojis = SIGN_EMOJIS;
  readonly signElements = SIGN_ELEMENTS;

  zodiacSummaries: ZodiacSummary[] = [];
  summariesLoading = false;

  selectedSign = '';
  detailLoading = false;
  detailResult: DetailedTransitResult | null = null;
  detailError = '';

  monthlyLoading = false;
  monthlyResult: MonthlyTransitResult | null = null;

  activeTab: 'overview' | 'weekly' | 'monthly' = 'overview';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSummaries();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const sign = params.get('sign');
      if (sign) {
        const matched = SIGNS.find(s => s.toLowerCase() === sign.toLowerCase());
        if (matched && matched !== this.selectedSign) this.selectSign(matched);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadSummaries(): void {
    this.summariesLoading = true;
    this.http.get<ZodiacSummary[]>(`${environment.apiBaseUrl}/api/transits/zodiac-summaries`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.zodiacSummaries = data; this.summariesLoading = false; },
        error: () => { this.summariesLoading = false; }
      });
  }

  selectSign(sign: string): void {
    this.selectedSign = sign;
    this.detailResult = null;
    this.monthlyResult = null;
    this.activeTab = 'overview';
    this.detailError = '';
    this.router.navigate(['/transit-alerts', sign.toLowerCase()], { replaceUrl: true });
    this.loadDetail(sign);
  }

  private loadDetail(sign: string): void {
    this.detailLoading = true;
    this.http.get<DetailedTransitResult>(`${environment.apiBaseUrl}/api/transits/${sign}/detail`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.detailResult = data; this.detailLoading = false; },
        error: err => { this.detailError = err?.error?.error ?? 'Failed to load transit data.'; this.detailLoading = false; }
      });
  }

  setTab(tab: 'overview' | 'weekly' | 'monthly'): void {
    this.activeTab = tab;
    if (tab === 'monthly' && !this.monthlyResult && !this.monthlyLoading) this.loadMonthly();
  }

  private loadMonthly(): void {
    this.monthlyLoading = true;
    this.http.get<MonthlyTransitResult>(`${environment.apiBaseUrl}/api/transits/${this.selectedSign}/monthly`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.monthlyResult = data; this.monthlyLoading = false; },
        error: () => { this.monthlyLoading = false; }
      });
  }

  getSummary(sign: string): ZodiacSummary | undefined {
    return this.zodiacSummaries.find(s => s.sign === sign);
  }

  energyClass(e: string): string {
    return e === 'Favorable' ? 'favorable' : e === 'Challenging' ? 'challenging' : 'neutral';
  }

  scoreColor(s: number): string {
    return s >= 7 ? '#2ecc71' : s >= 4 ? '#f39c12' : '#e74c3c';
  }

  intensityClass(i: string): string {
    return i === 'High' ? 'high' : i === 'Low' ? 'low' : 'medium';
  }

  dayEnergyClass(e: string): string {
    return e === 'Good' ? 'good' : e === 'Caution' ? 'caution' : 'neutral';
  }

  lifeArea(key: string): LifeAreaDetail | null {
    if (!this.detailResult) return null;
    return (this.detailResult as any)[key] as LifeAreaDetail;
  }
}
