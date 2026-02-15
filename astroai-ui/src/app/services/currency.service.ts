import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRates {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
  private readonly IPAPI_URL = 'https://ipapi.co/json/';
  
  private currentCurrency$ = new BehaviorSubject<CurrencyInfo>({
    code: 'USD',
    symbol: '$',
    name: 'US Dollar'
  });
  
  private exchangeRates$: Observable<ExchangeRates>;

  // Comprehensive currency list
  private readonly currencies: { [key: string]: CurrencyInfo } = {
    'USD': { code: 'USD', symbol: '$', name: 'US Dollar' },
    'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    'EUR': { code: 'EUR', symbol: '€', name: 'Euro' },
    'GBP': { code: 'GBP', symbol: '£', name: 'British Pound' },
    'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    'CAD': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    'AED': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    'MYR': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    'THB': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    'ZAR': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    'BRL': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    'MXN': { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    'CHF': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    'SEK': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    'NOK': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    'DKK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone' }
  };

  constructor(private http: HttpClient) {
    console.log('💱 CurrencyService initialized');
    
    // Fetch exchange rates once and cache them
    this.exchangeRates$ = this.http.get<any>(this.EXCHANGE_API).pipe(
      map(response => response.rates as ExchangeRates),
      shareReplay(1),
      catchError(error => {
        console.error('❌ Failed to fetch exchange rates:', error);
        // Return default rates with USD=1
        return of({ USD: 1, INR: 83, EUR: 0.92, GBP: 0.79 } as ExchangeRates);
      })
    );

    // Auto-detect currency on service initialization
    this.detectUserCurrency();
  }

  /**
   * Detect user's currency based on their IP location
   */
  private detectUserCurrency(): void {
    console.log('🌍 Detecting user location for currency...');
    
    this.http.get<any>(this.IPAPI_URL).pipe(
      catchError(error => {
        console.error('❌ Failed to detect location:', error);
        return of({ currency: 'USD', country_code: 'US' });
      })
    ).subscribe(location => {
      const currencyCode = location.currency || 'USD';
      console.log(`📍 Detected location: ${location.country_name || 'Unknown'} (${location.country_code})`);
      console.log(`💱 Detected currency: ${currencyCode}`);
      
      const currency = this.currencies[currencyCode] || this.currencies['USD'];
      this.currentCurrency$.next(currency);
    });
  }

  /**
   * Get current currency as observable
   */
  getCurrentCurrency(): Observable<CurrencyInfo> {
    return this.currentCurrency$.asObservable();
  }

  /**
   * Get current currency value
   */
  getCurrentCurrencyValue(): CurrencyInfo {
    return this.currentCurrency$.value;
  }

  /**
   * Convert USD amount to current currency
   */
  convertFromUSD(amountUSD: number): Observable<{ amount: number; currency: CurrencyInfo }> {
    const currency = this.currentCurrency$.value;
    
    if (currency.code === 'USD') {
      return of({ amount: amountUSD, currency });
    }

    return this.exchangeRates$.pipe(
      map(rates => {
        const rate = rates[currency.code] || 1;
        const convertedAmount = amountUSD * rate;
        console.log(`💱 Converting $${amountUSD} USD to ${currency.code}: ${convertedAmount.toFixed(2)}`);
        return { amount: convertedAmount, currency };
      })
    );
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currencyCode?: string): string {
    const currency = currencyCode 
      ? (this.currencies[currencyCode] || this.currencies['USD'])
      : this.currentCurrency$.value;
    
    // Format with 2 decimal places
    const formatted = amount.toFixed(2);
    
    // Handle special cases for currencies
    if (currency.code === 'JPY') {
      // Japanese Yen doesn't use decimals
      return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
    }
    
    return `${currency.symbol}${formatted}`;
  }

  /**
   * Get exchange rates for manual conversion
   */
  getExchangeRates(): Observable<ExchangeRates> {
    return this.exchangeRates$;
  }

  /**
   * Set currency manually (for testing or user preference)
   */
  setManualCurrency(currencyCode: string): void {
    const currency = this.currencies[currencyCode];
    if (currency) {
      console.log(`💱 Manually set currency to: ${currencyCode}`);
      this.currentCurrency$.next(currency);
    }
  }

  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(this.currencies);
  }
}
