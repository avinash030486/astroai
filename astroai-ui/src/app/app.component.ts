import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
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
  isLandingPage = false;

private landingRoutes = ['/'];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Set immediately for initial load
    this.isLandingPage = this.router.url === '/';

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Update on every navigation
        this.isLandingPage = event.urlAfterRedirects === '/';

    console.log('🚀 AppComponent initialized, AuthService injected');

    // ✅ Google Analytics route tracking
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        if (typeof gtag === 'function') {
          gtag('config', 'G-GZY7ZCH74T', {
            page_path: event.urlAfterRedirects
          });
        }
      }
    });
      });
  }

  ngOnInit(): void {
    console.log('📱 AppComponent ngOnInit');

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