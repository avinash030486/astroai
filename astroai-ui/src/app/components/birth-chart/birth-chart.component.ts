import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { HoroscopeService, SouthIndianChart, AskQuestionRequest, AskQuestionResponse } from '../../services/horoscope.service';
import { PredictionsService, BasicChartPredictionResponse, DetailedChartPredictionResponse } from '../../services/predictions.service';
import { PaymentService, PaymentRequest } from '../../services/payment.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-birth-chart',
  templateUrl: './birth-chart.component.html',
  styleUrls: ['./birth-chart.component.scss']
})
export class BirthChartComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private horoscope: HoroscopeService,
    private predictions: PredictionsService,
    private payments: PaymentService
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
  longRunningNotice = false;

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

  ngOnInit(): void {
    const usedRaw = sessionStorage.getItem('astroai_ask_used');
    this.usedAskQuestions = usedRaw ? Number(usedRaw) || 0 : 0;
    this.remainingFreeQuestions = Math.max(this.maxFreeQuestions - this.usedAskQuestions, 0);
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
    if (!this.detailedPredSection) return;
    const element = this.detailedPredSection.nativeElement;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm margin each side
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    let y = 10;
    if (imgHeight < pageHeight - 20) {
      pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
    } else {
      // Split into pages
      let remainingHeight = imgHeight;
      let position = 10;
      const pageImgHeight = pageHeight - 20;
      const ratio = imgWidth / canvas.width;
      const sliceHeight = (pageImgHeight / ratio);
    
      const ctxCanvas = document.createElement('canvas');
      ctxCanvas.width = canvas.width;
      ctxCanvas.height = sliceHeight;
      const ctx = ctxCanvas.getContext('2d');
      if (!ctx) return;
      let sY = 0;
      while (remainingHeight > 0) {
        ctx.clearRect(0,0,ctxCanvas.width, ctxCanvas.height);
        ctx.drawImage(canvas, 0, sY, canvas.width, sliceHeight, 0, 0, ctxCanvas.width, ctxCanvas.height);
        const sliceData = ctxCanvas.toDataURL('image/png');
        pdf.addImage(sliceData, 'PNG', 10, position, imgWidth, pageImgHeight);
        remainingHeight -= pageImgHeight;
        sY += sliceHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          position = 10;
        }
      }
    }
    pdf.save('AstroAI_Detailed_Prediction.pdf');
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

    if (this.usedAskQuestions >= this.maxFreeQuestions) {
      this.showPaymentPrompt = true;
      return;
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
        this.usedAskQuestions += 1;
        sessionStorage.setItem('astroai_ask_used', this.usedAskQuestions.toString());
        this.remainingFreeQuestions = Math.max(this.maxFreeQuestions - this.usedAskQuestions, 0);
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
  }

  closePremiumPopup(): void {
    if (this.paymentLoading) { return; }
    this.showPremiumPopup = false;
  }

  selectPlan(plan: PaymentRequest['plan']): void {
    this.selectedPlan = plan;
    this.paymentError = '';
  }

  private getPlanAmount(plan: PaymentRequest['plan']): number {
    switch (plan) {
      case 'one-time': return 3.99;
      case 'weekly': return 2.99;
      case 'monthly': return 5.99;
      default: return 0;
    }
  }

  confirmPremiumPurchase(): void {
    if (!this.selectedPlan || !this.chart || this.paymentLoading) { return; }
    const amount = this.getPlanAmount(this.selectedPlan);
    if (!amount) { return; }

    const req: PaymentRequest = {
      plan: this.selectedPlan,
      amountUsd: amount
    };

    this.paymentLoading = true;
    this.paymentError = '';

    this.payments.charge(req).subscribe({
      next: res => {
        this.paymentLoading = false;
        if (!res.success) {
          this.paymentError = res.error || 'Payment failed. Please try another card or plan.';
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
        this.paymentError = 'Payment request failed. Please check your connection and try again.';
      }
    });
  }
}
