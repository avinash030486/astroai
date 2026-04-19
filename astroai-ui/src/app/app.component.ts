import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { AnalyticsService } from './services/analytics.service';
import { ReferralService } from './services/referral.service';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'astroai-ui';
  year = new Date().getFullYear();
  showSupportModal = false;

  // ─── Mobile nav state (replaces Bootstrap JS dependency) ──────────────────
  isNavOpen = false;
  openDropdown: string | null = null;

  toggleNav(): void {
    this.isNavOpen = !this.isNavOpen;
    if (!this.isNavOpen) this.openDropdown = null;
  }

  toggleDropdown(name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  closeAll(): void {
    this.isNavOpen = false;
    this.openDropdown = null;
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private analytics: AnalyticsService,
    private referral: ReferralService
  ) {
    this.referral.checkReferralInUrl();
    console.log('🚀 AppComponent initialized, AuthService injected');

    // ✅ Google Analytics route tracking
    this.router.events
      .pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        if (typeof gtag === 'function') {
          gtag('config', 'G-GZY7ZCH74T', {
            page_path: event.urlAfterRedirects
          });
        }
      });
  }

  ngOnInit(): void {
    console.log('📱 AppComponent ngOnInit');
    this.analytics.init();

    setTimeout(() => {
      const session = this.authService.getCurrentSession();
      if (session) {
        const user = this.authService.getCurrentUser();
        if (user?.is_anonymous) {
          console.log('✅ Anonymous session active');
        } else {
          console.log('✅ Authenticated user:', user?.email);
        }
      } else {
        console.log('⚠️ No active session');
      }
    }, 3000);
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.closeAll();
  }
}