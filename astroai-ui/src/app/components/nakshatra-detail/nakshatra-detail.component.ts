import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { NakshatraData, getNakshatraBySlug, NAKSHATRA_DATA } from '../../data/nakshatras';

@Component({
  selector: 'app-nakshatra-detail',
  templateUrl: './nakshatra-detail.component.html',
  styleUrls: ['./nakshatra-detail.component.scss']
})
export class NakshatraDetailComponent implements OnInit {
  nakshatra: NakshatraData | undefined;
  loading = true;
  notFound = false;
  prevNakshatra: NakshatraData | undefined;
  nextNakshatra: NakshatraData | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.load(params['slug']);
    });
  }

  private load(slug: string): void {
    this.nakshatra = getNakshatraBySlug(slug);
    if (this.nakshatra) {
      const idx = this.nakshatra.id - 1; // 0-based
      this.prevNakshatra = idx > 0 ? NAKSHATRA_DATA[idx - 1] : undefined;
      this.nextNakshatra = idx < 26 ? NAKSHATRA_DATA[idx + 1] : undefined;
      this.setMetaTags();
      this.loading = false;
    } else {
      this.notFound = true;
      this.loading = false;
    }
  }

  private setMetaTags(): void {
    if (!this.nakshatra) return;
    const n = this.nakshatra;
    const title = `${n.name} Nakshatra — Meaning, Deity, Qualities & Remedies | Vedic Astro`;
    this.titleService.setTitle(title);

    const desc = `${n.summary} Ruled by ${n.rulingPlanet}, spanning ${n.zodiacRange}. Learn career guidance, relationship insights, health themes and Vedic remedies for ${n.name} Nakshatra.`;
    this.metaService.updateTag({ name: 'description', content: desc });
    this.metaService.updateTag({ name: 'keywords', content: n.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: desc });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/nakshatra/${n.slug}` });
  }

  goBack(): void { this.router.navigate(['/nakshatras']); }
  goBirthChart(): void { this.router.navigate(['/birth-chart']); }
  goToNakshatra(slug: string): void { this.router.navigate(['/nakshatra', slug]); }
}
