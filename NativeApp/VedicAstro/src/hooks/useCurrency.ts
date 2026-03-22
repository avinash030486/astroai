/**
 * useCurrency – detects the user's local currency via IP geolocation
 * and provides real-time USD conversion, matching the web app's CurrencyService.
 *
 * Results are cached at module level so the APIs are hit only once per app session.
 */
import { useState, useEffect } from 'react';

// ─── Currency map (mirrors web app CurrencyService) ──────────────────────────

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar' },
  INR: { code: 'INR', symbol: '₹',    name: 'Indian Rupee' },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£',    name: 'British Pound' },
  AUD: { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$',   name: 'Canadian Dollar' },
  SGD: { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar' },
  AED: { code: 'AED', symbol: 'د.إ',  name: 'UAE Dirham' },
  JPY: { code: 'JPY', symbol: '¥',    name: 'Japanese Yen' },
  CNY: { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan' },
  MYR: { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit' },
  THB: { code: 'THB', symbol: '฿',    name: 'Thai Baht' },
  NZD: { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar' },
  ZAR: { code: 'ZAR', symbol: 'R',    name: 'South African Rand' },
  BRL: { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  CHF: { code: 'CHF', symbol: 'CHF',  name: 'Swiss Franc' },
  SEK: { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr',   name: 'Danish Krone' },
  PKR: { code: 'PKR', symbol: '₨',    name: 'Pakistani Rupee' },
  BDT: { code: 'BDT', symbol: '৳',    name: 'Bangladeshi Taka' },
  LKR: { code: 'LKR', symbol: 'Rs',   name: 'Sri Lankan Rupee' },
  IDR: { code: 'IDR', symbol: 'Rp',   name: 'Indonesian Rupiah' },
  PHP: { code: 'PHP', symbol: '₱',    name: 'Philippine Peso' },
  HKD: { code: 'HKD', symbol: 'HK$',  name: 'Hong Kong Dollar' },
  TWD: { code: 'TWD', symbol: 'NT$',  name: 'Taiwan Dollar' },
  KRW: { code: 'KRW', symbol: '₩',    name: 'South Korean Won' },
  NGN: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira' },
  KES: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling' },
};

/** Currencies where decimals are not shown */
const NO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'IDR', 'TWD']);

// ─── Module-level cache (single fetch per app session) ───────────────────────

let _cachedCurrency: CurrencyInfo | null = null;
let _cachedRate = 1;
let _fetchPromise: Promise<void> | null = null;

async function detectCurrencyAndRate(): Promise<void> {
  try {
    const locRes = await fetch('https://ipapi.co/json/');
    const loc = await locRes.json();
    const code: string = loc?.currency ?? 'USD';
    console.log(`📍 Native app detected currency: ${code}`);

    _cachedCurrency = CURRENCIES[code] ?? CURRENCIES['USD'];

    if (code !== 'USD') {
      const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const rateData = await rateRes.json();
      _cachedRate = (rateData?.rates?.[code] as number) ?? 1;
      console.log(`💱 Exchange rate 1 USD = ${_cachedRate} ${code}`);
    } else {
      _cachedRate = 1;
    }
  } catch (e) {
    console.warn('⚠️ Currency detection failed, defaulting to USD', e);
    _cachedCurrency = CURRENCIES['USD'];
    _cachedRate = 1;
  }
}

function ensureFetched(): Promise<void> {
  if (_cachedCurrency !== null) return Promise.resolve();
  if (!_fetchPromise) {
    _fetchPromise = detectCurrencyAndRate();
  }
  return _fetchPromise;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseCurrencyResult {
  /** Detected currency info */
  currency: CurrencyInfo;
  /** Exchange rate: 1 USD = rate local units */
  rate: number;
  /** Whether detection has completed (false on first render) */
  ready: boolean;
  /** Format a USD amount into a local currency string e.g. ₹165.17 */
  format: (amountUsd: number) => string;
}

export function useCurrency(): UseCurrencyResult {
  const [currency, setCurrency] = useState<CurrencyInfo>(
    _cachedCurrency ?? CURRENCIES['USD'],
  );
  const [rate, setRate] = useState<number>(_cachedRate);
  const [ready, setReady] = useState<boolean>(_cachedCurrency !== null);

  useEffect(() => {
    ensureFetched().then(() => {
      setCurrency(_cachedCurrency!);
      setRate(_cachedRate);
      setReady(true);
    });
  }, []);

  const format = (amountUsd: number): string => {
    const converted = amountUsd * rate;
    if (NO_DECIMAL_CURRENCIES.has(currency.code)) {
      return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  return { currency, rate, format, ready };
}
