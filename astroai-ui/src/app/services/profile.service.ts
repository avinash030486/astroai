import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  date_of_birth?: string;   // 'YYYY-MM-DD'
  time_of_birth?: string;   // 'HH:MM'
  birth_place_label?: string;
  city?: string;
  state?: string;
  country?: string;
  zodiac_sign?: string;
  nakshatra?: string;
  referral_code?: string;
  referred_by?: string;
  updated_at?: string;
  created_at?: string;
}

export interface SavedBirthChart {
  id?: string;
  user_id?: string;
  label: string;
  date_of_birth: string;
  time_of_birth: string;
  birth_place: string;
  chart_data?: any;
  is_primary?: boolean;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private db: SupabaseDbService, private auth: AuthService) {
    // Auto-load profile when a real (non-anonymous) user logs in
    this.auth.user$.subscribe(user => {
      if (user && !user.is_anonymous) {
        this.loadOrCreateProfile(user.id, user.email, user.user_metadata);
      } else {
        this.profileSubject.next(null);
      }
    });
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async loadOrCreateProfile(userId: string, email?: string, meta?: any): Promise<void> {
    const { data, error } = await this.db.getProfile(userId);
    if (!error && data) {
      this.profileSubject.next(data as UserProfile);
    } else {
      // PGRST116 = row not found → create new profile
      const newProfile: UserProfile = {
        id: userId,
        email: email || '',
        full_name: meta?.full_name || meta?.name || '',
        avatar_url: meta?.avatar_url || meta?.picture || '',
      };
      const { data: created } = await this.db.upsertProfile(newProfile);
      if (created) this.profileSubject.next(created as UserProfile);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  getCurrentProfile(): UserProfile | null {
    return this.profileSubject.value;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const user = this.auth.getCurrentUser();
    if (!user) return false;

    const payload = { ...updates, id: user.id, updated_at: new Date().toISOString() };
    const { data, error } = await this.db.upsertProfile(payload);
    if (!error) {
      this.profileSubject.next({ ...this.profileSubject.value, ...updates } as UserProfile);
      return true;
    }
    console.error('Profile update error:', error);
    return false;
  }

  // ─── Birth Charts ──────────────────────────────────────────────────────────

  async getSavedCharts(): Promise<SavedBirthChart[]> {
    const user = this.auth.getCurrentUser();
    if (!user || user.is_anonymous) return [];
    const { data, error } = await this.db.getBirthCharts(user.id);
    return error ? [] : (data as SavedBirthChart[]) || [];
  }

  async saveChart(chart: Omit<SavedBirthChart, 'user_id' | 'id'>): Promise<SavedBirthChart | null> {
    const user = this.auth.getCurrentUser();
    if (!user || user.is_anonymous) return null;
    const { data, error } = await this.db.saveBirthChart({ ...chart, user_id: user.id });
    if (error) { console.error('Save chart error:', error); return null; }
    return data as SavedBirthChart;
  }

  async deleteChart(id: string): Promise<void> {
    await this.db.deleteBirthChart(id);
  }

  async getPrimaryChart(): Promise<SavedBirthChart | null> {
    const charts = await this.getSavedCharts();
    return charts.find(c => c.is_primary) || charts[0] || null;
  }

  hasCompleteBirthDetails(): boolean {
    const p = this.profileSubject.value;
    return !!(p?.date_of_birth && p?.time_of_birth && p?.birth_place_label);
  }
}
