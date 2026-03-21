import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PLANET_SIGN_DATA, PlanetSignData, PlanetName, ZodiacSignName, getAllZodiacSigns } from '../../data/planet-signs';

interface SignOption {
  key: ZodiacSignName;
  signSanskrit: string;
}

@Component({
  selector: 'app-planet-sign-list',
  templateUrl: './planet-sign-list.component.html',
  styleUrls: ['./planet-sign-list.component.scss']
})
export class PlanetSignListComponent implements OnInit {
  allCombinations: PlanetSignData[] = PLANET_SIGN_DATA;
  selectedPlanet: PlanetName | 'all' = 'all';
  selectedSign: ZodiacSignName | 'all' = 'all';
  planetOptions: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  signOptions: SignOption[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.signOptions = getAllZodiacSigns().map(s => ({ key: s.key, signSanskrit: s.signSanskrit }));
    this.setMetaTags();
  }

  private setMetaTags(): void {
    this.titleService.setTitle('Planet in Zodiac Sign Meanings - 9 Planets in 12 Signs | Vedic Astro');

    this.metaService.updateTag({
      name: 'description',
      content: 'Browse the effects of each of the nine planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in all twelve zodiac signs (Mesha to Meena). Learn personality patterns, career themes, relationships, growth challenges, spiritual lessons and remedies for every combination.',
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'jupiter in aries, jupiter in taurus, mars in cancer, venus in leo, saturn in libra, rahu in scorpio, ketu in pisces, planet in sign, planet in rashi, vedic astrology planets in signs',
    });

    this.metaService.updateTag({ property: 'og:title', content: 'Planet in Zodiac Sign Meanings - Complete Guide | Vedic Astro' });
    this.metaService.updateTag({ property: 'og:description', content: 'Understand how each planet behaves in each zodiac sign and how it shapes character, career, relationships, growth path and spiritual lessons.' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://vedicastro.app/planet-signs' });
  }

  get displayedCombinations(): PlanetSignData[] {
    return this.allCombinations
      .filter(c => (this.selectedPlanet === 'all' ? true : c.planet === this.selectedPlanet))
      .filter(c => (this.selectedSign === 'all' ? true : c.sign === this.selectedSign))
      .slice()
      .sort((a, b) => {
        if (a.planet === b.planet) return a.sign.localeCompare(b.sign);
        return a.planet.localeCompare(b.planet);
      });
  }

  setPlanet(planet: PlanetName | 'all'): void {
    this.selectedPlanet = planet;
  }

  setSign(sign: ZodiacSignName | 'all'): void {
    this.selectedSign = sign;
  }

  viewCombination(item: PlanetSignData): void {
    this.router.navigate(['/planet-sign', item.slug]);
  }
}
