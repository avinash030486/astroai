import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PLANET_HOUSE_DATA, PlanetHouseData, PlanetName, getAllPlanets } from '../../data/planet-houses';

interface PlanetOption {
  key: PlanetName;
  planetSanskrit: string;
  glyph: string;
}

@Component({
  selector: 'app-planet-house-list',
  templateUrl: './planet-house-list.component.html',
  styleUrls: ['./planet-house-list.component.scss']
})
export class PlanetHouseListComponent implements OnInit {
  allCombinations: PlanetHouseData[] = PLANET_HOUSE_DATA;
  selectedPlanet: PlanetName | 'all' = 'all';
  planetOptions: PlanetOption[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.planetOptions = getAllPlanets().map(p => ({
      key: p.key,
      planetSanskrit: p.planetSanskrit,
      glyph: p.glyph,
    }));
    this.setMetaTags();
  }

  private setMetaTags(): void {
    this.titleService.setTitle('Planet in House Meanings - 9 Planets in 12 Houses | Vedic Astro');

    this.metaService.updateTag({
      name: 'description',
      content: 'Understand the impact of each of the 9 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in all 12 houses of the horoscope. Learn general effects, career, relationships, health, spiritual themes and remedies for every placement.',
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'planet in house, sun in 1st house, moon in 7th house, mars in 10th house, rahu in 8th house, ketu in 12th house, vedic astrology planets in houses, navagraha effects by house',
    });

    this.metaService.updateTag({ property: 'og:title', content: 'Planet in House Meanings - Complete Guide | Vedic Astro' });
    this.metaService.updateTag({ property: 'og:description', content: 'Browse 9 planets across 12 houses and understand how each placement shapes your personality, career, relationships, health and spiritual path.' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://vedicastro.app/planets' });
  }

  get displayedCombinations(): PlanetHouseData[] {
    if (this.selectedPlanet === 'all') {
      return this.allCombinations.slice().sort((a, b) => {
        if (a.planet === b.planet) return a.house - b.house;
        return a.planet.localeCompare(b.planet);
      });
    }

    return this.allCombinations
      .filter(c => c.planet === this.selectedPlanet)
      .sort((a, b) => a.house - b.house);
  }

  setPlanet(planet: PlanetName | 'all'): void {
    this.selectedPlanet = planet;
  }

  viewCombination(item: PlanetHouseData): void {
    this.router.navigate(['/planet', item.slug]);
  }
}
