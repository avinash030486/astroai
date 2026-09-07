import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreditsService } from '../../services/credits.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private credits: CreditsService,
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  private async waitForAuthenticatedUser(timeoutMs = 12000): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      if (this.authService.isAuthenticated()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    return false;
  }

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

    const code = urlParams.get('code');
    // expo_url is embedded in redirect_to by the native app (not in state — Supabase owns state)
    const expoUrl = urlParams.get('expo_url');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const oauthError = urlParams.get('error') || hashParams.get('error');
    const oauthErrorDescription = urlParams.get('error_description') || hashParams.get('error_description');

    this.analytics.track('oauth_callback_received', '/auth-callback', {
      has_code: Boolean(code),
      has_access_token: Boolean(accessToken),
      has_error: Boolean(oauthError)
    });

    if (expoUrl && (expoUrl.startsWith('exp://') || expoUrl.startsWith('vedicastro://'))) {
      let deepLink = expoUrl;
      if (code) {
        deepLink += (deepLink.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(code);
      } else if (accessToken) {
        deepLink += '#access_token=' + accessToken;
        if (refreshToken) deepLink += '&refresh_token=' + refreshToken;
      }
      console.log('📱 Mobile relay — deepLink:', deepLink);

      // Android Chrome 96+ blocks window.location.href = 'exp://...' (custom scheme).
      // Use Android Intent URL which full Chrome always handles correctly.
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (isAndroid && deepLink.startsWith('exp://')) {
        const withoutScheme = deepLink.replace(/^exp:\/\//, '');
        const intentUrl = `intent://${withoutScheme}#Intent;scheme=exp;package=host.exp.exponent;end`;
        console.log('📱 Intent URL:', intentUrl);
        window.location.href = intentUrl;
      } else {
        window.location.href = deepLink;
      }
      return;
    }

    if (oauthError) {
      this.analytics.track('oauth_callback_failed', '/auth-callback', {
        reason: oauthError,
        description: oauthErrorDescription || null
      });
      this.router.navigate(['/login'], { queryParams: { reason: oauthError } });
      return;
    }

    // Normal web flow
    void this.completeWebFlow();
  }

  private async completeWebFlow(): Promise<void> {
    const authenticated = await this.waitForAuthenticatedUser();

    if (authenticated) {
      console.log('✅ User authenticated, redirecting to birth chart');
      this.analytics.track('oauth_callback_success', '/auth-callback');
      await this.credits.processPendingReferral();
      await this.credits.loadCredits();
      this.router.navigate(['/birth-chart']);
      return;
    }

    console.log('⚠️ Authentication failed, redirecting to login');
    this.analytics.track('oauth_callback_failed', '/auth-callback', {
      reason: 'auth_timeout'
    });
    this.router.navigate(['/login'], { queryParams: { reason: 'auth_timeout' } });
  }
}
