import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DEBILITATED_PLANET_DATA, DebilitatedPlanetData } from '../../data/debilitated-planets';

@Component({
  selector: 'app-debilitated-planet-list',
  templateUrl: './debilitated-planet-list.component.html',
  styleUrls: ['./debilitated-planet-list.component.scss']
})
export class DebilitatedPlanetListComponent implements OnInit {
  planets: DebilitatedPlanetData[] = DEBILITATED_PLANET_DATA;

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Debilitated Planets in Vedic Astrology — Neecha Graha Effects & Neechabhanga Remedies');
    this.metaService.updateTag({
      name: 'description',
      content: 'Explore all 9 debilitated (Neecha) planets in Vedic astrology. Sun in Libra, Moon in Scorpio, Jupiter in Capricorn, Mars in Cancer, Venus in Virgo, Mercury in Pisces, Saturn in Aries — learn how Neechabhanga yoga cancels debilitation for extraordinary results.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'debilitated planets vedic astrology, neecha graha, neechabhanga yoga, debilitated sun libra, debilitated moon scorpio, debilitated jupiter capricorn, debilitated mars cancer, debilitated venus virgo, debilitated mercury pisces, debilitated saturn aries, cancellation of debilitation'
    });
    this.metaService.updateTag({ property: 'og:title', content: 'Debilitated Planets in Vedic Astrology — All 9 Neecha Grahas' });
    this.metaService.updateTag({
      property: 'og:description',
      content: 'Explore all 9 debilitated planets and learn how Neechabhanga yoga can transform their challenges into extraordinary strengths.'
    });
  }

  navigateToPlanet(slug: string): void {
    this.router.navigate(['/debilitated-planet', slug]);
  }
}
