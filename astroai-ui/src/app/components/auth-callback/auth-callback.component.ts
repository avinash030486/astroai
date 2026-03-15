import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

    const code = urlParams.get('code');
    // expo_url is embedded in redirect_to by the native app (not in state — Supabase owns state)
    const expoUrl = urlParams.get('expo_url');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

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

    // Normal web flow
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        console.log('✅ User authenticated, redirecting to birth chart');
        this.router.navigate(['/birth-chart']);
      } else {
        console.log('⚠️ Authentication failed, redirecting to login');
        this.router.navigate(['/login']);
      }
    }, 2000);
  }
}
