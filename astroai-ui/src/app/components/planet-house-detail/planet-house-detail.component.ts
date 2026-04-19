import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PlanetHouseData, getPlanetHouseBySlug } from '../../data/planet-houses';

@Component({
  selector: 'app-planet-house-detail',
  templateUrl: './planet-house-detail.component.html',
  styleUrls: ['./planet-house-detail.component.scss']
})
export class PlanetHouseDetailComponent implements OnInit {
  combo: PlanetHouseData | undefined;
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
    this.combo = getPlanetHouseBySlug(slug);

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

    const title = `${this.combo.title} - Planet in House Meaning | Vedic Astro`;
    this.titleService.setTitle(title);

    const description = `${this.combo.summary} Learn general effects, career, relationships, health, spiritual themes and remedies for ${this.combo.planet} in the ${this.combo.house}th house.`;

    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({
      name: 'keywords',
      content: this.combo.keywords.join(', '),
    });

    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/planet/${this.combo.slug}` });
  }

  goBack(): void {
    this.router.navigate(['/planets']);
  }

  gotoBirthChart(): void {
    this.router.navigate(['/birth-chart']);
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }
}
