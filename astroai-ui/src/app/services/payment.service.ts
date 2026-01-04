import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PaymentRequest {
  plan: 'one-time' | 'weekly' | 'monthly';
  amountUsd: number;
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
}
