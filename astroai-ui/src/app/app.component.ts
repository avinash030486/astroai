import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'astroai-ui';
  year = new Date().getFullYear();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    console.log('🚀 AppComponent initialized, AuthService injected');

    // ✅ Google Analytics route tracking
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
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

    // Check auth status after initialization
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
  }

  closeNavbar() {
    const navbar = document.getElementById('mainNav');
    if (navbar?.classList.contains('show')) {
      navbar.classList.remove('show');
    }
  }
}
