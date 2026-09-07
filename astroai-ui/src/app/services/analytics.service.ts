import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';
import { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  constructor(
    private db: SupabaseDbService,
    private auth: AuthService,
    private router: Router
  ) {}

  private isInternalUser(user: User): boolean {
    const email = (user.email || '').toLowerCase();
    const metadata = user.user_metadata || {};
    return Boolean(
      metadata['is_internal'] ||
      metadata['internal_user'] ||
      metadata['role'] === 'admin' ||
      email.endsWith('@vedicastro.app') ||
      email.includes('+internal@') ||
      email.includes('+test@')
    );
  }

  /** Call once from AppComponent.ngOnInit() to start auto page-view tracking */
  init(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.track('page_view', e.urlAfterRedirects);
      });
  }

  async track(eventName: string, page?: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) return;
      const email = (user.email || '').toLowerCase();
      const mergedMetadata = {
        ...(metadata ?? {}),
        internal_user: this.isInternalUser(user),
        email_domain: email.includes('@') ? email.split('@')[1] : null,
      };
      await this.db.trackEvent({
        user_id: user.id,
        event_name: eventName,
        page: page ?? this.router.url,
        metadata: mergedMetadata,
      });
    } catch {
      // Analytics should never crash the app — silently swallow
    }
  }

  // ─── Convenience helpers ───────────────────────────────────────────────────

  trackPaywallShown(feature: string): void {
    this.track('paywall_shown', undefined, { feature });
  }

  trackPaymentStarted(plan: string, amount: number): void {
    this.track('payment_started', undefined, { plan, amount });
  }

  trackPaymentSuccess(plan: string, amount: number): void {
    this.track('payment_success', undefined, { plan, amount });
  }

  trackFeatureUsed(feature: string): void {
    this.track('feature_used', undefined, { feature });
  }

  trackChartSaved(): void {
    this.track('birth_chart_saved');
  }

  trackReportViewed(reportType: string): void {
    this.track('report_viewed', undefined, { report_type: reportType });
  }

  trackReferralShared(): void {
    this.track('referral_shared');
  }
}
