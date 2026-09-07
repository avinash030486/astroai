import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

/**
 * Central service for all Supabase DB operations.
 * Reuses the singleton SupabaseClient from AuthService.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseDbService {

  private get db(): SupabaseClient {
    return this.auth.getClient();
  }

  constructor(private auth: AuthService) {}

  // ─── PROFILES ──────────────────────────────────────────────────────────────

  getProfile(userId: string) {
    return this.db.from('profiles').select('*').eq('id', userId).single();
  }

  upsertProfile(profile: any) {
    return this.db.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
  }

  // ─── BIRTH CHARTS ──────────────────────────────────────────────────────────

  getBirthCharts(userId: string) {
    return this.db
      .from('birth_charts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  saveBirthChart(chart: any) {
    return this.db.from('birth_charts').insert(chart).select().single();
  }

  updateBirthChart(id: string, updates: any) {
    return this.db.from('birth_charts').update(updates).eq('id', id).select().single();
  }

  deleteBirthChart(id: string) {
    return this.db.from('birth_charts').delete().eq('id', id);
  }

  // ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

  getSubscription(userId: string) {
    return this.db
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  upsertSubscription(subscription: any) {
    return this.db.from('subscriptions').upsert(subscription, { onConflict: 'id' }).select().single();
  }

  // ─── SAVED REPORTS ─────────────────────────────────────────────────────────

  getSavedReports(userId: string) {
    return this.db
      .from('saved_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  saveReport(report: any) {
    return this.db.from('saved_reports').insert(report).select().single();
  }

  deleteReport(id: string) {
    return this.db.from('saved_reports').delete().eq('id', id);
  }

  toggleFavourite(id: string, isFav: boolean) {
    return this.db.from('saved_reports').update({ is_favourite: isFav }).eq('id', id);
  }

  // ─── REFERRALS ─────────────────────────────────────────────────────────────

  getReferrals(referrerId: string) {
    return this.db.from('referrals').select('*').eq('referrer_id', referrerId);
  }

  getReferralByCode(code: string) {
    return this.db
      .from('referrals')
      .select('referrer_id, reward_paid')
      .eq('referral_code', code)
      .single();
  }

  createReferral(referral: any) {
    return this.db.from('referrals').insert(referral);
  }

  // ─── CREDITS ───────────────────────────────────────────────────────────────

  getCreditBalance(userId: string) {
    return this.db
      .from('user_credits')
      .select('balance_usd')
      .eq('user_id', userId)
      .maybeSingle();
  }

  getCreditTransactions(userId: string) {
    return this.db
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
  }

  awardReferralCredit(referrerId: string, refereeId: string, referralCode: string) {
    return this.db.rpc('award_referral_credit', {
      p_referrer_id: referrerId,
      p_referee_id: refereeId,
      p_referral_code: referralCode,
    });
  }

  spendCredits(userId: string, amountUsd: number, description: string) {
    return this.db.rpc('spend_credits', {
      p_user_id: userId,
      p_amount_usd: amountUsd,
      p_description: description,
    });
  }

  // ─── ANALYTICS ─────────────────────────────────────────────────────────────

  trackEvent(event: { user_id: string; event_name: string; page?: string; metadata?: any }) {
    return this.db.from('analytics_events').insert(event);
  }
}
