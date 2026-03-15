import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';
import { PaymentService } from '../../services/payment.service';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

declare const Stripe: any;

export interface GemstoneRecommendation {
  gemstoneName: string;
  planet: string;
  metal: string;
  finger: string;
  weight: string;
  benefits: string;
  howToWear: string;
  bestDay: string;
  cautions: string;
  priority: number;
}

export interface GemstoneResponse {
  chartSummary: string;
  primaryGemstone: string;
  recommendations: GemstoneRecommendation[];
  generalAdvice: string;
}

@Component({
  selector: 'app-gemstone-engine',
  templateUrl: './gemstone-engine.component.html',
  styleUrls: ['./gemstone-engine.component.scss']
})
export class GemstoneEngineComponent implements OnInit, OnDestroy {
  // Form
  birthDate = '';
  birthTime = '06:00';
  birthPlace = '';

  // Place autocomplete
  placeSuggestions: PlaceSuggestion[] = [];
  showSuggestions = false;
  private placeInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Payment
  showPaymentPopup = false;
  paymentLoading = false;
  paymentError = '';
  paymentName = '';
  paymentEmail = '';
  cardError = '';
  showGooglePay = false;
  private stripe: any;
  private cardElement: any;
  private paymentRequest: any;
  private prButton: any;

  // Currency
  currentCurrency: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar' };
  priceUsd = 1.99;
  priceConverted = 1.99;

  // Result
  loading = false;
  error = '';
  result: GemstoneResponse | null = null;
  expandedCard: number | null = null;

  constructor(
    private http: HttpClient,
    private horoscope: HoroscopeService,
    private payments: PaymentService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe('pk_live_51SkYakPpSmZFXw4WZvXp8z7nLyOJmZReFnCtSqUnolgOWoDInuY8FhcJ0HRdbU5pKr3PLFSAj1ACkyktccWcdWmI00WrSAKFpD');
    }

    this.currencyService.getCurrentCurrency().pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.currentCurrency = c;
      this.currencyService.convertFromUSD(this.priceUsd).pipe(takeUntil(this.destroy$)).subscribe(r => {
        this.priceConverted = r.amount;
      });
    });

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
    if (this.cardElement) { try { this.cardElement.unmount(); } catch (_) {} this.cardElement = null; }
    if (this.prButton) { try { this.prButton.unmount(); } catch (_) {} this.prButton = null; }
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

  getDisplayPrice(): string {
    return this.currencyService.formatAmount(this.priceConverted, this.currentCurrency.code);
  }

  getRecommendations(): void {
    if (!this.birthDate) { this.error = 'Please enter your birth date.'; return; }
    if (!this.birthPlace.trim()) { this.error = 'Please enter your birth place.'; return; }
    this.error = '';
    this.showPaymentPopup = true;
    this.initStripeCard();
  }

  closePaymentPopup(): void {
    this.showPaymentPopup = false;
    this.paymentError = '';
    this.cardError = '';
    if (this.cardElement) { try { this.cardElement.unmount(); } catch (_) {} this.cardElement = null; }
    if (this.prButton) { try { this.prButton.unmount(); } catch (_) {} this.prButton = null; }
    this.paymentRequest = null;
    this.showGooglePay = false;
  }

  private initStripeCard(): void {
    setTimeout(() => {
      if (!this.stripe || this.cardElement) return;
      const elements = this.stripe.elements();
      this.cardElement = elements.create('card', {
        style: {
          base: { fontSize: '16px', color: '#ffffff', '::placeholder': { color: '#aab7c4' }, backgroundColor: 'transparent' },
          invalid: { color: '#e74c3c' }
        }
      });
      const el = document.getElementById('gemstone-card-element');
      if (el) {
        this.cardElement.mount('#gemstone-card-element');
        this.cardElement.on('change', (e: any) => { this.cardError = e.error ? e.error.message : ''; });
      }

      // Google Pay / Apple Pay via Payment Request Button
      const pr = this.stripe.paymentRequest({
        country: 'US', currency: 'usd',
        total: { label: 'AstroAI Gemstone Report', amount: Math.round(this.priceUsd * 100) },
        requestPayerName: true, requestPayerEmail: true,
      });
      pr.canMakePayment().then((result: any) => {
        if (result) {
          this.showGooglePay = true;
          this.paymentRequest = pr;
          const prElements = this.stripe.elements();
          this.prButton = prElements.create('paymentRequestButton', {
            paymentRequest: pr,
            style: { paymentRequestButton: { type: 'buy', theme: 'dark', height: '48px' } }
          });
          setTimeout(() => {
            const btn = document.getElementById('gemstone-pr-button');
            if (btn) this.prButton.mount('#gemstone-pr-button');
          }, 50);
        }
      });
      pr.on('paymentmethod', (ev: any) => {
        this.paymentLoading = true;
        this.paymentError = '';
        this.payments.chargeForGemstone({
          amountUsd: this.priceUsd, name: ev.payerName || '', email: ev.payerEmail || '',
          paymentMethodId: ev.paymentMethod.id,
          birthDate: this.birthDate, birthPlace: this.birthPlace
        }).subscribe({
          next: r => {
            if (r.success) {
              ev.complete('success');
              this.paymentLoading = false;
              this.showPaymentPopup = false;
              if (this.cardElement) { try { this.cardElement.unmount(); } catch (_) {} this.cardElement = null; }
              this.performAnalysis();
            } else { ev.complete('fail'); this.paymentError = r.error || 'Payment failed.'; this.paymentLoading = false; }
          },
          error: () => { ev.complete('fail'); this.paymentError = 'Payment failed.'; this.paymentLoading = false; }
        });
      });
    }, 150);
  }

  async confirmPurchase(): Promise<void> {
    if (!this.paymentName.trim() || !this.paymentEmail.trim()) {
      this.paymentError = 'Please enter your name and email.';
      return;
    }
    if (!this.cardElement) { this.paymentError = 'Card element not ready. Please wait.'; return; }

    this.paymentLoading = true;
    this.paymentError = '';

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: { name: this.paymentName, email: this.paymentEmail }
      });

      if (error) { this.paymentError = error.message; this.paymentLoading = false; return; }

      this.payments.chargeForGemstone({
        amountUsd: this.priceUsd,
        name: this.paymentName,
        email: this.paymentEmail,
        paymentMethodId: paymentMethod.id,
        birthDate: this.birthDate,
        birthPlace: this.birthPlace
      }).subscribe({
        next: r => {
          this.paymentLoading = false;
          if (r.success) {
            this.showPaymentPopup = false;
            if (this.cardElement) { try { this.cardElement.unmount(); } catch (_) {} this.cardElement = null; }
            this.performAnalysis();
          } else {
            this.paymentError = r.error || 'Payment failed. Please try again.';
          }
        },
        error: err => {
          const msg = err?.error?.error || err?.error?.Error || err?.error?.message || 'Payment failed. Please try again.';
          this.paymentError = msg;
          this.paymentLoading = false;
        }
      });
    } catch (e: any) {
      this.paymentError = e.message || 'An error occurred.';
      this.paymentLoading = false;
    }
  }

  private parsePlace(): { city: string; state: string; country: string } {
    const parts = this.birthPlace.split(',').map(p => p.trim());
    return { city: parts[0] || '', state: parts[1] || '', country: parts[2] || '' };
  }

  private performAnalysis(): void {
    const { city, state, country } = this.parsePlace();
    const timeStr = /^\d{2}:\d{2}$/.test(this.birthTime) ? this.birthTime + ':00' : this.birthTime;
    this.loading = true;
    this.error = '';
    this.result = null;

    this.http.post<GemstoneResponse>(
      `${environment.apiBaseUrl}/api/gemstone/recommend`,
      { birthDate: this.birthDate, birthTime: timeStr, city, state, country }
    ).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => { this.error = err?.error?.error ?? 'Failed to get gemstone recommendations.'; this.loading = false; }
    });
  }

  toggleCard(i: number): void {
    this.expandedCard = this.expandedCard === i ? null : i;
  }

  priorityLabel(p: number): string {
    if (p === 1) return 'Primary';
    if (p === 2) return 'Secondary';
    return 'Optional';
  }

  priorityClass(p: number): string {
    if (p === 1) return 'priority-1';
    if (p === 2) return 'priority-2';
    return 'priority-3';
  }

  reset(): void { this.result = null; this.error = ''; }
}
