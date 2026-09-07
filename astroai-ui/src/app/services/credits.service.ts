import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';

export interface CreditTransaction {
  id: string;
  amount_usd: number;
  type: 'referral_reward' | 'referral_signup' | 'spend' | 'manual';
  description: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CreditsService {

  balance = signal<number>(0);
  transactions = signal<CreditTransaction[]>([]);
  loading = signal<boolean>(false);

  constructor(
    private auth: AuthService,
    private db: SupabaseDbService,
  ) {}

  get formattedBalance(): string {
    return `$${this.balance().toFixed(2)}`;
  }

  get hasCredits(): boolean {
    return this.balance() > 0;
  }

  async loadCredits(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    this.loading.set(true);
    try {
      const [balRes, txRes] = await Promise.all([
        this.db.getCreditBalance(user.id),
        this.db.getCreditTransactions(user.id),
      ]);
      this.balance.set(parseFloat(balRes.data?.balance_usd ?? 0));
      this.transactions.set(txRes.data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  /** Process a pending referral code (stored in sessionStorage before login) */
  async processPendingReferral(): Promise<void> {
    const code = sessionStorage.getItem('pending_referral');
    if (!code) return;

    const user = this.auth.getCurrentUser();
    if (!user || (user as any).is_anonymous) return;

    try {
      // Find referrer by code
      const { data: ref } = await this.db.getReferralByCode(code);
      if (!ref || ref.reward_paid || ref.referrer_id === user.id) {
        sessionStorage.removeItem('pending_referral');
        return;
      }

      // Call DB function atomically
      await this.db.awardReferralCredit(ref.referrer_id, user.id, code);
      sessionStorage.removeItem('pending_referral');

      // Reload balance so UI reflects new credits
      await this.loadCredits();
    } catch (e) {
      console.warn('processPendingReferral error:', e);
    }
  }

  /**
   * Apply credits toward a purchase. Returns the amount that was applied.
   * Call this before charging Stripe — reduce the Stripe amount by the returned value.
   */
  async applyCreditsToPayment(amountUsd: number, description: string): Promise<number> {
    const user = this.auth.getCurrentUser();
    if (!user || this.balance() <= 0) return 0;

    const toApply = Math.min(this.balance(), amountUsd);
    const { data: ok } = await this.db.spendCredits(user.id, toApply, description);
    if (ok === true) {
      await this.loadCredits();
      return toApply;
    }
    return 0;
  }
}
