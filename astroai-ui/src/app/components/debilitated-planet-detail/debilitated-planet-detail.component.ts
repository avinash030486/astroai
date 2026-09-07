import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  DebilitatedPlanetData,
  DebilitatedPlanetHouseData,
  DEBILITATED_PLANET_HOUSE_DATA,
  getDebilitatedPlanetBySlug,
  getDebilitatedPlanetHouseBySlug,
  getDebilitatedPlanetHousesByPlanet,
} from '../../data/debilitated-planets';

@Component({
  selector: 'app-debilitated-planet-detail',
  templateUrl: './debilitated-planet-detail.component.html',
  styleUrls: ['./debilitated-planet-detail.component.scss']
})
export class DebilitatedPlanetDetailComponent implements OnInit {
  planet: DebilitatedPlanetData | undefined;
  houseEntries: DebilitatedPlanetHouseData[] = [];
  selectedHouse: DebilitatedPlanetHouseData | undefined;
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
    const houseMatch = getDebilitatedPlanetHouseBySlug(slug);
    if (houseMatch) {
      this.mode = 'house';
      this.selectedHouse = houseMatch;
      this.planet = getDebilitatedPlanetBySlug(`debilitated-${houseMatch.planet.toLowerCase()}`);
      this.houseEntries = this.planet ? getDebilitatedPlanetHousesByPlanet(this.planet.planet) : [];
      this.setHouseMeta(houseMatch);
      this.loading = false;
      return;
    }

    // Try planet overview slug
    const planetMatch = getDebilitatedPlanetBySlug(slug);
    if (planetMatch) {
      this.mode = 'overview';
      this.planet = planetMatch;
      this.selectedHouse = undefined;
      this.houseEntries = getDebilitatedPlanetHousesByPlanet(planetMatch.planet);
      this.setOverviewMeta(planetMatch);
      this.loading = false;
      return;
    }

    this.router.navigate(['/not-found'], { replaceUrl: true });
  }

  private setOverviewMeta(p: DebilitatedPlanetData): void {
    this.titleService.setTitle(p.title);
    this.metaService.updateTag({ name: 'description', content: p.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: p.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: p.title });
    this.metaService.updateTag({ property: 'og:description', content: p.metaDescription });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/debilitated-planet/${p.slug}` });
  }

  private setHouseMeta(h: DebilitatedPlanetHouseData): void {
    this.titleService.setTitle(h.title);
    this.metaService.updateTag({ name: 'description', content: h.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: h.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: h.title });
    this.metaService.updateTag({ property: 'og:description', content: h.metaDescription });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/debilitated-planet/${h.slug}` });
  }

  selectHouse(h: DebilitatedPlanetHouseData): void {
    this.selectedHouse = h;
    this.mode = 'house';
    this.router.navigate(['/debilitated-planet', h.slug], { replaceUrl: true });
    this.setHouseMeta(h);
  }

  showOverview(): void {
    if (!this.planet) return;
    this.mode = 'overview';
    this.selectedHouse = undefined;
    this.router.navigate(['/debilitated-planet', this.planet.slug], { replaceUrl: true });
    this.setOverviewMeta(this.planet);
  }

  goBack(): void {
    this.router.navigate(['/debilitated-planets']);
  }

  gotoBirthChart(): void {
    this.router.navigate(['/birth-chart']);
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }
}
