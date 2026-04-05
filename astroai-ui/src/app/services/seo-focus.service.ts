import { Injectable, NgZone } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface PageSeoConfig {
  title: string;
  description: string;
  keywords?: string;
  /** Route path, e.g. '/birth-chart' — will be appended to BASE_URL */
  canonical?: string;
  /** Absolute URL or relative path to og:image — defaults to og-image.png */
  ogImage?: string;
}

const BASE_URL = 'https://vedicastro.app';
const DEFAULT_IMAGE = `${BASE_URL}/assets/vedicastro-logo.png`;
const SUFFIX = ' | VedicAstro';

/**
 * Central service to manage per-page SEO (title, meta, OG, Twitter, canonical)
 * and move focus to the main content region after route changes.
 */
@Injectable({ providedIn: 'root' })
export class SeoFocusService {
  constructor(
    private titleSvc: Title,
    private meta: Meta,
    private router: Router,
    private zone: NgZone
  ) {
    this.setupFocusOnNavigation();
  }

  /** Full per-page SEO update: title, description, keywords, canonical, OG, Twitter */
  setPage(config: PageSeoConfig): void {
    const fullTitle = config.title.includes('VedicAstro') ? config.title : `${config.title}${SUFFIX}`;
    const canonical = config.canonical ? `${BASE_URL}${config.canonical}` : BASE_URL;
    const image = config.ogImage
      ? (config.ogImage.startsWith('http') ? config.ogImage : `${BASE_URL}/${config.ogImage}`)
      : DEFAULT_IMAGE;

    // Title
    this.titleSvc.setTitle(fullTitle);

    // Standard meta
    this.meta.updateTag({ name: 'description', content: config.description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    // Canonical link
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);

    // Open Graph
    this.meta.updateTag({ property: 'og:title',       content: fullTitle });
    this.meta.updateTag({ property: 'og:description',  content: config.description });
    this.meta.updateTag({ property: 'og:url',          content: canonical });
    this.meta.updateTag({ property: 'og:image',        content: image });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:title',       content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image',       content: image });
  }

  /** Legacy helpers — kept for backward-compat with daily-panchang & others */
  setTitle(title: string): void {
    this.titleSvc.setTitle(title);
  }

  setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  private setupFocusOnNavigation(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          const main = document.getElementById('main-content');
          if (main) {
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
