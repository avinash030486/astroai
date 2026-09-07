import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService
  ) {
    this.analytics.track('login_view', '/login');

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason) {
      this.analytics.track('oauth_login_returned', '/login', { reason });
    }

    // If already authenticated, redirect to daily prediction
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/daily-prediction']);
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.analytics.track('oauth_start', '/login');
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.error = error.message || 'Failed to sign in with Google';
      this.analytics.track('oauth_start_failed', '/login', { message: this.error });
      this.loading = false;
    }
  }
}
