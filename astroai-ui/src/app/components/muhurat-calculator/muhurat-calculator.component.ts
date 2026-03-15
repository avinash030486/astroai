import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

const ACTIVITIES = [
  'Marriage','Business Launch','Property Purchase','Travel','Education / Study',
  'Medical Surgery','Investment','Job / Interview','Vehicle Purchase','House Warming',
  'Naming Ceremony','Thread Ceremony (Upanayanam)'
];

export interface MuhuratWindow {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  planetarySupport: string;
  auspiciousElements: string;
  reason: string;
}

export interface MuhuratResponse {
  activityType: string;
  location: string;
  bestDate: string;
  bestTime: string;
  windows: MuhuratWindow[];
  generalAdvice: string;
}

@Component({
  selector: 'app-muhurat-calculator',
  templateUrl: './muhurat-calculator.component.html',
  styleUrls: ['./muhurat-calculator.component.scss']
})
export class MuhuratCalculatorComponent implements OnInit, OnDestroy {
  readonly activities = ACTIVITIES;

  activityType = 'Marriage';
  birthPlace = '';
  fromDate = '';
  toDate = '';

  // Autocomplete
  placeSuggestions: PlaceSuggestion[] = [];
  showSuggestions = false;
  private placeInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  loading = false;
  error = '';
  result: MuhuratResponse | null = null;

  constructor(private http: HttpClient, private horoscope: HoroscopeService) {
    const today = new Date();
    const next30 = new Date();
    next30.setDate(today.getDate() + 30);
    this.fromDate = today.toISOString().split('T')[0];
    this.toDate = next30.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.placeInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => v.length >= 3),
      switchMap(v => this.horoscope.getPlaceSuggestions(v)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: s => { this.placeSuggestions = s; this.showSuggestions = s.length > 0; },
      error: () => { this.placeSuggestions = []; this.showSuggestions = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPlaceInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.birthPlace = val;
    this.placeInput$.next(val);
  }

  onPlaceSelected(s: PlaceSuggestion): void {
    this.birthPlace = s.description;
    this.placeSuggestions = [];
    this.showSuggestions = false;
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  private parsePlace(): { city: string; state: string; country: string } {
    const parts = this.birthPlace.split(',').map(p => p.trim());
    return { city: parts[0] || '', state: parts[1] || '', country: parts[2] || '' };
  }

  calculate(): void {
    if (!this.birthPlace.trim()) { this.error = 'Please enter a location.'; return; }
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    const diff = (to.getTime() - from.getTime()) / 86400000;
    if (diff < 0) { this.error = 'End date must be after start date.'; return; }
    if (diff > 31) { this.error = 'Date range cannot exceed 31 days.'; return; }

    const { city, state, country } = this.parsePlace();
    this.loading = true;
    this.error = '';
    this.result = null;

    this.http.post<MuhuratResponse>(
      `${environment.apiBaseUrl}/api/muhurat/calculate`,
      { activityType: this.activityType, city, state, country, fromDate: this.fromDate, toDate: this.toDate }
    ).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => { this.error = err?.error?.error ?? 'Failed to calculate muhurat timings.'; this.loading = false; }
    });
  }

  scoreStars(score: number): number[] {
    return Array(Math.min(Math.round(score / 20), 5)).fill(0);
  }

  reset(): void { this.result = null; this.error = ''; }
}
