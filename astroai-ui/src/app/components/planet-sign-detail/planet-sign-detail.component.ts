import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PlanetSignData, getPlanetSignBySlug } from '../../data/planet-signs';

@Component({
  selector: 'app-planet-sign-detail',
  templateUrl: './planet-sign-detail.component.html',
  styleUrls: ['./planet-sign-detail.component.scss']
})
export class PlanetSignDetailComponent implements OnInit {
  combo: PlanetSignData | undefined;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadCombination(slug);
    });
  }

  private loadCombination(slug: string): void {
    this.combo = getPlanetSignBySlug(slug);

    if (this.combo) {
      this.setMetaTags();
      this.loading = false;
    } else {
      this.notFound = true;
      this.loading = false;
    }
  }

  private setMetaTags(): void {
    if (!this.combo) return;

    const title = `${this.combo.title} - Planet in Sign Meaning | Vedic Astro`;
    this.titleService.setTitle(title);

    const description = `${this.combo.summary} Learn personality traits, career themes, relationship patterns, growth challenges, spiritual lessons and remedies for ${this.combo.planet} in ${this.combo.sign}.`;

    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: this.combo.keywords.join(', ') });

    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/planet-sign/${this.combo.slug}` });
  }

  goBack(): void {
    this.router.navigate(['/planet-signs']);
  }

  gotoBirthChart(): void {
    this.router.navigate(['/birth-chart']);
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }
}
