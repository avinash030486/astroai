import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  ExaltedPlanetData,
  ExaltedPlanetHouseData,
  EXALTED_PLANET_HOUSE_DATA,
  getExaltedPlanetBySlug,
  getExaltedPlanetHouseBySlug,
  getExaltedPlanetHousesByPlanet,
} from '../../data/exalted-planets';

@Component({
  selector: 'app-exalted-planet-detail',
  templateUrl: './exalted-planet-detail.component.html',
  styleUrls: ['./exalted-planet-detail.component.scss']
})
export class ExaltedPlanetDetailComponent implements OnInit {
  planet: ExaltedPlanetData | undefined;
  houseEntries: ExaltedPlanetHouseData[] = [];
  selectedHouse: ExaltedPlanetHouseData | undefined;
  mode: 'overview' | 'house' = 'overview';
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
      this.load(params['slug']);
    });
  }

  private load(slug: string): void {
    this.loading = true;
    this.notFound = false;

    // Try house slug first
    const houseMatch = getExaltedPlanetHouseBySlug(slug);
    if (houseMatch) {
      this.mode = 'house';
      this.selectedHouse = houseMatch;
      this.planet = getExaltedPlanetBySlug(`exalted-${houseMatch.planet.toLowerCase()}`);
      this.houseEntries = this.planet ? getExaltedPlanetHousesByPlanet(this.planet.planet) : [];
      this.setHouseMeta(houseMatch);
      this.loading = false;
      return;
    }

    // Try planet overview slug
    const planetMatch = getExaltedPlanetBySlug(slug);
    if (planetMatch) {
      this.mode = 'overview';
      this.planet = planetMatch;
      this.selectedHouse = undefined;
      this.houseEntries = getExaltedPlanetHousesByPlanet(planetMatch.planet);
      this.setOverviewMeta(planetMatch);
      this.loading = false;
      return;
    }

    this.router.navigate(['/not-found'], { replaceUrl: true });
  }

  private setOverviewMeta(p: ExaltedPlanetData): void {
    this.titleService.setTitle(p.title);
    this.metaService.updateTag({ name: 'description', content: p.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: p.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: p.title });
    this.metaService.updateTag({ property: 'og:description', content: p.metaDescription });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/exalted-planet/${p.slug}` });
  }

  private setHouseMeta(h: ExaltedPlanetHouseData): void {
    this.titleService.setTitle(h.title);
    this.metaService.updateTag({ name: 'description', content: h.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: h.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: h.title });
    this.metaService.updateTag({ property: 'og:description', content: h.metaDescription });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/exalted-planet/${h.slug}` });
  }

  selectHouse(h: ExaltedPlanetHouseData): void {
    this.selectedHouse = h;
    this.mode = 'house';
    this.router.navigate(['/exalted-planet', h.slug], { replaceUrl: true });
    this.setHouseMeta(h);
  }

  showOverview(): void {
    if (!this.planet) return;
    this.mode = 'overview';
    this.selectedHouse = undefined;
    this.router.navigate(['/exalted-planet', this.planet.slug], { replaceUrl: true });
    this.setOverviewMeta(this.planet);
  }

  goBack(): void {
    this.router.navigate(['/exalted-planets']);
  }

  gotoBirthChart(): void {
    this.router.navigate(['/birth-chart']);
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }
}
