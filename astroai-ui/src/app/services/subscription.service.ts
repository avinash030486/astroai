import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';

export interface Subscription {
  id?: string;
  user_id: string;
  plan: 'free' | 'rhythm' | 'payg';
  status: 'active' | 'cancelled' | 'expired';
  amount_usd?: number;
  credits_remaining?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  started_at?: string;
  expires_at?: string;
  created_at?: string;
}

export interface PlanFeatures {
  name: string;
  price: string;
  credits: number;
  features: string[];
  canAccessPremium: boolean;
  canAccessMatchmaking: boolean;
  canAccessRemedies: boolean;
  canAccessNumerology: boolean;
  canSaveReports: boolean;
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    name: 'Free',
    price: '$0',
    credits: 5,
    features: ['Daily horoscope', 'Panchang', '5 questions/week'],
    canAccessPremium: false,
    canAccessMatchmaking: false,
    canAccessRemedies: false,
    canAccessNumerology: false,
    canSaveReports: false,
  },
  rhythm: {
    name: 'Rhythm',
    price: '$2.99/week',
    credits: 200,
    features: ['200 credits/month', 'Weekly prediction', 'Matchmaking', 'Remedies', 'Numerology', 'Save reports'],
    canAccessPremium: true,
    canAccessMatchmaking: true,
    canAccessRemedies: true,
    canAccessNumerology: true,
    canSaveReports: true,
  },
  payg: {
    name: 'Pay as you go',
    price: 'from $3.99',
    credits: 100,
    features: ['100 credits', 'Birth chart analysis', 'On-demand'],
    canAccessPremium: true,
    canAccessMatchmaking: false,
    canAccessRemedies: false,
    canAccessNumerology: false,
    canSaveReports: true,
  },
};

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  private subjectSubscription = new BehaviorSubject<Subscription | null>(null);
  public subscription$ = this.subjectSubscription.asObservable();

  constructor(private db: SupabaseDbService, private auth: AuthService) {
    this.auth.user$.subscribe(user => {
      if (user && !user.is_anonymous) {
        this.loadSubscription(user.id);
      } else {
        this.subjectSubscription.next(null);
      }
    });
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async loadSubscription(userId: string): Promise<void> {
    const { data, error } = await this.db.getSubscription(userId);
    if (!error && data) {
      this.subjectSubscription.next(data as Subscription);
    } else {
      // No active subscription → treat as free
      this.subjectSubscription.next({ user_id: userId, plan: 'free', status: 'active', credits_remaining: 5 });
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  getCurrentPlan(): 'free' | 'rhythm' | 'payg' {
    return this.subjectSubscription.value?.plan || 'free';
  }

  getCurrentSubscription(): Subscription | null {
    return this.subjectSubscription.value;
  }

  getPlanFeatures(plan?: string): PlanFeatures {
    return PLAN_FEATURES[plan || this.getCurrentPlan()] || PLAN_FEATURES['free'];
  }

  isFeatureAllowed(feature: keyof PlanFeatures): boolean {
    return !!this.getPlanFeatures()[feature];
  }

  getRemainingCredits(): number {
    return this.subjectSubscription.value?.credits_remaining ?? 5;
  }

  isPremium(): boolean {
    return this.getCurrentPlan() !== 'free';
  }

  /** Call after successful Stripe payment */
  async activateSubscription(plan: 'rhythm' | 'payg', amountUsd: number, stripeDetails?: { customerId?: string; subscriptionId?: string }): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const credits = plan === 'rhythm' ? 200 : 100;
    const expiresAt = plan === 'rhythm'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()   // 1 week
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();  // 30 days

    const sub: Subscription = {
      user_id: user.id,
      plan,
      status: 'active',
      amount_usd: amountUsd,
      credits_remaining: credits,
      stripe_customer_id: stripeDetails?.customerId,
      stripe_subscription_id: stripeDetails?.subscriptionId,
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    const { data, error } = await this.db.upsertSubscription(sub);
    if (!error) {
      this.subjectSubscription.next({ ...sub, id: (data as any)?.id });
    }
  }

  async decrementCredit(): Promise<void> {
    const sub = this.subjectSubscription.value;
    if (!sub) return;
    const remaining = Math.max(0, (sub.credits_remaining ?? 0) - 1);
    if (sub.id) {
      await this.db.upsertSubscription({ ...sub, credits_remaining: remaining });
    }
    this.subjectSubscription.next({ ...sub, credits_remaining: remaining });
  }
}
