import { Component, OnInit, OnDestroy } from '@angular/core';
import { YearlyHoroscopeService, YearlyHoroscopeRequest, YearlyHoroscopeResponse } from '../../services/yearly-horoscope.service';
import { Router } from '@angular/router';
/* ⭐ ADDED — autocomplete imports */
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-yearly-horoscope',
  templateUrl: './yearly-horoscope.component.html',
  styleUrls: ['./yearly-horoscope.component.scss']
})
export class YearlyHoroscopeComponent implements OnInit, OnDestroy {

  birthDetails = {
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  };

  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  loading = false;
  error = '';
  result: YearlyHoroscopeResponse | null = null;

  /* ⭐ ADDED — autocomplete state */
  placeSuggestions: PlaceSuggestion[] = [];
  showSuggestions = false;
  private destroy$ = new Subject<void>();

  /* ⭐ CHANGED — inject HoroscopeService */
  constructor(
    private yearlyHoroscopeService: YearlyHoroscopeService,
    private horoscope: HoroscopeService,
     private router: Router
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 1; i <= currentYear + 5; i++) {
      this.availableYears.push(i);
    }
  }

  /* ⭐ ADDED — lifecycle */
  ngOnInit(): void {}

  /* ⭐ ADDED — cleanup */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ⭐ ADDED — autocomplete search */
  onPlaceInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (!value || value.length < 3) {
    this.placeSuggestions = [];
    this.showSuggestions = false;
    return;
  }

  this.horoscope.getPlaceSuggestions(value)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: suggestions => {
        this.placeSuggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
      },
      error: () => {
        this.placeSuggestions = [];
        this.showSuggestions = false;
      }
    });

    

    this.horoscope.getPlaceSuggestions(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: suggestions => {
          this.placeSuggestions = suggestions;
          this.showSuggestions = suggestions.length > 0;
        },
        error: () => {
          this.placeSuggestions = [];
          this.showSuggestions = false;
        }
      });
  }

  /* ⭐ ADDED — suggestion select */
  onPlaceSuggestionSelected(suggestion: PlaceSuggestion): void {
    this.birthDetails.birthPlace = suggestion.description;
    this.placeSuggestions = [];
    this.showSuggestions = false;
  }

  /* ⭐ ADDED — hide dropdown */
  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onGenerate(): void {
    if (!this.validateInputs()) return;

    this.loading = true;
    this.error = '';
    this.result = null;

    const place = this.parsePlace(this.birthDetails.birthPlace);

    const request: YearlyHoroscopeRequest = {
      birthDate: this.birthDetails.birthDate,
      birthTime: this.birthDetails.birthTime + ':00',
      city: place.city,
      state: place.state,
      country: place.country,
      year: this.selectedYear
    };

    this.yearlyHoroscopeService.generateYearlyHoroscope(request).subscribe({
      next: (response) => {
        this.result = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to generate yearly horoscope. Please try again.';
        this.loading = false;
      }
    });
  }

  validateInputs(): boolean {
    if (!this.birthDetails.name ||
        !this.birthDetails.birthDate ||
        !this.birthDetails.birthTime ||
        !this.birthDetails.birthPlace) {
      this.error = 'Please fill in all fields';
      return false;
    }
    return true;
  }

  /* ⭐ CHANGED — safer parsing like BirthChart */
  parsePlace(place: string): { city: string; state: string; country: string } {
    const parts = place.split(',').map(p => p.trim()).filter(Boolean);

    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[2] || ''
    };
  }

  getScoreColor(score: number): string {
    if (score >= 7) return '#28a745';
    if (score >= 4) return '#ffc107';
    return '#dc3545';
  }

  reset(): void {
    this.result = null;
    this.error = '';
  }
      getPersonalizedReading(): void {
    this.router.navigate(['/birth-chart']);
  }
}