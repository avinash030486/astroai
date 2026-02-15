import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatchmakingService, MatchmakingRequest, MatchmakingResponse } from 'src/app/services/matchmaking.service';
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';
import { PaymentService, MatchmakingPaymentRequest } from '../../services/payment.service';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';

declare const Stripe: any;

@Component({
  selector: 'app-matchmaking',
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  result: MatchmakingResponse | null = null;

  person1 = {
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  };

  person2 = {
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  };

  // Autocomplete state
  person1PlaceSuggestions: PlaceSuggestion[] = [];
  person2PlaceSuggestions: PlaceSuggestion[] = [];
  showPerson1Suggestions = false;
  showPerson2Suggestions = false;
  private person1PlaceInput$ = new Subject<string>();
  private person2PlaceInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Payment state
  showPaymentPopup = false;
  paymentLoading = false;
  paymentError = '';
  paymentName = '';
  paymentEmail = '';
  cardError = '';
  private stripe: any;
  private cardElement: any;
  hasPaid = false;

  // Currency state
  currentCurrency: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar' };
  selectedCurrency = 'USD';
  priceUsd = 1.99;
  priceConverted = 1.99;

  constructor(
    private matchmakingService: MatchmakingService,
    private horoscope: HoroscopeService,
    private payments: PaymentService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    // Check if user has already paid
    const paidStatus = sessionStorage.getItem('astroai_matchmaking_paid');
    this.hasPaid = paidStatus === 'true';

    // Initialize Stripe
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe('pk_live_51SkYakPpSmZFXw4WZvXp8z7nLyOJmZReFnCtSqUnolgOWoDInuY8FhcJ0HRdbU5pKr3PLFSAj1ACkyktccWcdWmI00WrSAKFpD');
    }

    // Subscribe to currency changes
    this.currencyService.getCurrentCurrency().pipe(
      takeUntil(this.destroy$)
    ).subscribe(currency => {
      this.currentCurrency = currency;
      this.selectedCurrency = currency.code;
      this.updateConvertedPrice();
    });

    // Set up autocomplete for Person 1 birth place
    this.person1PlaceInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => value.length >= 3),
      switchMap(value => this.horoscope.getPlaceSuggestions(value)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (suggestions) => {
        this.person1PlaceSuggestions = suggestions;
        this.showPerson1Suggestions = suggestions.length > 0;
      },
      error: () => {
        this.person1PlaceSuggestions = [];
        this.showPerson1Suggestions = false;
      }
    });

    // Set up autocomplete for Person 2 birth place
    this.person2PlaceInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => value.length >= 3),
      switchMap(value => this.horoscope.getPlaceSuggestions(value)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (suggestions) => {
        this.person2PlaceSuggestions = suggestions;
        this.showPerson2Suggestions = suggestions.length > 0;
      },
      error: () => {
        this.person2PlaceSuggestions = [];
        this.showPerson2Suggestions = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
  }

  private updateConvertedPrice(): void {
    this.currencyService.convertFromUSD(this.priceUsd)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.priceConverted = result.amount;
      });
  }

  formatPrice(amount: number): string {
    return this.currencyService.formatAmount(amount, this.currentCurrency.code);
  }

  getDisplayPrice(): string {
    return this.formatPrice(this.priceConverted);
  }

  onPerson1PlaceInput(value: string): void {
    this.person1PlaceInput$.next(value);
  }

  onPerson2PlaceInput(value: string): void {
    this.person2PlaceInput$.next(value);
  }

  onPerson1PlaceSelected(suggestion: PlaceSuggestion): void {
    this.person1.birthPlace = suggestion.description;
    this.person1PlaceSuggestions = [];
    this.showPerson1Suggestions = false;
  }

  onPerson2PlaceSelected(suggestion: PlaceSuggestion): void {
    this.person2.birthPlace = suggestion.description;
    this.person2PlaceSuggestions = [];
    this.showPerson2Suggestions = false;
  }

  hidePerson1Suggestions(): void {
    setTimeout(() => {
      this.showPerson1Suggestions = false;
    }, 200);
  }

  hidePerson2Suggestions(): void {
    setTimeout(() => {
      this.showPerson2Suggestions = false;
    }, 200);
  }

  onAnalyze(): void {
    if (!this.validateInputs()) return;

    // Check if user has paid
    if (!this.hasPaid) {
      this.showPaymentPopup = true;
      this.initializeStripeCard();
      return;
    }

    this.performAnalysis();
  }

  private performAnalysis(): void {
    this.loading = true;
    this.error = '';
    this.result = null;

    const request: MatchmakingRequest = {
      person1Name: this.person1.name,
      person1BirthDate: this.person1.birthDate,
      person1BirthTime: this.person1.birthTime + ':00',
      ...this.parsePlace(this.person1.birthPlace, 'person1'),
      
      person2Name: this.person2.name,
      person2BirthDate: this.person2.birthDate,
      person2BirthTime: this.person2.birthTime + ':00',
      ...this.parsePlace(this.person2.birthPlace, 'person2')
    };

    this.matchmakingService.analyzeCompatibility(request).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to generate compatibility analysis. Please try again.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  private validateInputs(): boolean {
    if (!this.person1.name || !this.person1.birthDate || !this.person1.birthTime || !this.person1.birthPlace) {
      this.error = 'Please fill all fields for Person 1';
      return false;
    }
    if (!this.person2.name || !this.person2.birthDate || !this.person2.birthTime || !this.person2.birthPlace) {
      this.error = 'Please fill all fields for Person 2';
      return false;
    }
    return true;
  }

  private parsePlace(place: string, prefix: string): any {
    const parts = place.split(',').map(p => p.trim());
    const result: any = {};
    result[`${prefix}City`] = parts[0] || '';
    result[`${prefix}State`] = parts[1] || '';
    result[`${prefix}Country`] = parts[2] || '';
    return result;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  reset(): void {
    this.person1 = { name: '', birthDate: '', birthTime: '', birthPlace: '' };
    this.person2 = { name: '', birthDate: '', birthTime: '', birthPlace: '' };
    this.result = null;
    this.error = '';
  }

  // Payment methods
  closePaymentPopup(): void {
    this.showPaymentPopup = false;
    this.paymentError = '';
    this.cardError = '';
  }

  private initializeStripeCard(): void {
    setTimeout(() => {
      if (!this.stripe || this.cardElement) return;

      const elements = this.stripe.elements();
      this.cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            '::placeholder': { color: '#aab7c4' }
          }
        }
      });
      
      const cardElementDiv = document.getElementById('matchmaking-card-element');
      if (cardElementDiv) {
        this.cardElement.mount('#matchmaking-card-element');
        this.cardElement.on('change', (event: any) => {
          this.cardError = event.error ? event.error.message : '';
        });
      }
    }, 100);
  }

  async confirmPurchase(): Promise<void> {
    if (!this.paymentName || !this.paymentEmail) {
      this.paymentError = 'Please enter your name and email.';
      return;
    }

    if (!this.cardElement) {
      this.paymentError = 'Card element not initialized.';
      return;
    }

    this.paymentLoading = true;
    this.paymentError = '';

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.paymentName,
          email: this.paymentEmail
        }
      });

      if (error) {
        this.paymentError = error.message;
        this.paymentLoading = false;
        return;
      }

      const request: MatchmakingPaymentRequest = {
        amountUsd: this.priceUsd,
        name: this.paymentName,
        email: this.paymentEmail,
        paymentMethodId: paymentMethod.id,
        person1Name: this.person1.name,
        person1BirthDate: this.person1.birthDate,
        person1BirthTime: this.person1.birthTime,
        person1BirthPlace: this.person1.birthPlace,
        person2Name: this.person2.name,
        person2BirthDate: this.person2.birthDate,
        person2BirthTime: this.person2.birthTime,
        person2BirthPlace: this.person2.birthPlace
      };

      this.payments.chargeForMatchmaking(request).subscribe({
        next: result => {
          if (result.success) {
            this.paymentLoading = false;
            this.showPaymentPopup = false;
            this.hasPaid = true;
            sessionStorage.setItem('astroai_matchmaking_paid', 'true');
            this.performAnalysis();
          } else {
            this.paymentError = result.error || 'Payment failed. Please try again.';
            this.paymentLoading = false;
          }
        },
        error: err => {
          console.error(err);
          this.paymentLoading = false;
          const backendError = (err && err.error) ? (
            err.error.error ||
            err.error.Error ||
            err.error.message ||
            err.error.Message
          ) : null;
          this.paymentError = backendError || 'Payment request failed. Please check your connection and try again.';
        }
      });
    } catch (err: any) {
      this.paymentError = err.message || 'An error occurred during payment.';
      this.paymentLoading = false;
    }
  }
}
