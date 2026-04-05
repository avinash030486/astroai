import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ProfileService, UserProfile, SavedBirthChart } from '../../services/profile.service';
import { SubscriptionService, PLAN_FEATURES } from '../../services/subscription.service';
import { ReportService, SavedReport, REPORT_TYPE_LABELS } from '../../services/report.service';
import { ReferralService } from '../../services/referral.service';
import { AnalyticsService } from '../../services/analytics.service';
import { HoroscopeService, PlaceSuggestion } from '../../services/horoscope.service';

type DashboardTab = 'overview' | 'charts' | 'reports' | 'subscription' | 'referrals';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  activeTab: DashboardTab = 'overview';

  // State
  profile: UserProfile | null = null;
  savedCharts: SavedBirthChart[] = [];
  savedReports: SavedReport[] = [];
  referralCount = 0;
  copiedLink = false;
  loading = true;
  loadingCharts = false;
  loadingReports = false;

  // Edit profile
  editingProfile = false;
  profileForm = { full_name: '', date_of_birth: '', time_of_birth: '', birth_place_label: '' };
  savingProfile = false;

  // Place autocomplete
  placeSuggestions: PlaceSuggestion[] = [];
  showPlaceSuggestions = false;
  private placeInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Save chart modal
  showSaveChartModal = false;
  newChartLabel = 'My Chart';
  savingChart = false;

  // Notifications
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Report type metadata
  reportTypeLabels = REPORT_TYPE_LABELS;
  planFeatures = PLAN_FEATURES;

  constructor(
    public auth: AuthService,
    public profileService: ProfileService,
    public subscription: SubscriptionService,
    public reportService: ReportService,
    public referral: ReferralService,
    private analytics: AnalyticsService,
    private horoscope: HoroscopeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.analytics.track('page_view', '/dashboard');

    this.profileService.profile$.subscribe(p => {
      this.profile = p;
      if (p) {
        this.profileForm = {
          full_name: p.full_name || '',
          date_of_birth: p.date_of_birth || '',
          time_of_birth: p.time_of_birth || '',
          birth_place_label: p.birth_place_label || '',
        };
      }
    });

    this.loadDashboardData();

    // Wire place autocomplete
    this.placeInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => v.length >= 3),
      switchMap(v => this.horoscope.getPlaceSuggestions(v)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (s) => { this.placeSuggestions = s; this.showPlaceSuggestions = s.length > 0; },
      error: () => { this.placeSuggestions = []; this.showPlaceSuggestions = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    await Promise.all([
      this.loadCharts(),
      this.loadReports(),
      this.loadReferralCount(),
    ]);
    this.loading = false;
  }

  private async loadCharts(): Promise<void> {
    this.loadingCharts = true;
    this.savedCharts = await this.profileService.getSavedCharts();
    this.loadingCharts = false;
  }

  private async loadReports(): Promise<void> {
    this.loadingReports = true;
    this.savedReports = await this.reportService.getReports();
    this.loadingReports = false;
  }

  private async loadReferralCount(): Promise<void> {
    this.referralCount = await this.referral.getReferralCount();
  }

  // ─── Tab ──────────────────────────────────────────────────────────────────

  setTab(tab: DashboardTab): void {
    this.activeTab = tab;
    this.analytics.track('dashboard_tab_clicked', undefined, { tab });
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  startEditProfile(): void {
    this.editingProfile = true;
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
    this.placeSuggestions = [];
    this.showPlaceSuggestions = false;
  }

  onBirthPlaceInput(value: string): void {
    this.profileForm.birth_place_label = value;
    this.placeInput$.next(value);
  }

  selectPlaceSuggestion(s: PlaceSuggestion): void {
    this.profileForm.birth_place_label = s.description;
    this.placeSuggestions = [];
    this.showPlaceSuggestions = false;
  }

  hidePlaceSuggestions(): void {
    setTimeout(() => { this.showPlaceSuggestions = false; }, 200);
  }

  async saveProfile(): Promise<void> {
    this.savingProfile = true;
    const success = await this.profileService.updateProfile({
      full_name: this.profileForm.full_name,
      date_of_birth: this.profileForm.date_of_birth,
      time_of_birth: this.profileForm.time_of_birth,
      birth_place_label: this.profileForm.birth_place_label,
    });
    this.savingProfile = false;
    this.editingProfile = false;
    this.showToast(success ? '✅ Profile updated!' : '❌ Failed to update profile', success ? 'success' : 'error');
  }

  // ─── Charts ───────────────────────────────────────────────────────────────

  loadChartIntoApp(chart: SavedBirthChart): void {
    this.router.navigate(['/birth-chart'], {
      queryParams: {
        dob: chart.date_of_birth,
        tob: chart.time_of_birth,
        place: chart.birth_place,
      }
    });
  }

  async deleteChart(chart: SavedBirthChart): Promise<void> {
    if (!confirm(`Delete "${chart.label}"?`)) return;
    await this.profileService.deleteChart(chart.id!);
    this.savedCharts = this.savedCharts.filter(c => c.id !== chart.id);
    this.showToast('Chart deleted');
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  async toggleFav(report: SavedReport): Promise<void> {
    await this.reportService.toggleFavourite(report);
  }

  async deleteReport(report: SavedReport): Promise<void> {
    if (!confirm(`Delete report "${report.title}"?`)) return;
    await this.reportService.deleteReport(report.id!);
    this.savedReports = this.savedReports.filter(r => r.id !== report.id);
    this.showToast('Report deleted');
  }

  getReportIcon(type: string): string {
    return this.reportTypeLabels[type as keyof typeof REPORT_TYPE_LABELS]?.icon || '📄';
  }

  getReportLabel(type: string): string {
    return this.reportTypeLabels[type as keyof typeof REPORT_TYPE_LABELS]?.label || type;
  }

  // ─── Referral ─────────────────────────────────────────────────────────────

  async copyLink(): Promise<void> {
    const ok = await this.referral.copyReferralLink();
    if (ok) {
      this.copiedLink = true;
      this.showToast('🔗 Link copied to clipboard!');
      setTimeout(() => (this.copiedLink = false), 3000);
    }
  }

  shareOnWhatsApp(): void {
    this.referral.shareOnWhatsApp();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navigateToBirthChart(): void {
    const p = this.profile;
    this.router.navigate(['/birth-chart'], {
      queryParams: {
        dob:   p?.date_of_birth   || null,
        tob:   p?.time_of_birth   || null,
        place: p?.birth_place_label || null
      }
    });
  }

  getInitials(): string {
    const name = this.profile?.full_name || this.auth.getUserName() || this.auth.getUserEmail() || '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getPlanBadgeClass(): string {
    const plan = this.subscription.getCurrentPlan();
    return plan === 'free' ? 'badge-free' : plan === 'rhythm' ? 'badge-rhythm' : 'badge-payg';
  }

  private showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = ''), 3500);
  }
}
