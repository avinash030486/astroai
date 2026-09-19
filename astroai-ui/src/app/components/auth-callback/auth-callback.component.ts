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

  private isAppDeepLinkTarget(target: string | null): target is string {
    if (!target) {
      return false;
    }

    const lowerTarget = target.toLowerCase();
    return !lowerTarget.startsWith('http://') && !lowerTarget.startsWith('https://');
  }

  private buildAndroidIntentUrl(deepLink: string): string | null {
    const match = deepLink.match(/^([a-z][a-z0-9+.-]*):\/\/(.+)$/i);
    if (!match) {
      return null;
    }

    const [, scheme, rest] = match;
    const packageSegment = scheme === 'exp' ? ';package=host.exp.exponent' : '';
    return `intent://${rest}#Intent;scheme=${scheme}${packageSegment};end`;
  }

  private shouldUseAndroidIntent(deepLink: string, usesAuthSession: boolean): boolean {
    if (!/Android/i.test(navigator.userAgent)) {
      return false;
    }

    const lowerDeepLink = deepLink.toLowerCase();

    // Expo Go deep links still need an Android intent handoff from Chrome.
    if (lowerDeepLink.startsWith('exp://')) {
      return true;
    }

    return !usesAuthSession;
  }

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

    const code = urlParams.get('code');
    // expo_url is embedded in redirect_to by the native app (not in state — Supabase owns state)
    const expoUrl = urlParams.get('expo_url') || hashParams.get('expo_url');
    const usesAuthSession = urlParams.get('auth_session') === '1' || hashParams.get('auth_session') === '1';
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const oauthError = urlParams.get('error') || hashParams.get('error');
    const oauthErrorDescription = urlParams.get('error_description') || hashParams.get('error_description');

    this.analytics.track('oauth_callback_received', '/auth-callback', {
      has_code: Boolean(code),
      has_access_token: Boolean(accessToken),
      has_error: Boolean(oauthError)
    });

    if (this.isAppDeepLinkTarget(expoUrl)) {
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
      if (this.shouldUseAndroidIntent(deepLink, usesAuthSession)) {
        const intentUrl = this.buildAndroidIntentUrl(deepLink);
        if (intentUrl) {
          console.log('📱 Intent URL:', intentUrl);
          window.location.href = intentUrl;
          return;
        }
      }

      window.location.href = deepLink;
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
