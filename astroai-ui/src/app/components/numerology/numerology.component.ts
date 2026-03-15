import { Component, OnInit, OnDestroy } from '@angular/core';
import { HoroscopeService, NumerologyDetailsResponse } from 'src/app/services/horoscope.service';
import { PaymentService, NumerologyPaymentRequest } from '../../services/payment.service';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

declare const Stripe: any;

@Component({
  selector: 'app-numerology',
  templateUrl: './numerology.component.html',
  styleUrls: ['./numerology.component.scss']
})
export class NumerologyComponent implements OnInit, OnDestroy {
  birthDate: string = '';
  loading: boolean = false;
  showResults: boolean = false;
  error: string = '';
  
  // Results
  numerologyData: NumerologyDetailsResponse | null = null;

  // Animation states
  showLifePath: boolean = false;
  showDestiny: boolean = false;
  showSoulUrge: boolean = false;
  showLuckyNumbers: boolean = false;
  showCareer: boolean = false;
  showLove: boolean = false;
  showMoney: boolean = false;
  showRemedies: boolean = false;

  // Payment state
  showPaymentPopup = false;
  paymentLoading = false;
  paymentError = '';
  paymentName = '';
  paymentEmail = '';
  cardError = '';
  private stripe: any;
  private cardElement: any;
  showGooglePay = false;
  private paymentRequest: any;
  private prButton: any;
  hasPaid = false;

  // Currency state
  currentCurrency: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar' };
  selectedCurrency = 'USD';
  priceUsd = 1.99;
  priceConverted = 1.99;

  private destroy$ = new Subject<void>();

  constructor(
    private horoscopeService: HoroscopeService,
    private payments: PaymentService,
    private currencyService: CurrencyService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user has already paid
    const paidStatus = sessionStorage.getItem('astroai_numerology_paid');
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

    // Set max date to today
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('birthDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('max', maxDate);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
    if (this.prButton) { try { this.prButton.unmount(); } catch (_) {} this.prButton = null; }
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

  onSubmit(): void {
    if (!this.birthDate) {
      this.error = 'Please select your birth date';
      return;
    }

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
    this.showResults = false;
    this.resetAnimations();

    this.horoscopeService.getNumerologyDetails({ birthDate: this.birthDate })
      .subscribe({
        next: (response) => {
          this.numerologyData = response;
          this.loading = false;
          this.showResults = true;
          this.triggerAnimations();
        },
        error: (err) => {
          console.error('Numerology API error:', err);
          this.error = 'Failed to fetch numerology details. Please try again.';
          this.loading = false;
        }
      });
  }

  resetAnimations(): void {
    this.showLifePath = false;
    this.showDestiny = false;
    this.showSoulUrge = false;
    this.showLuckyNumbers = false;
    this.showCareer = false;
    this.showLove = false;
    this.showMoney = false;
    this.showRemedies = false;
  }

  triggerAnimations(): void {
    // Stagger animations for a dramatic reveal effect
    setTimeout(() => this.showLifePath = true, 200);
    setTimeout(() => this.showDestiny = true, 400);
    setTimeout(() => this.showSoulUrge = true, 600);
    setTimeout(() => this.showLuckyNumbers = true, 800);
    setTimeout(() => this.showCareer = true, 1000);
    setTimeout(() => this.showLove = true, 1200);
    setTimeout(() => this.showMoney = true, 1400);
    setTimeout(() => this.showRemedies = true, 1600);
  }

  getNumberColor(number: number): string {
    const colors: { [key: number]: string } = {
      1: '#FF6B6B',  // Red
      2: '#4ECDC4',  // Teal
      3: '#FFE66D',  // Yellow
      4: '#95E1D3',  // Mint
      5: '#F38181',  // Coral
      6: '#AA96DA',  // Purple
      7: '#FCBAD3',  // Pink
      8: '#A8D8EA',  // Sky Blue
      9: '#FFAAA5',  // Peach
      11: '#C7CEEA', // Light Purple (Master)
      22: '#FFDAB9', // Golden (Master)
      33: '#B5EAD7'  // Sage (Master)
    };
    return colors[number] || '#6C757D';
  }

  isMasterNumber(number: number): boolean {
    return number === 11 || number === 22 || number === 33;
  }

  reset(): void {
    this.birthDate = '';
    this.showResults = false;
    this.numerologyData = null;
    this.error = '';
    this.resetAnimations();
  }

  // Payment methods
  closePaymentPopup(): void {
    this.showPaymentPopup = false;
    this.paymentError = '';
    this.cardError = '';
    if (this.prButton) { try { this.prButton.unmount(); } catch (_) {} this.prButton = null; }
    this.paymentRequest = null;
    this.showGooglePay = false;
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
      
      const cardElementDiv = document.getElementById('numerology-card-element');
      if (cardElementDiv) {
        this.cardElement.mount('#numerology-card-element');
        this.cardElement.on('change', (event: any) => {
          this.cardError = event.error ? event.error.message : '';
        });
      }

      // Google Pay / Apple Pay via Payment Request Button
      const pr = this.stripe.paymentRequest({
        country: 'US', currency: 'usd',
        total: { label: 'AstroAI Numerology Report', amount: Math.round(this.priceUsd * 100) },
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
          const btn = document.getElementById('numerology-pr-button');
          if (btn) this.prButton.mount('#numerology-pr-button');
        }
      });
      pr.on('paymentmethod', (ev: any) => {
        this.paymentLoading = true;
        this.paymentError = '';
        const request: NumerologyPaymentRequest = {
          amountUsd: this.priceUsd,
          name: ev.payerName || '',
          email: ev.payerEmail || '',
          paymentMethodId: ev.paymentMethod.id,
          birthDate: this.birthDate
        };
        this.payments.chargeForNumerology(request).subscribe({
          next: result => {
            if (result.success) {
              ev.complete('success');
              this.paymentLoading = false;
              this.showPaymentPopup = false;
              this.hasPaid = true;
              sessionStorage.setItem('astroai_numerology_paid', 'true');
              this.performAnalysis();
            } else {
              ev.complete('fail');
              this.paymentError = result.error || 'Payment failed.';
              this.paymentLoading = false;
            }
          },
          error: () => { ev.complete('fail'); this.paymentError = 'Payment failed.'; this.paymentLoading = false; }
        });
      });
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

      const request: NumerologyPaymentRequest = {
        amountUsd: this.priceUsd,
        name: this.paymentName,
        email: this.paymentEmail,
        paymentMethodId: paymentMethod.id,
        birthDate: this.birthDate
      };

      this.payments.chargeForNumerology(request).subscribe({
        next: result => {
          if (result.success) {
            this.paymentLoading = false;
            this.showPaymentPopup = false;
            this.hasPaid = true;
            sessionStorage.setItem('astroai_numerology_paid', 'true');
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
      getPersonalizedReading(): void {
    this.router.navigate(['/birth-chart']);
  }
}
