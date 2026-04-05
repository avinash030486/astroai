import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseDbService } from './supabase-db.service';
import { AnalyticsService } from './analytics.service';

export type ReportType =
  | 'birth_chart'
  | 'numerology'
  | 'matchmaking'
  | 'gemstone'
  | 'yearly_horoscope'
  | 'daily_prediction';

export interface SavedReport {
  id?: string;
  user_id?: string;
  report_type: ReportType;
  title: string;
  report_data: any;
  is_favourite?: boolean;
  created_at?: string;
}

export const REPORT_TYPE_LABELS: Record<ReportType, { label: string; icon: string }> = {
  birth_chart:       { label: 'Birth Chart',       icon: '☿' },
  numerology:        { label: 'Numerology',         icon: '🔢' },
  matchmaking:       { label: 'Matchmaking',        icon: '♥' },
  gemstone:          { label: 'Gemstones',          icon: '💎' },
  yearly_horoscope:  { label: 'Yearly Horoscope',   icon: '📅' },
  daily_prediction:  { label: 'Daily Prediction',   icon: '🌙' },
};

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(
    private db: SupabaseDbService,
    private auth: AuthService,
    private analytics: AnalyticsService
  ) {}

  async saveReport(report: Omit<SavedReport, 'user_id' | 'id'>): Promise<SavedReport | null> {
    const user = this.auth.getCurrentUser();
    if (!user || user.is_anonymous) return null;

    const { data, error } = await this.db.saveReport({ ...report, user_id: user.id });
    if (error) { console.error('Save report error:', error); return null; }
    this.analytics.track('report_saved', undefined, { type: report.report_type });
    return data as SavedReport;
  }

  async getReports(): Promise<SavedReport[]> {
    const user = this.auth.getCurrentUser();
    if (!user || user.is_anonymous) return [];

    const { data, error } = await this.db.getSavedReports(user.id);
    return error ? [] : (data as SavedReport[]) || [];
  }

  async deleteReport(id: string): Promise<void> {
    await this.db.deleteReport(id);
  }

  async toggleFavourite(report: SavedReport): Promise<void> {
    if (!report.id) return;
    await this.db.toggleFavourite(report.id, !report.is_favourite);
    report.is_favourite = !report.is_favourite;
  }
}
