import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PaymentRequest {
  plan: 'one-time' | 'weekly' | 'monthly';
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}

export interface QnaPaymentRequest {
  plan: 'qna-10' | 'qna-unlimited';
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
}

export interface MatchmakingPaymentRequest {
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
  person1Name: string;
  person1BirthDate: string;
  person1BirthTime: string;
  person1BirthPlace: string;
  person2Name: string;
  person2BirthDate: string;
  person2BirthTime: string;
  person2BirthPlace: string;
}

export interface NumerologyPaymentRequest {
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
  birthDate: string;
}

export interface GemstonePaymentRequest {
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
  birthDate: string;
  birthPlace: string;
}

export interface AstrologerPaymentRequest {
  amountUsd: number;
  name: string;
  email: string;
  paymentMethodId: string;
  placeOfBirth: string;
}

export interface PaymentResult {
  success: boolean;
  error?: string | null;
  requiresAction?: boolean;
  clientSecret?: string | null;
  paymentIntentId?: string | null;
  paymentStatus?: string | null;
}

export interface PremiumBirthChartRecord {
  id: string;
  email: string;
  name: string;
  plan: 'one-time' | 'weekly' | 'monthly';
  subscriptionType: 'O' | 'W' | 'M';
  paymentProvider: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  horoscope?: unknown;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/payments`;

  constructor(private http: HttpClient) {}

  charge(req: PaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/charge`, req);
  }

  chargeForQNA(req: QnaPaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/chargeForQNA`, req);
  }

  chargeForMatchmaking(req: MatchmakingPaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/chargeForMatchmaking`, req);
  }

  chargeForNumerology(req: NumerologyPaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/chargeForNumerology`, req);
  }

  chargeForGemstone(req: GemstonePaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/chargeForGemstone`, req);
  }

  chargeForAstrologer(req: AstrologerPaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(`${this.baseUrl}/chargeForAstrologer`, req);
  }

  getPremiumBirthCharts(): Observable<PremiumBirthChartRecord[]> {
    return this.http.get<PremiumBirthChartRecord[]>(`${this.baseUrl}/premiumBirthCharts`);
  }
}
