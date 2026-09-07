import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HoroscopeService, SouthIndianChart, AskQuestionRequest, AskQuestionResponse, PlaceSuggestion } from '../../services/horoscope.service';
import { PredictionsService, BasicChartPredictionResponse, DetailedChartPredictionResponse } from '../../services/predictions.service';
import { PaymentService, PaymentRequest, PaymentResult, QnaPaymentRequest } from '../../services/payment.service';
import { CurrencyService, CurrencyInfo } from '../../services/currency.service';
import jsPDF from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, takeUntil } from 'rxjs/operators';
import { SeoFocusService } from '../../services/seo-focus.service';
import { ProfileService } from '../../services/profile.service';
import { AnalyticsService } from '../../services/analytics.service';

declare const Stripe: any;

@Component({
  selector: 'app-birth-chart',
  templateUrl: './birth-chart.component.html',
  styleUrls: ['./birth-chart.component.scss']
})
export class BirthChartComponent implements OnInit, OnDestroy {
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private horoscope: HoroscopeService,
    private predictions: PredictionsService,
    private payments: PaymentService,
    private currencyService: CurrencyService,
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoFocusService,
    private profileService: ProfileService,
    private analytics: AnalyticsService
  ) {}

  form = this.fb.group({
    birthDate: ['', Validators.required],
    birthTime: ['', Validators.required],
    birthPlace: ['', Validators.required],
    chartStyle: ['North Indian', Validators.required],
    predictionType: ['Basic (Free)', Validators.required]
  });

  chart?: SouthIndianChart;
  loading = false;
  error = '';
  predLoading = false;
  basicPred?: BasicChartPredictionResponse;
  detailedPred?: DetailedChartPredictionResponse;
  @ViewChild('basicPredSection') basicPredSection?: ElementRef<HTMLDivElement>;
  @ViewChild('detailedPredSection') detailedPredSection?: ElementRef<HTMLDivElement>;
  @ViewChild('cosmicCard') cosmicCard?: ElementRef<HTMLDivElement>;
  longRunningNotice = false;

  // Cosmic Identity Card
  downloadingCard = false;
  cardDownloaded  = false;

  // Place autocomplete state
  placeSuggestions: PlaceSuggestion[] = [];
  showSuggestions = false;
  private destroy$ = new Subject<void>();

  // Ask-a-question state
  askQuestionText = '';
  askAnswer?: AskQuestionResponse;
  askLoading = false;
  readonly maxFreeQuestions = 1;
  usedAskQuestions = 0;
  remainingFreeQuestions = 1;
  showPaymentPrompt = false;

  // Premium payment state
  showPremiumPopup = false;
  selectedPlan: PaymentRequest['plan'] | null = null;
  paymentLoading = false;
  paymentError = '';
  paymentName = '';
  paymentEmail = '';
  cardError = '';

  // QNA payment state
  showQnaPopup = false;
  selectedQnaPlan: QnaPaymentRequest['plan'] | null = null;
  qnaPaymentLoading = false;
  qnaPaymentError = '';
  qnaPaymentName = '';
  qnaPaymentEmail = '';
  qnaCardError = '';

  private stripe: any;
  private cardElement: any;
  private qnaCardElement: any;
  showGooglePay = false;
  private premiumPrButton: any;
  private qnaPrButton: any;
  private premiumPaymentRequest: any;
  private qnaPaymentRequest: any;

  // Currency properties
  currentCurrency: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar' };
  premiumPrices = {
    'one-time': { usd: 3.99, converted: 3.99 },
    'weekly': { usd: 2.99, converted: 2.99 }
  };
  qnaPrices = {
    'qna-10': { usd: 3.00, converted: 3.00 },
    'qna-unlimited': { usd: 10.00, converted: 10.00 }
  };

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Free Vedic Birth Chart — Kundli, Rashi & Lagna Analysis',
      description: 'Generate your free Vedic birth chart (Kundli). Get lagna, rashi, nakshatra, planetary positions, Dasha periods, Yogas & AI-powered Jyotish predictions.',
      keywords: 'vedic birth chart, kundli, kundali, rashi chart, lagna, ascendant, nakshatra, sidereal birth chart, free kundli, jyotish birth chart, planetary positions',
      canonical: '/birth-chart'
    });

    this.analytics.track('birth_chart_funnel_cta_shown', '/birth-chart', { placement: 'pre_chart' });

    // Pre-fill form from dashboard / query params
    const qp = this.route.snapshot.queryParams;
    if (qp['dob'] || qp['tob'] || qp['place']) {
      this.form.patchValue({
        birthDate:  qp['dob']   || '',
        birthTime:  qp['tob']   || '',
        birthPlace: qp['place'] || ''
      });
    }

    // Check if user has purchased QNA plan
    const qnaPlan = sessionStorage.getItem('astroai_qna_plan');
    const qnaRemaining = sessionStorage.getItem('astroai_qna_remaining');
    
    if (qnaPlan && qnaRemaining) {
      // User has purchased QNA plan
      this.remainingFreeQuestions = Number(qnaRemaining) || 0;
      this.usedAskQuestions = 0; // Not used for QNA plans
    } else {
      // Default free question logic
      const usedRaw = sessionStorage.getItem('astroai_ask_used');
      this.usedAskQuestions = usedRaw ? Number(usedRaw) || 0 : 0;
      this.remainingFreeQuestions = Math.max(this.maxFreeQuestions - this.usedAskQuestions, 0);
    }

    if (typeof Stripe !== 'undefined') {
      // TODO: replace with your real publishable key; keep test key in non-production environments only
      this.stripe = Stripe('pk_live_51SkYakPpSmZFXw4WZvXp8z7nLyOJmZReFnCtSqUnolgOWoDInuY8FhcJ0HRdbU5pKr3PLFSAj1ACkyktccWcdWmI00WrSAKFpD');
    }

    // Subscribe to currency changes
    this.currencyService.getCurrentCurrency().pipe(
      takeUntil(this.destroy$)
    ).subscribe(currency => {
      console.log('💱 Currency changed to:', currency.code);
      this.currentCurrency = currency;
      this.updateConvertedPrices();
    });

    // Set up autocomplete for birth place
    this.form.get('birthPlace')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string' && value.length >= 3),
      switchMap(value => this.horoscope.getPlaceSuggestions(value as string)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (suggestions) => { 
        this.placeSuggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
      },
      error: () => {
        this.placeSuggestions = [];
        this.showSuggestions = false;
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
    
    if (this.qnaCardElement) {
      this.qnaCardElement.unmount();
      this.qnaCardElement = null;
    }

    if (this.premiumPrButton) { try { this.premiumPrButton.unmount(); } catch (_) {} }
    if (this.qnaPrButton) { try { this.qnaPrButton.unmount(); } catch (_) {} }
  }

  goToAstrologer(): void {
    this.analytics.track('birth_chart_cta_click', '/birth-chart', { cta: 'astrologer' });
    this.router.navigate(['/astrologer']);
  }

  goToPricing(): void {
    this.analytics.track('birth_chart_cta_click', '/birth-chart', { cta: 'pricing' });
    this.router.navigate(['/pricing']);
  }

  onPlaceSuggestionSelected(suggestion: PlaceSuggestion): void {
    this.form.patchValue({ birthPlace: suggestion.description });
    this.placeSuggestions = [];
    this.showSuggestions = false;
  }

  // ── Cosmic Identity Card helpers ────────────────────────────────────────────
  getMoonSign(): string {
    return this.chart?.planets.find(p => p.name === 'Moon')?.sign || '—';
  }

  getMoonNakshatra(): string {
    return this.chart?.planets.find(p => p.name === 'Moon')?.nakshatra || '—';
  }

  getSunSign(): string {
    return this.chart?.planets.find(p => p.name === 'Sun')?.sign || '—';
  }

  async downloadCosmicCard(): Promise<void> {
    if (!this.cosmicCard) return;
    this.downloadingCard = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(this.cosmicCard.nativeElement, {
        backgroundColor: '#0d1220',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link    = document.createElement('a');
      link.download  = `cosmic-identity-${this.chart?.ascendantSign || 'chart'}-${new Date().toISOString().slice(0,10)}.png`;
      link.href      = dataUrl;
      link.click();
      this.cardDownloaded = true;
    } catch (e) { console.error(e); }
    this.downloadingCard = false;
  }

  hideSuggestions(): void {
    // Delay hiding to allow click event to fire first
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  generateBirthChart(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const place = (v.birthPlace || '').toString();
    const parts = place.split(',').map(p => p.trim()).filter(Boolean);
    const city = parts[0] || '';
    const state = parts[1] || '';
    const country = parts[2] || '';
    const birthDate = (v.birthDate || '').toString();
    let birthTime = (v.birthTime || '').toString();
    // Normalize time to HH:mm:ss (append :00 if needed)
    if (/^\d{2}:\d{2}$/.test(birthTime)) {
      birthTime = `${birthTime}:00`;
    }

    this.loading = true;
    this.error = '';
    this.chart = undefined;
    this.horoscope.generateSouthIndianChart({
      city,
      state,
      country,
      birthDate,
      birthTime
    }).subscribe({
      next: (res) => {
        this.chart = res;
        this.loading = false;
        // Auto-save to Supabase dashboard
        const fv = this.form.value;
        this.profileService.saveChart({
          label: `${(fv.birthPlace || '').toString().split(',')[0].trim()} — ${fv.birthDate}`,
          date_of_birth: (fv.birthDate || '').toString(),
          time_of_birth: birthTime,
          birth_place: (fv.birthPlace || '').toString(),
          chart_data: res,
          is_primary: false
        }).then(saved => {
          if (saved) console.log('Birth chart saved to dashboard:', saved.id);
        });
      },
      error: (err) => {
        this.error = 'Failed to generate chart. Please try again.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  getPrediction(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.chart) { this.error = 'Please generate the birth chart first.'; return; }
    const type = (this.form.value.predictionType || '').toString().toLowerCase();
    this.predLoading = true;
    this.basicPred = undefined;
    this.detailedPred = undefined;
    // Route based on prediction type
    const onError = (err: any) => {
      console.error(err);
      this.error = 'Failed to fetch prediction. Please try again.';
      this.predLoading = false;
    };

    if (type.startsWith('premium')) {
      // For premium, show payment popup first and only call API after successful payment
      this.predLoading = false; // actual loading will happen after payment
      this.openPremiumPopup();
      return;
    }

    // Basic
    this.predictions.generateBasicChartPrediction(this.chart).subscribe({
      next: (res) => {
        this.basicPred = res;
        this.predLoading = false;
        // Smooth scroll to the prediction section once it renders
        setTimeout(() => {
          this.basicPredSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      },
      error: (err) => {
        onError(err);
      }
    });
  }

  async downloadDetailedPdf(): Promise<void> {
    if (!this.detailedPred) {
      return;
    }

    try {
      // Load the template PDF from assets
      const templateUrl = 'assets/VedicAstro.pdf';
      const existingPdfBytes = await fetch(templateUrl).then(res => {
        if (!res.ok) throw new Error('Template PDF not found');
        return res.arrayBuffer();
      });

      // Load the PDF template
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      // Embed fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Define colors
      const goldColor = rgb(0.937, 0.749, 0.416); // #efbf6a
      const lightTextColor = rgb(0.961, 0.961, 0.961); // #f5f5f5
      const grayTextColor = rgb(0.7, 0.7, 0.7);

      // Page 1: Cover Page - populate data
      if (pages.length > 0) {
        const page1 = pages[0];
        const { width, height } = page1.getSize();
        
        // Name - display after "Premium Detailed Prediction for" (from payment popup)
        const userName = this.paymentName || '';
        if (userName) {
          const nameY = height - 357;
          const sanitizedName = this.sanitizeForPdf(userName.trim());
          page1.drawText(sanitizedName, {
            x: 119,
            y: nameY,
            size: 11,
            font: font,
            color: lightTextColor
          });
        }
        
        // Age value - positioned to align with the reference (Age: 39 on same line with label)
        const ageY = height - 375;
        page1.drawText(this.detailedPred.ageYears.toString(), {
          x: 143,
          y: ageY,
          size: 11,
          font: font,
          color: lightTextColor
        });

        // Ascendant - left side below Age label
        let ascY = height - 435;
        const ascText = this.sanitizeForPdf(this.normalizeText(this.detailedPred.ascendantSummary || ''));
        const ascLines = this.wrapText(ascText, 112);
        for (let i = 0; i < Math.min(ascLines.length, 4); i++) {
          const safeLine = this.sanitizeForPdf(ascLines[i]);
          page1.drawText(safeLine, {
            x: 105,
            y: ascY,
            size: 11,
            font: font,
            color: lightTextColor
          });
          ascY -= 10;
        }

        // Current Dasha - center area, aligned with the reference
        const dashaY = height - 368;
        const dashaText = this.sanitizeForPdf(this.normalizeText(this.detailedPred.currentDasha || ''));
        page1.drawText(dashaText, {
          x: 525,
          y: dashaY,
          size: 11,
          font: font,
          color: lightTextColor
        });

        // Current Antardasha - below Dasha, aligned with the reference
        const antarY = height - 415;
        const antarText = this.sanitizeForPdf(this.normalizeText(this.detailedPred.currentAntarDasha || ''));
        page1.drawText(antarText, {
          x: 525,
          y: antarY,
          size: 11,
          font: font,
          color: lightTextColor
        });
      }

      // Page 2: Career
      if (pages.length > 1) {
        this.populateContentPage(pages[1], this.detailedPred.career, font, lightTextColor);
      }

      // Page 3: Finance
      if (pages.length > 2) {
        this.populateContentPage(pages[2], this.detailedPred.finance, font, lightTextColor);
      }

      // Page 4: Relationships
      if (pages.length > 3) {
        this.populateContentPage(pages[3], this.detailedPred.relationships, font, lightTextColor);
      }

      // Page 5: Destiny
      if (pages.length > 4) {
        this.populateContentPage(pages[4], this.detailedPred.destiny, font, lightTextColor);
      }

      // Page 6: Job Window
      if (pages.length > 5) {
        this.populateContentPage(pages[5], this.detailedPred.jobWindow, font, lightTextColor);
      }

      // Page 7: Marriage Window
      if (pages.length > 6) {
        this.populateContentPage(pages[6], this.detailedPred.marriageWindow, font, lightTextColor);
      }

      // Page 8: Good Yogas and Challenging Yogas (two columns)
      if (pages.length > 7) {
        const page8 = pages[7];
        const { width, height } = page8.getSize();
        let leftY = height - 250; // Start position
        let rightY = height - 250;
        const leftMargin = 155; // Push even more right to perfectly center in left half
        const rightMargin = width / 2 + 40;
        const leftColumnWidth = (width / 2) - 175; // Adjust for new margin
        const rightColumnWidth = (width / 2) - 80;

        // Good Yogas (left column)
        if (this.detailedPred.goodYogas && this.detailedPred.goodYogas.length > 0) {
          for (const yoga of this.detailedPred.goodYogas) {
            if (leftY < 80) break;
            const normalizedYoga = this.normalizeText(yoga);
            const yogaLines = this.wrapText(`* ${normalizedYoga}`, Math.floor(leftColumnWidth / 4.5));
            for (const line of yogaLines) {
              const safeLine = this.sanitizeForPdf(line);
              try {
                page8.drawText(safeLine, {
                  x: leftMargin,
                  y: leftY,
                  size: 9,
                  font: font,
                  color: lightTextColor
                });
              } catch (e) {
                console.error('Error drawing yoga line:', e);
              }
              leftY -= 14;
            }
            leftY -= 8;
          }
        }

        // Challenging Yogas (right column)
        if (this.detailedPred.badYogas && this.detailedPred.badYogas.length > 0) {
          for (const yoga of this.detailedPred.badYogas) {
            if (rightY < 80) break;
            const normalizedYoga = this.normalizeText(yoga);
            const yogaLines = this.wrapText(`* ${normalizedYoga}`, Math.floor(rightColumnWidth / 5.3));
            for (const line of yogaLines) {
              const safeLine = this.sanitizeForPdf(line);
              try {
                page8.drawText(safeLine, {
                  x: rightMargin,
                  y: rightY,
                  size: 9,
                  font: font,
                  color: lightTextColor
                });
              } catch (e) {
                console.error('Error drawing yoga line:', e);
              }
              rightY -= 14;
            }
            rightY -= 8;
          }
        }
      }

      // Page 9: Suggested Remedies
      if (pages.length > 8) {
        const page9 = pages[8];
        const { width, height } = page9.getSize();
        let y = height - 260;
        const margin = 40;
        const contentWidth = width - (margin * 2);

        if (this.detailedPred.remedies && this.detailedPred.remedies.length > 0) {
          for (const remedy of this.detailedPred.remedies) {
            if (y < 60) break;
            const normalizedRemedy = this.normalizeText(remedy);
            const remedyLines = this.wrapText(`* ${normalizedRemedy}`, Math.floor(contentWidth / 6.5));
            for (const line of remedyLines) {
              const safeLine = this.sanitizeForPdf(line);
              // Center align each line
              const lineWidth = font.widthOfTextAtSize(safeLine, 11);
              const x = (width - lineWidth) / 2;
              
              page9.drawText(safeLine, {
                x: x,
                y: y,
                size: 11,
                font: font,
                color: lightTextColor
              });
              y -= 14;
            }
            y -= 5;
          }
        }
      }

      // Save and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'VedicAstro_Detailed_Prediction.pdf';
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.error = 'Failed to generate PDF. Please ensure the template file exists in assets folder.';
    }
  }

  private populateContentPage(page: any, content: string, font: any, color: any): void {
    const { width, height } = page.getSize();
    let y = height - 280; // Start below the title with more space
    const margin = 40; // More margin from sides
    const contentWidth = width - (margin * 2);
    
    // Normalize and split text properly
    const normalizedContent = this.normalizeText(content || '');
    const lines = this.wrapText(normalizedContent, Math.floor(contentWidth / 6.5));
    
    for (const line of lines) {
      if (y < 60) break; // Stop if we reach bottom of page
      
      // Additional safety: ensure no special chars remain
      const safeLine = this.sanitizeForPdf(line);
      
      // Center align each line
      try {
        const lineWidth = font.widthOfTextAtSize(safeLine, 11);
        const x = (width - lineWidth) / 2;
        
        page.drawText(safeLine, {
          x: x,
          y: y,
          size: 11,
          font: font,
          color: color
        });
      } catch (e) {
        console.error('Error drawing line:', e, 'Line:', safeLine);
        // Skip this line if it fails
      }
      
      y -= 16; // More line spacing
    }
  }

  private normalizeText(text: string): string {
    if (!text) return '';
    
    // Replace special Unicode characters with ASCII equivalents
    return text
      // Remove all line breaks and carriage returns first
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[\u2011\u2012\u2013\u2014\u2015]/g, '-') // Various dashes and hyphens
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2026]/g, '...') // Ellipsis
      .replace(/[\u00A0]/g, ' ') // Non-breaking space
      .replace(/[\u2022]/g, '*') // Bullet point
      // Remove any remaining non-ASCII characters
      .replace(/[^\x20-\x7E]/g, '')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sanitizeForPdf(text: string): string {
    if (!text) return '';
    
    // Final sanitization before drawing to PDF
    // Keep only printable ASCII characters (space to tilde: 0x20-0x7E)
    return text
      .split('')
      .filter(char => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126;
      })
      .join('')
      .trim();
  }

  private wrapText(text: string, maxChars: number): string[] {
    if (!text) return [];
    
    // Text should already be normalized (single line, no special chars)
    const words = text.split(' ').filter(w => w.length > 0);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (testLine.length > maxChars && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  // Planet short names mapping for display
  planetAbbrev(name: string): string {
    const map: Record<string, string> = {
      Sun: 'Sur',
      Moon: 'Cha',
      Mars: 'Man',
      Mercury: 'Bud',
      Jupiter: 'Gur',
      Venus: 'Shu',
      Saturn: 'Sha',
      Rahu: 'Rahu',
      Ketu: 'Ketu'
    };
    return map[name] ?? name;
  }

  planetClass(name: string): string {
    const canonical = name.toLowerCase();
    if (canonical.includes('sun')) return 'p-sur';
    if (canonical.includes('moon')) return 'p-cha';
    if (canonical.includes('mars')) return 'p-man';
    if (canonical.includes('mercury')) return 'p-bud';
    if (canonical.includes('jupiter')) return 'p-gur';
    if (canonical.includes('venus')) return 'p-shu';
    if (canonical.includes('saturn')) return 'p-sha';
    if (canonical.includes('rahu')) return 'p-rahu';
    if (canonical.includes('ketu')) return 'p-ketu';
    return 'p-generic';
  }

  onAskQuestionClicked(): void {
    const q = (this.askQuestionText || '').trim();
    if (!q || !this.chart || this.askLoading) {
      return;
    }

    // Check if user has questions remaining (either free or purchased)
    const qnaPlan = sessionStorage.getItem('astroai_qna_plan');
    if (qnaPlan) {
      // User has purchased QNA plan - check remaining questions
      if (this.remainingFreeQuestions <= 0) {
        this.showPaymentPrompt = true;
        return;
      }
    } else {
      // Free question logic
      if (this.usedAskQuestions >= this.maxFreeQuestions) {
        this.showPaymentPrompt = true;
        return;
      }
    }

    this.submitAskQuestion(q);
  }

  private submitAskQuestion(question: string): void {
    if (!this.chart) { return; }

    const v = this.form.value;
    const place = (v.birthPlace || '').toString();
    const parts = place.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const state = parts[1] || '';
    const country = parts[2] || '';

    const birthDate = (v.birthDate || '').toString();
    let birthTime = (v.birthTime || '').toString();
    if (/^\d{2}:\d{2}$/.test(birthTime)) {
      birthTime = `${birthTime}:00`;
    }

    const req: AskQuestionRequest = {
      city,
      state,
      country,
      birthDate,
      birthTime,
      question
    };

    this.askLoading = true;
    this.askAnswer = undefined;
    this.showPaymentPrompt = false;

    this.horoscope.askQuestion(req).subscribe({
      next: res => {
        this.askAnswer = res;
        this.askLoading = false;
        
        // Check if user has QNA plan
        const qnaPlan = sessionStorage.getItem('astroai_qna_plan');
        if (qnaPlan) {
          // Decrement purchased questions
          this.remainingFreeQuestions = Math.max(this.remainingFreeQuestions - 1, 0);
          sessionStorage.setItem('astroai_qna_remaining', this.remainingFreeQuestions.toString());
        } else {
          // Increment free questions used
          this.usedAskQuestions += 1;
          sessionStorage.setItem('astroai_ask_used', this.usedAskQuestions.toString());
          this.remainingFreeQuestions = Math.max(this.maxFreeQuestions - this.usedAskQuestions, 0);
        }
      },
      error: () => {
        this.askLoading = false;
      }
    });
  }

  startPaymentFlow(): void {
    this.openPremiumPopup();
  }

  // Premium popup helpers
  openPremiumPopup(): void {
    this.showPremiumPopup = true;
    this.selectedPlan = 'weekly'; // default suggested plan
    this.paymentError = '';
    this.cardError = '';

    // Mount Stripe card element after the popup is rendered
    setTimeout(() => this.mountCardElement(), 0);
  }

  closePremiumPopup(): void {
    if (this.paymentLoading) { return; }
    this.showPremiumPopup = false;
  }

  private mountCardElement(): void {
    if (!this.stripe || this.cardElement) { return; }

    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          color: '#e5e7eb',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          '::placeholder': {
            color: '#6b7280'
          }
        },
        invalid: {
          color: '#f97373'
        }
      }
    });

    this.cardElement.mount('#card-element');
    this.cardElement.on('change', (event: any) => {
      this.cardError = event.error?.message ?? '';
    });

    // Google Pay / Apple Pay via Payment Request Button
    const premiumAmount = this.getPlanAmount(this.selectedPlan || 'weekly');
    const premiumPr = this.stripe.paymentRequest({
      country: 'US', currency: 'usd',
      total: { label: 'AstroAI Premium Prediction', amount: Math.round(premiumAmount * 100) },
      requestPayerName: true, requestPayerEmail: true,
    });
    this.premiumPaymentRequest = premiumPr;
    premiumPr.canMakePayment().then((result: any) => {
      if (result) {
        this.showGooglePay = true;
        const prElements = this.stripe.elements();
        this.premiumPrButton = prElements.create('paymentRequestButton', {
          paymentRequest: premiumPr,
          style: { paymentRequestButton: { type: 'buy', theme: 'light', height: '48px' } }
        });
        const btn = document.getElementById('card-element-pr-button');
        if (btn) this.premiumPrButton.mount('#card-element-pr-button');
      }
    });
    premiumPr.on('paymentmethod', (ev: any) => {
      if (!this.selectedPlan) { ev.complete('fail'); return; }
      const planAmount = this.getPlanAmount(this.selectedPlan);
      const v = this.form.value;
      this.paymentLoading = true;
      this.paymentError = '';
      const req: PaymentRequest = {
        plan: this.selectedPlan,
        amountUsd: planAmount,
        name: ev.payerName || '',
        email: ev.payerEmail || '',
        paymentMethodId: ev.paymentMethod.id,
        dateOfBirth: (v.birthDate || '').toString(),
        timeOfBirth: (v.birthTime || '').toString(),
        placeOfBirth: (v.birthPlace || '').toString()
      };
      this.payments.charge(req).subscribe({
        next: async (res: PaymentResult) => {
          const paymentCompleted = await this.completeStripeActionIfRequired(res, message => this.paymentError = message);
          if (paymentCompleted) {
            ev.complete('success');
            this.paymentLoading = false;
            this.showPremiumPopup = false;
            this.longRunningNotice = true;
            this.predLoading = true;
            this.predictions.generateDetailedPrediction(this.chart!).subscribe({
              next: (detail) => { this.detailedPred = detail; this.predLoading = false; this.longRunningNotice = false; },
              error: () => { this.error = 'Payment succeeded, but prediction failed. Please contact support.'; this.predLoading = false; this.longRunningNotice = false; }
            });
          } else { ev.complete('fail'); this.paymentError = this.paymentError || res.error || 'Payment failed.'; this.paymentLoading = false; }
        },
        error: (err: any) => {
          ev.complete('fail');
          this.paymentLoading = false;
          const backendError = (err?.error) ? (err.error.error || err.error.Error || err.error.message || err.error.Message) : null;
          this.paymentError = backendError || 'Payment failed.';
        }
      });
    });
  }

  selectPlan(plan: PaymentRequest['plan']): void {
    this.selectedPlan = plan;
    this.paymentError = '';
    if (this.premiumPaymentRequest) {
      this.premiumPaymentRequest.update({
        total: { label: 'AstroAI Premium Prediction', amount: Math.round(this.getPlanAmount(plan) * 100) }
      });
    }
  }

  private getPlanAmount(plan: PaymentRequest['plan']): number {
    switch (plan) {
      case 'one-time': return 3.99;
      case 'weekly': return 2.99;
      case 'monthly': return 5.99;
      default: return 0;
    }
  }

  async confirmPremiumPurchase(): Promise<void> {
    if (!this.selectedPlan || !this.chart || this.paymentLoading) { return; }
    const name = (this.paymentName || '').trim();
    const email = (this.paymentEmail || '').trim();
    if (!name || !email) {
      this.paymentError = 'Please enter your name and email before continuing.';
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.paymentError = 'Please enter a valid email address.';
      return;
    }
    if (!this.stripe || !this.cardElement) {
      this.paymentError = 'Payment form is not ready. Please reload the page and try again.';
      return;
    }
    const amount = this.getPlanAmount(this.selectedPlan);
    if (!amount) { return; }
    this.paymentLoading = true;
    this.paymentError = '';
    this.cardError = '';

    // 1) Ask Stripe.js to create a PaymentMethod from the card details
    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.cardElement,
      billing_details: { name, email }
    });

    if (error || !paymentMethod) {
      this.paymentLoading = false;
      this.cardError = error?.message || 'Unable to process card details. Please check the card information and try again.';
      return;
    }

    const v = this.form.value;
    const dob = (v.birthDate || '').toString();
    const tob = (v.birthTime || '').toString();
    const pob = (v.birthPlace || '').toString();

    const req: PaymentRequest = {
      plan: this.selectedPlan,
      amountUsd: amount,
      name,
      email,
      paymentMethodId: paymentMethod.id,
      dateOfBirth: dob,
      timeOfBirth: tob,
      placeOfBirth: pob
    };

    // 2) Call backend to charge
    this.payments.charge(req).subscribe({
      next: async (res: PaymentResult) => {
        const paymentCompleted = await this.completeStripeActionIfRequired(res, message => this.paymentError = message);
        this.paymentLoading = false;
        if (!paymentCompleted) {
          this.paymentError = this.paymentError || res.error || 'Payment failed. Please try another card or plan.';
          return;
        }

        // Payment succeeded; now call premium prediction API
        this.showPremiumPopup = false;
        this.longRunningNotice = true;
        this.predLoading = true;
        this.predictions.generateDetailedPrediction(this.chart!).subscribe({
          next: (detail) => {
            this.detailedPred = detail;
            this.predLoading = false;
            this.longRunningNotice = false;
            setTimeout(() => {
              this.detailedPredSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          },
          error: err => {
            console.error(err);
            this.error = 'Payment succeeded, but fetching the premium prediction failed. Please contact support.';
            this.predLoading = false;
            this.longRunningNotice = false;
          }
        });
      },
      error: err => {
        console.error(err);
        this.paymentLoading = false;

        // Prefer detailed message from backend (e.g. active weekly subscription)
        const backendError = (err && err.error) ? (
          err.error.error ||
          err.error.Error ||
          err.error.message ||
          err.error.Message
        ) : null;

        this.paymentError = backendError || 'Payment request failed. Please check your connection and try again.';
      }
    });
  }

  // QNA Payment Methods
  openQnaPopup(): void {
    this.showQnaPopup = true;
    this.selectedQnaPlan = null;
    this.qnaPaymentError = '';
    this.qnaCardError = '';
    setTimeout(() => this.mountQnaCardElement(), 100);
  }

  closeQnaPopup(): void {
    if (this.qnaPaymentLoading) { return; }
    this.showQnaPopup = false;
  }

  private mountQnaCardElement(): void {
    if (!this.stripe || this.qnaCardElement) { return; }

    const elements = this.stripe.elements();
    this.qnaCardElement = elements.create('card', {
      style: {
        base: {
          color: '#e5e7eb',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          '::placeholder': {
            color: '#6b7280'
          }
        },
        invalid: {
          color: '#f97373'
        }
      }
    });

    this.qnaCardElement.mount('#qna-card-element');
    this.qnaCardElement.on('change', (event: any) => {
      this.qnaCardError = event.error?.message ?? '';
    });

    // Google Pay / Apple Pay via Payment Request Button
    const qnaPr = this.stripe.paymentRequest({
      country: 'US', currency: 'usd',
      total: { label: 'AstroAI Questions', amount: 300 }, // default $3.00
      requestPayerName: true, requestPayerEmail: true,
    });
    this.qnaPaymentRequest = qnaPr;
    qnaPr.canMakePayment().then((result: any) => {
      if (result) {
        this.showGooglePay = true;
        const prElements = this.stripe.elements();
        this.qnaPrButton = prElements.create('paymentRequestButton', {
          paymentRequest: qnaPr,
          style: { paymentRequestButton: { type: 'buy', theme: 'light', height: '48px' } }
        });
        const btn = document.getElementById('qna-card-element-pr-button');
        if (btn) this.qnaPrButton.mount('#qna-card-element-pr-button');
      }
    });
    qnaPr.on('paymentmethod', (ev: any) => {
      if (!this.selectedQnaPlan) { ev.complete('fail'); return; }
      const planAmount = this.getQnaPlanAmount(this.selectedQnaPlan);
      this.qnaPaymentLoading = true;
      this.qnaPaymentError = '';
      const req: QnaPaymentRequest = {
        plan: this.selectedQnaPlan,
        amountUsd: planAmount,
        name: ev.payerName || '',
        email: ev.payerEmail || '',
        paymentMethodId: ev.paymentMethod.id
      };
      this.payments.chargeForQNA(req).subscribe({
        next: async (res: PaymentResult) => {
          const paymentCompleted = await this.completeStripeActionIfRequired(res, message => this.qnaPaymentError = message);
          if (paymentCompleted) {
            ev.complete('success');
            this.qnaPaymentLoading = false;
            this.showQnaPopup = false;
            this.showPaymentPrompt = false;
            if (this.selectedQnaPlan === 'qna-10') {
              this.remainingFreeQuestions = 10; this.usedAskQuestions = 0;
              sessionStorage.setItem('astroai_ask_used', '0'); sessionStorage.setItem('astroai_qna_plan', 'qna-10'); sessionStorage.setItem('astroai_qna_remaining', '10');
            } else {
              this.remainingFreeQuestions = 999999; this.usedAskQuestions = 0;
              sessionStorage.setItem('astroai_ask_used', '0'); sessionStorage.setItem('astroai_qna_plan', 'qna-unlimited'); sessionStorage.setItem('astroai_qna_remaining', '999999');
            }
          } else { ev.complete('fail'); this.qnaPaymentError = this.qnaPaymentError || res.error || 'Payment failed.'; this.qnaPaymentLoading = false; }
        },
        error: (err: any) => {
          ev.complete('fail');
          this.qnaPaymentLoading = false;
          const backendError = (err?.error) ? (err.error.error || err.error.Error || err.error.message || err.error.Message) : null;
          this.qnaPaymentError = backendError || 'Payment failed.';
        }
      });
    });
  }

  selectQnaPlan(plan: QnaPaymentRequest['plan']): void {
    this.selectedQnaPlan = plan;
    this.qnaPaymentError = '';
    if (this.qnaPaymentRequest) {
      this.qnaPaymentRequest.update({
        total: { label: 'AstroAI Questions', amount: Math.round(this.getQnaPlanAmount(plan) * 100) }
      });
    }
  }

  private getQnaPlanAmount(plan: QnaPaymentRequest['plan']): number {
    switch (plan) {
      case 'qna-10': return 3.00;
      case 'qna-unlimited': return 10.00;
      default: return 0;
    }
  }

  private async completeStripeActionIfRequired(result: PaymentResult, setError: (message: string) => void): Promise<boolean> {
    if (!result.requiresAction) {
      return result.success;
    }

    if (!this.stripe || !result.clientSecret) {
      setError('Additional authentication is required, but checkout is not ready. Please try again.');
      return false;
    }

    const actionResult = await this.stripe.handleCardAction(result.clientSecret);
    if (actionResult?.error) {
      setError(actionResult.error.message || 'Authentication failed. Please try another card.');
      return false;
    }

    return actionResult?.paymentIntent?.status === 'succeeded';
  }

  async confirmQnaPurchase(): Promise<void> {
    if (!this.selectedQnaPlan || this.qnaPaymentLoading) { return; }
    const name = (this.qnaPaymentName || '').trim();
    const email = (this.qnaPaymentEmail || '').trim();
    if (!name || !email) {
      this.qnaPaymentError = 'Please enter your name and email before continuing.';
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.qnaPaymentError = 'Please enter a valid email address.';
      return;
    }
    if (!this.stripe || !this.qnaCardElement) {
      this.qnaPaymentError = 'Payment form is not ready. Please reload the page and try again.';
      return;
    }
    const amount = this.getQnaPlanAmount(this.selectedQnaPlan);
    if (!amount) { return; }
    this.qnaPaymentLoading = true;
    this.qnaPaymentError = '';
    this.qnaCardError = '';

    // 1) Ask Stripe.js to create a PaymentMethod from the card details
    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: this.qnaCardElement,
      billing_details: { name, email }
    });

    if (error || !paymentMethod) {
      this.qnaPaymentLoading = false;
      this.qnaCardError = error?.message || 'Unable to process card details. Please check the card information and try again.';
      return;
    }

    const req: QnaPaymentRequest = {
      plan: this.selectedQnaPlan,
      amountUsd: amount,
      name,
      email,
      paymentMethodId: paymentMethod.id
    };

    // 2) Call backend to charge for QNA
    this.payments.chargeForQNA(req).subscribe({
      next: async (res: PaymentResult) => {
        const paymentCompleted = await this.completeStripeActionIfRequired(res, message => this.qnaPaymentError = message);
        this.qnaPaymentLoading = false;
        if (!paymentCompleted) {
          this.qnaPaymentError = this.qnaPaymentError || res.error || 'Payment failed. Please try another card or plan.';
          return;
        }

        // Payment succeeded; update question count
        this.showQnaPopup = false;
        this.showPaymentPrompt = false;
        
        // Update question limits based on plan
        if (this.selectedQnaPlan === 'qna-10') {
          this.remainingFreeQuestions = 10;
          this.usedAskQuestions = 0;
          sessionStorage.setItem('astroai_ask_used', '0');
          sessionStorage.setItem('astroai_qna_plan', 'qna-10');
          sessionStorage.setItem('astroai_qna_remaining', '10');
        } else {
          this.remainingFreeQuestions = 999999; // Unlimited
          this.usedAskQuestions = 0;
          sessionStorage.setItem('astroai_ask_used', '0');
          sessionStorage.setItem('astroai_qna_plan', 'qna-unlimited');
          sessionStorage.setItem('astroai_qna_remaining', '999999');
        }

        alert('Payment successful! You can now ask your questions.');
      },
      error: err => {
        console.error(err);
        this.qnaPaymentLoading = false;

        const backendError = (err && err.error) ? (
          err.error.error ||
          err.error.Error ||
          err.error.message ||
          err.error.Message
        ) : null;

        this.qnaPaymentError = backendError || 'Payment request failed. Please check your connection and try again.';
      }
    });
  }

  /**
   * Update all converted prices based on current currency
   */
  private updateConvertedPrices(): void {
    // Convert premium prices
    this.currencyService.convertFromUSD(this.premiumPrices['one-time'].usd)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.premiumPrices['one-time'].converted = result.amount;
      });

    this.currencyService.convertFromUSD(this.premiumPrices['weekly'].usd)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.premiumPrices['weekly'].converted = result.amount;
      });

    // Convert QNA prices
    this.currencyService.convertFromUSD(this.qnaPrices['qna-10'].usd)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.qnaPrices['qna-10'].converted = result.amount;
      });

    this.currencyService.convertFromUSD(this.qnaPrices['qna-unlimited'].usd)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.qnaPrices['qna-unlimited'].converted = result.amount;
      });
  }

  /**
   * Format price with current currency
   */
  formatPrice(amount: number): string {
    return this.currencyService.formatAmount(amount, this.currentCurrency.code);
  }

  /**
   * Get display price for premium plan
   */
  getPremiumDisplayPrice(plan: 'one-time' | 'weekly'): string {
    return this.formatPrice(this.premiumPrices[plan].converted);
  }

  /**
   * Get display price for QNA plan
   */
  getQnaDisplayPrice(plan: 'qna-10' | 'qna-unlimited'): string {
    return this.formatPrice(this.qnaPrices[plan].converted);
  }
}
