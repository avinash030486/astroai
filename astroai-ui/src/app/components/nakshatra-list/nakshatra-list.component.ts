import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { NakshatraData, getAllNakshatras } from '../../data/nakshatras';

@Component({
  selector: 'app-nakshatra-list',
  templateUrl: './nakshatra-list.component.html',
  styleUrls: ['./nakshatra-list.component.scss']
})
export class NakshatraListComponent implements OnInit {
  nakshatras: NakshatraData[] = getAllNakshatras();
  selectedGana: 'all' | 'Deva' | 'Manushya' | 'Rakshasa' = 'all';
  selectedPlanet = 'all';

  readonly planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  ganaInfo: Record<string, { emoji: string; desc: string }> = {
    Deva: { emoji: '✨', desc: 'Divine — spiritual, gentle and sattvic nature' },
    Manushya: { emoji: '🧑', desc: 'Human — balanced mix of material and spiritual' },
    Rakshasa: { emoji: '🔥', desc: 'Fierce — intense, determined and transformative' },
  };

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.setMetaTags();
  }

  private setMetaTags(): void {
    this.titleService.setTitle('27 Nakshatras — Vedic Birth Stars & Their Meanings | Vedic Astro');
    this.metaService.updateTag({
      name: 'description',
      content: 'Explore all 27 Nakshatras (Vedic birth stars) — their ruling planets, deities, symbols, qualities, career paths, relationship guidance and spiritual lessons. Find your Moon\'s Nakshatra and understand your deepest nature.',
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: '27 nakshatras, nakshatra meanings, vedic birth star, moon nakshatra, janma nakshatra, ashwini nakshatra, rohini nakshatra, mrigashira, ardra, nakshatras list',
    });
    this.metaService.updateTag({ property: 'og:title', content: '27 Nakshatras — Complete Vedic Birth Star Guide | Vedic Astro' });
    this.metaService.updateTag({ property: 'og:description', content: 'Discover the deep meaning of all 27 Vedic birth stars. Learn your Nakshatra\'s deity, ruling planet, qualities and spiritual purpose.' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://vedicastro.app/nakshatras' });
  }

  get displayed(): NakshatraData[] {
    return this.nakshatras.filter(n => {
      const ganaOk = this.selectedGana === 'all' || n.gana === this.selectedGana;
      const planetOk = this.selectedPlanet === 'all' || n.rulingPlanet === this.selectedPlanet;
      return ganaOk && planetOk;
    });
  }

  view(n: NakshatraData): void {
    this.router.navigate(['/nakshatra', n.slug]);
  }

  setGana(g: 'all' | 'Deva' | 'Manushya' | 'Rakshasa'): void {
    this.selectedGana = g;
    this.selectedPlanet = 'all';
  }

  setPlanet(p: string): void {
    this.selectedPlanet = p;
    this.selectedGana = 'all';
  }
}
