import { Injectable, NgZone } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Central service to manage document titles/meta tags and move focus
 * to the main content region after route changes.
 */
@Injectable({ providedIn: 'root' })
export class SeoFocusService {
  constructor(private title: Title, private meta: Meta, private router: Router, private zone: NgZone) {
    this.setupFocusOnNavigation();
  }

  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  private setupFocusOnNavigation(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      // Run in Angular zone and after the view has updated
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          const main = document.getElementById('main-content');
          if (main) {
            // Make main focusable if needed
            if (!main.hasAttribute('tabindex')) {
              main.setAttribute('tabindex', '-1');
            }
            (main as HTMLElement).focus();
          }
        }, 0);
      });
    });
  }
}
