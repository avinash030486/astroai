/**
 * Google Play Billing service — wraps react-native-iap for Android in-app purchases.
 * On iOS this is a no-op (Stripe handles payments there).
 *
 * react-native-iap v15 uses NitroModules which are NOT available in Expo Go.
 * We lazy-require the module so the app loads fine in Expo Go / web, and
 * billing only activates when running in a real native build.
 */
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

// Lazy getter — returns null if the native module isn't linked (Expo Go)
let _iap: typeof import('react-native-iap') | null = null;
function getIAP(): typeof import('react-native-iap') | null {
  if (_iap) return _iap;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _iap = require('react-native-iap');
    return _iap;
  } catch {
    console.warn('[GPBilling] react-native-iap not available (Expo Go or web)');
    return null;
  }
}

// ── Product ID map ────────────────────────────────────────────────────────────
// Keys match what each screen passes as `googlePlayProductId` prop
export const GP_PRODUCT_IDS = {
  premium_birth_chart:  'premium_birth_chart',
  matchmaking_analysis: 'matchmaking_analysis',
  numerology_reading:   'numerology_reading',
  gemstone_report:      'gemstone_report',
  palmistry_reading:    'palmistry_reading',
  nakshatra_aura_ar:    'nakshatra_aura_ar',
  gemstone_tryon_ar:    'gemstone_tryon_ar',
  soul_sketch:          'soul_sketch',
  past_life_reading:    'past_life_reading',
  yearly_horoscope:     'yearly_horoscope',
  qna_10_questions:     'qna_10_questions',
  astrologer_session:   'astrologer_session',
  seeker_monthly:       'seeker_monthly',
  rhythm_monthly:       'rhythm_monthly',
} as const;

export type GPProductId = keyof typeof GP_PRODUCT_IDS;

const SUBS_PRODUCT_IDS: GPProductId[] = ['seeker_monthly', 'rhythm_monthly'];

function getProductType(productId: GPProductId): 'in-app' | 'subs' {
  return SUBS_PRODUCT_IDS.includes(productId) ? 'subs' : 'in-app';
}

// ── Service ───────────────────────────────────────────────────────────────────
class GooglePlayBillingService {
  private connected = false;
  private purchaseListener: any = null;
  private errorListener: any = null;

  async connect(): Promise<void> {
    if (Platform.OS !== 'android' || this.connected) return;
    const iap = getIAP();
    if (!iap) return;
    try {
      await iap.initConnection();
      this.connected = true;
    } catch (e) {
      console.warn('[GPBilling] connect failed:', e);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.purchaseListener?.remove();
    this.errorListener?.remove();
    const iap = getIAP();
    if (iap) await iap.endConnection();
    this.connected = false;
  }

  /** Fetch localised price for a single product — used to display price in UI */
  async getProduct(productId: GPProductId): Promise<any | null> {
    if (Platform.OS !== 'android') return null;
    const iap = getIAP();
    if (!iap) return null;
    await this.connect();
    try {
      const productType = getProductType(productId);
      if (productType === 'subs') {
        const subscriptions = await iap.fetchProducts({ skus: [productId], type: 'subs' });
        return subscriptions?.[0] ?? null;
      }

      const products = await iap.fetchProducts({ skus: [productId], type: 'in-app' });
      return products?.[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Launch the Google Play purchase sheet for a product.
   * Resolves with the purchase token on success.
   * Rejects with an error message on failure/cancel.
   */
  purchase(productId: GPProductId, authToken: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (Platform.OS !== 'android') {
        reject(new Error('Google Play Billing only available on Android'));
        return;
      }
      const iap = getIAP();
      if (!iap) {
        reject(new Error('Google Play Billing not available in Expo Go. Use a production build.'));
        return;
      }
      await this.connect();
      const productType = getProductType(productId);

      // Set up listeners before triggering purchase
      this.purchaseListener = iap.purchaseUpdatedListener(async (purchase: any) => {
        if (purchase.productId !== productId) return;
        try {
          // Validate with our backend
          const valid = await this.validateWithBackend(
            purchase.productId,
            purchase.purchaseToken ?? '',
            authToken,
          );
          if (valid) {
            await iap.finishTransaction({ purchase, isConsumable: productType === 'in-app' });
            this.purchaseListener?.remove();
            this.errorListener?.remove();
            resolve(purchase.purchaseToken ?? '');
          } else {
            this.purchaseListener?.remove();
            this.errorListener?.remove();
            reject(new Error('Purchase validation failed. Please contact support.'));
          }
        } catch (e: any) {
          this.purchaseListener?.remove();
          this.errorListener?.remove();
          reject(e);
        }
      });

      this.errorListener = iap.purchaseErrorListener((error: any) => {
        this.purchaseListener?.remove();
        this.errorListener?.remove();
        if (error.code === 'E_USER_CANCELLED') {
          reject(new Error('Purchase cancelled.'));
        } else {
          reject(new Error(error.message ?? 'Purchase failed.'));
        }
      });

      try {
        await iap.requestPurchase({
          request: {
            google: { skus: [productId] },
          },
          type: productType,
        });
      } catch (e: any) {
        this.purchaseListener?.remove();
        this.errorListener?.remove();
        reject(e);
      }
    });
  }

  private async validateWithBackend(
    productId: string,
    purchaseToken: string,
    authToken: string,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/validateGooglePlay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId, purchaseToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }
}

export const googlePlayBilling = new GooglePlayBillingService();
