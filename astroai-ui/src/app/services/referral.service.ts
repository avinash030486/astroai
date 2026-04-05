import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';
import { ProfileService } from './profile.service';
import { AnalyticsService } from './analytics.service';

@Injectable({ providedIn: 'root' })
export class ReferralService {

  constructor(
    private db: SupabaseDbService,
    private auth: AuthService,
    private profile: ProfileService,
    private analytics: AnalyticsService
  ) {}

  getReferralCode(): string | null {
    return this.profile.getCurrentProfile()?.referral_code || null;
  }

  getReferralLink(): string {
    const code = this.getReferralCode();
    if (!code) return '';
    return `${window.location.origin}/?ref=${code}`;
  }

  async copyReferralLink(): Promise<boolean> {
    const link = this.getReferralLink();
    if (!link) return false;
    try {
      await navigator.clipboard.writeText(link);
      this.analytics.trackReferralShared();
      return true;
    } catch {
      return false;
    }
  }

  shareOnWhatsApp(): void {
    const link = this.getReferralLink();
    const msg = encodeURIComponent(`✨ Join me on VedicAstro — get personalized Vedic astrology insights! Use my link: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    this.analytics.trackReferralShared();
  }

  async getReferralCount(): Promise<number> {
    const user = this.auth.getCurrentUser();
    if (!user) return 0;
    const { data, error } = await this.db.getReferrals(user.id);
    return error ? 0 : (data?.length || 0);
  }

  /** Checks URL on app load for incoming referral codes */
  checkReferralInUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('pending_referral', refCode);
    }
  }

  /** Call after user successfully signs up / converts from anonymous */
  async processPendingReferral(): Promise<void> {
    const pendingCode = sessionStorage.getItem('pending_referral');
    if (!pendingCode) return;

    const user = this.auth.getCurrentUser();
    if (!user || user.is_anonymous) return;

    await this.profile.updateProfile({ referred_by: pendingCode });
    sessionStorage.removeItem('pending_referral');
  }
}
