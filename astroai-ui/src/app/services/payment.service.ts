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

export interface PaymentResult {
  success: boolean;
  error?: string | null;
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
}
