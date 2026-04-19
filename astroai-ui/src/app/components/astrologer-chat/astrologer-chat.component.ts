import {
  Component, OnInit, OnDestroy, ViewChild,
  ElementRef, AfterViewChecked
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, takeUntil, catchError } from 'rxjs/operators';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { environment } from 'src/environments/environment';
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';

declare const Stripe: any;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tone?: string;
  emoji?: string;
}

@Component({
  selector: 'app-astrologer-chat',
  templateUrl: './astrologer-chat.component.html',
  styleUrls: ['./astrologer-chat.component.scss']
})
export class AstrologerChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  readonly ASTROLOGER_NAME = 'Pandit Arjun';
  readonly FREE_QUESTION_LIMIT = 10;
  readonly SESSION_RATE_USD = 0.50;
  readonly PAID_QUESTION_LIMIT = 50;
  private readonly STORAGE_KEY  = 'pandit_arjun_free_q';
  private readonly SESSION_KEY  = 'pandit_arjun_session';
  private readonly CHART_KEY    = 'pandit_arjun_chart';

  // ── intake form ──────────────────────────────────────────────
  showIntakeForm    = true;
  isGeneratingChart = false;
  intakeError       = '';
  intakeName        = '';
  intakeDob         = '';   // yyyy-MM-dd
  intakeTime        = '';   // HH:MM
  intakePlace       = '';   // "City, State, Country"
  chartContext      = '';   // compact KP chart summary sent with every message

  // ── place autocomplete ─────────────────────────────────────────
  placeSuggestions: PlaceSuggestion[] = [];
  showPlaceSuggestions                = false;
  private placeInput$                 = new Subject<string>();
  private destroy$                    = new Subject<void>();
  chartSummary: { ascendant: string; moon: string; sun: string; maha: string; antar: string } | null = null;

  // ── chat state ───────────────────────────────────────────────
  messages: ChatMessage[] = [];
  inputText = '';
  isLoading  = false;
  isTyping   = false;
  isSpeaking = false;

  // ── free-question tracking ────────────────────────────────────
  freeQuestionsUsed = 0;
  get freeQuestionsRemaining(): number {
    return Math.max(0, this.FREE_QUESTION_LIMIT - this.freeQuestionsUsed);
  }
  get isFreeSession(): boolean {
    return this.freeQuestionsUsed < this.FREE_QUESTION_LIMIT;
  }

  // ── paid session ──────────────────────────────────────────────
  sessionActive        = false;
  sessionQuestionsUsed = 0;
  get sessionQuestionsRemaining(): number {
    return Math.max(0, this.PAID_QUESTION_LIMIT - this.sessionQuestionsUsed);
  }

  // ── payment modal ──────────────────────────────────────────────
  showPaymentModal = false;
  paymentLoading   = false;
  paymentError     = '';
  paymentName      = '';
  paymentEmail     = '';
  cardError        = '';

  // ── currency ───────────────────────────────────────────────────
  currencyInfo: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar' };
  sessionRateConverted = 0.50;

  // ── star positions for bg animation ───────────────────────────
  readonly stars: { x: number; y: number; delay: number; size: number }[];

  // ── Stripe ─────────────────────────────────────────────────────
  private stripe: any;
  private card: any;
  private paymentRequest: any;
  private prButton: any;
  showGooglePay = false;

  private currencySub$?: Subscription;
  private shouldScroll = false;

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('cardMount') cardMount?: ElementRef<HTMLDivElement>;

  constructor(
    private http: HttpClient,
    private currencyService: CurrencyService,
    public auth: AuthService,
    private payments: PaymentService,
    private horoscopeService: HoroscopeService
  ) {
    // Pre-generate 28 random star positions (avoids `Math.random()` in template)
    this.stars = Array.from({ length: 28 }, () => ({
      x:     Math.random() * 100,
      y:     Math.random() * 100,
      delay: Math.random() * 6,
      size:  Math.random() * 2.5 + 1
    }));
  }

  // ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.freeQuestionsUsed = +(localStorage.getItem(this.STORAGE_KEY) ?? 0);
    this.resumeSessionIfValid();

    this.currencySub$ = this.currencyService.getCurrentCurrency().subscribe(ci => {
      this.currencyInfo = ci;
      this.currencyService.convertFromUSD(this.SESSION_RATE_USD)
        .subscribe(r => this.sessionRateConverted = r.amount);
    });

    // Restore chart context from previous session (same browser session)
    const savedChart = sessionStorage.getItem(this.CHART_KEY);
    if (savedChart) {
      try {
        const parsed = JSON.parse(savedChart);
        this.chartContext = parsed.chartContext ?? '';
        this.chartSummary = parsed.summary ?? null;
        this.intakeName   = parsed.name ?? '';
        if (this.chartContext) { this.showIntakeForm = false; }
      } catch { /* ignore */ }
    }

    // Place autocomplete subscription
    this.placeInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => v.length >= 3),
      switchMap(v => this.horoscopeService.getPlaceSuggestions(v).pipe(catchError(() => of([])))),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.placeSuggestions    = suggestions;
      this.showPlaceSuggestions = suggestions.length > 0;
    });

    if (!this.showIntakeForm) {
      this.pushBot(
        `Namaste! 🙏 Welcome back${this.intakeName ? ', ' + this.intakeName : ''}. ` +
        `Your horoscope is still with me. Ask anything — ` +
        (this.isFreeSession
          ? `your ${this.freeQuestionsRemaining} free ${this.freeQuestionsRemaining === 1 ? 'question' : 'questions'} await.`
          : `the stars are listening.`),
        'mystical', '✨'
      );
    }
  }

  // ── intake form submission ─────────────────────────────────────
  submitBirthDetails(): void {
    if (!this.intakeName.trim())  { this.intakeError = 'Please enter your name.';         return; }
    if (!this.intakeDob)          { this.intakeError = 'Please enter your date of birth.'; return; }
    if (!this.intakeTime)         { this.intakeError = 'Please enter your time of birth.'; return; }
    if (!this.intakePlace.trim()) { this.intakeError = 'Please enter your place of birth.'; return; }

    this.intakeError       = '';
    this.isGeneratingChart = true;

    this.http.post<{
      chartContext: string;
      ascendantSign: string;
      moonSign: string;
      sunSign: string;
      currentMahaDasha: string;
      currentAntarDasha: string;
    }>(`${environment.apiBaseUrl}/api/astrologer/cast-chart`, {
      name:         this.intakeName.trim(),
      birthDate:    this.intakeDob,
      birthTime:    this.intakeTime + ':00',
      placeOfBirth: this.intakePlace.trim()
    }).subscribe({
      next: res => {
        this.isGeneratingChart = false;
        this.chartContext = res.chartContext;
        this.chartSummary = {
          ascendant: res.ascendantSign,
          moon:      res.moonSign,
          sun:       res.sunSign,
          maha:      res.currentMahaDasha,
          antar:     res.currentAntarDasha
        };
        // Persist for page refresh
        sessionStorage.setItem(this.CHART_KEY, JSON.stringify({
          chartContext: this.chartContext,
          summary:      this.chartSummary,
          name:         this.intakeName.trim()
        }));
        this.showIntakeForm = false;
        // Auto-send first analysis request to Pandit Arjun
        this.sendFirstReading();
      },
      error: () => {
        this.isGeneratingChart = false;
        this.intakeError = 'Could not generate your horoscope. Please check your details and try again.';
      }
    });
  }

  private sendFirstReading(): void {
    const firstMsg = `Please give me a personalized Vedic astrology reading based on my birth chart. ` +
                     `My name is ${this.intakeName.trim()}.`;
    this.inputText = firstMsg;
    this.sendMessage();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollBottom(); this.shouldScroll = false; }
  }

  ngOnDestroy(): void {
    this.currencySub$?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPlaceInput(value: string): void {
    this.intakePlace = value;
    if (value.length < 3) {
      this.placeSuggestions    = [];
      this.showPlaceSuggestions = false;
      return;
    }
    this.placeInput$.next(value);
  }

  selectPlaceSuggestion(desc: string): void {
    this.intakePlace       = desc;
    this.placeSuggestions  = [];
    this.showPlaceSuggestions = false;
  }

  hidePlaceSuggestions(): void {
    setTimeout(() => { this.showPlaceSuggestions = false; }, 200);
  }

  // ── session resume ────────────────────────────────────────────
  private resumeSessionIfValid(): void {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) return;
      const { questionsUsed } = JSON.parse(raw) as { questionsUsed: number };
      if (questionsUsed < this.PAID_QUESTION_LIMIT) {
        this.sessionActive        = true;
        this.sessionQuestionsUsed = questionsUsed;
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
    } catch { /* ignore corrupt data */ }
  }

  // ── send message ──────────────────────────────────────────────
  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    if (!this.isFreeSession && !this.sessionActive) {
      this.openPaymentModal(); return;
    }

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.inputText   = '';
    this.shouldScroll = true;

    if (this.isFreeSession) {
      this.freeQuestionsUsed++;
      localStorage.setItem(this.STORAGE_KEY, String(this.freeQuestionsUsed));
    } else if (this.sessionActive) {
      this.sessionQuestionsUsed++;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({ questionsUsed: this.sessionQuestionsUsed }));
    }

    this.isLoading  = true;
    this.isTyping   = true;
    this.isSpeaking = true;

    const history = this.messages
      .slice(-11, -1)                              // last 10 turns before current
      .map(m => ({ role: m.role, content: m.content }));

    this.http.post<{ reply: string; tone: string; emoji: string }>(
      `${environment.apiBaseUrl}/api/astrologer/chat`,
      {
        history,
        newMessage: text,
        userName:   this.intakeName || undefined,
        chartContext: this.chartContext || undefined
      }
    ).subscribe({
      next: res => {
        this.isLoading = this.isTyping = false;
        setTimeout(() => this.isSpeaking = false, 1800);
        this.pushBot(res.reply, res.tone, res.emoji);

        // Session quota exhaustion
        if (this.sessionActive && this.sessionQuestionsRemaining === 0) {
          this.sessionActive = false;
          localStorage.removeItem(this.SESSION_KEY);
          setTimeout(() => {
            this.pushBot(
              'Your 50-question session is complete. 🌙 May the stars continue to bless your path. ' +
              'Return whenever you seek cosmic guidance — Pandit Arjun will be here. Om Shanti. 🙏',
              'friendly', '🌙'
            );
          }, 1600);
        }

        // Soft paywall nudge after last free question
        if (!this.isFreeSession && !this.sessionActive && this.sessionQuestionsRemaining === 0) {
          setTimeout(() => {
            this.pushBot(
              `Your free questions have been used, dear seeker. ` +
              `Continue our cosmic journey for just ${this.currencyInfo.symbol}${this.sessionRateConverted.toFixed(2)} per 50 questions — ` +
              `a small offering for a lifetime of celestial guidance. 🌙`,
              'friendly', '💫'
            );
          }, 1600);
        }
      },
      error: () => {
        this.isLoading = this.isTyping = this.isSpeaking = false;
        this.pushBot('The cosmic energies are momentarily disturbed. Please ask again in a moment. 🙏', 'concerned', '🌌');
      }
    });
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  // ── payment ───────────────────────────────────────────────────
  openPaymentModal(): void {
    this.paymentName  = this.auth.getUserName()  || '';
    this.paymentEmail = this.auth.getUserEmail() || '';
    this.paymentError = '';
    this.showPaymentModal = true;
    setTimeout(() => this.mountStripe(), 250);
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentError = '';
    if (this.card) { try { this.card.unmount(); } catch (_) {} this.card = null; }
    if (this.prButton) { try { this.prButton.unmount(); } catch (_) {} this.prButton = null; }
    this.paymentRequest = null;
    this.showGooglePay = false;
  }

  private mountStripe(): void {
    if (!(window as any).Stripe) return;
    const stripeKey = environment.stripePublishableKey;
    if (!stripeKey) { console.error('Stripe publishable key not configured.'); return; }
    if (!this.stripe) { this.stripe = Stripe(stripeKey); }

    // ── Card Element ──────────────────────────────────────────────
    const elements = this.stripe.elements();
    this.card = elements.create('card', {
      style: {
        base: {
          color: '#e8e8e8',
          fontFamily: '"Segoe UI", Tahoma, sans-serif',
          fontSize: '15px',
          '::placeholder': { color: '#777' }
        }
      }
    });
    if (this.cardMount?.nativeElement) {
      this.card.mount(this.cardMount.nativeElement);
      this.card.on('change', (ev: any) => {
        this.cardError = ev.error?.message ?? '';
      });
    }

    // ── Google Pay / Apple Pay Payment Request Button ──────────────
    const pr = this.stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Pandit Arjun – 50-Question Session', amount: Math.round(this.SESSION_RATE_USD * 100) },
      requestPayerName: true,
      requestPayerEmail: true
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
          const btn = document.getElementById('astrologer-pr-button');
          if (btn) this.prButton.mount('#astrologer-pr-button');
        }, 50);
      }
    });
    pr.on('paymentmethod', (ev: any) => {
      this.paymentLoading = true;
      this.paymentError = '';
      this.payments.chargeForAstrologer({
        amountUsd: this.SESSION_RATE_USD,
        name: ev.payerName || this.paymentName,
        email: ev.payerEmail || this.paymentEmail,
        paymentMethodId: ev.paymentMethod.id,
        placeOfBirth: this.intakePlace ?? ''
      }).subscribe({
        next: r => {
          if (r.success) {
            ev.complete('success');
            this.paymentLoading = false;
            this.showPaymentModal = false;
            this.activateSession();
          } else {
            ev.complete('fail');
            this.paymentError = r.error ?? 'Payment failed.';
            this.paymentLoading = false;
          }
        },
        error: () => {
          ev.complete('fail');
          this.paymentError = 'Payment failed. Please try again.';
          this.paymentLoading = false;
        }
      });
    });
  }

  async payAndStart(): Promise<void> {
    if (!this.paymentName || !this.paymentEmail) {
      this.paymentError = 'Please enter your name and email.'; return;
    }
    this.paymentLoading = true;
    this.paymentError   = '';

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card', card: this.card,
        billing_details: { name: this.paymentName, email: this.paymentEmail }
      });
      if (error) { this.paymentError = error.message; this.paymentLoading = false; return; }

      this.payments.chargeForAstrologer({
        amountUsd: this.SESSION_RATE_USD,
        name: this.paymentName,
        email: this.paymentEmail,
        paymentMethodId: paymentMethod.id,
        placeOfBirth: this.intakePlace ?? ''
      }).subscribe({
        next: res => {
          this.paymentLoading = false;
          if (res.success) {
            this.showPaymentModal = false;
            this.activateSession();
          } else {
            this.paymentError = res.error ?? 'Payment failed.';
          }
        },
        error: () => {
          this.paymentLoading = false;
          this.paymentError = 'Payment error. Please try again.';
        }
      });
    } catch {
      this.paymentLoading = false;
      this.paymentError = 'An unexpected error occurred.';
    }
  }

  private activateSession(): void {
    this.sessionActive        = true;
    this.sessionQuestionsUsed = 0;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ questionsUsed: 0 }));
    this.pushBot(
      `Wonderful! Your 50-question consultation session has begun. ✨ ` +
      `May the celestial forces guide our dialogue. Ask me anything — the stars are listening. 🙏`,
      'joyful', '🌟'
    );
  }


  // ── helpers ────────────────────────────────────────────────────
  private pushBot(content: string, tone = 'friendly', emoji = '🙏'): void {
    this.messages.push({ role: 'assistant', content, timestamp: new Date(), tone, emoji });
    this.shouldScroll = true;
  }

  private scrollBottom(): void {
    if (this.chatScroll?.nativeElement) {
      this.chatScroll.nativeElement.scrollTop =
        this.chatScroll.nativeElement.scrollHeight;
    }
  }

  get sessionQuestionsFormatted(): string {
    return `${this.sessionQuestionsRemaining} of ${this.PAID_QUESTION_LIMIT} left`;
  }

  get canSend(): boolean {
    return this.inputText.trim().length > 0 &&
           !this.isLoading &&
           (this.isFreeSession || this.sessionActive);
  }

  get todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  getUserInitial(): string {
    return (this.auth.getUserName() ?? this.auth.getUserEmail() ?? 'U').charAt(0).toUpperCase();
  }

  getUserAvatar(): string | null {
    return (this.auth as any).getUserAvatar?.() ?? null;
  }
}
