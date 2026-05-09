import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { EXALTED_PLANET_DATA, ExaltedPlanetData } from '../../data/exalted-planets';

@Component({
  selector: 'app-exalted-planet-list',
  templateUrl: './exalted-planet-list.component.html',
  styleUrls: ['./exalted-planet-list.component.scss']
})
export class ExaltedPlanetListComponent implements OnInit {
  planets: ExaltedPlanetData[] = EXALTED_PLANET_DATA;

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Exalted Planets in Vedic Astrology — All 9 Uccha Grahas');
    this.metaService.updateTag({
      name: 'description',
      content: 'Discover the effects of all 9 exalted planets in Vedic astrology. Sun in Aries, Moon in Taurus, Jupiter in Cancer, Venus in Pisces, Mars in Capricorn, Mercury in Virgo, Saturn in Libra, Rahu in Gemini and Ketu in Sagittarius — explore their exceptional gifts, career blessings and spiritual significance.'
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: 'exalted planets vedic astrology, uccha graha, exalted sun aries, exalted moon taurus, exalted jupiter cancer, exalted venus pisces, exalted mars capricorn, exalted saturn libra, exalted mercury virgo, exalted rahu gemini, exalted ketu sagittarius'
    });
    this.metaService.updateTag({ property: 'og:title', content: 'Exalted Planets in Vedic Astrology — All 9 Uccha Grahas' });
    this.metaService.updateTag({
      property: 'og:description',
      content: 'Explore the powerful effects of all 9 exalted planets across every house in your Vedic birth chart. Uccha Graha — maximum strength, maximum blessings.'
    });
  }

  navigateToPlanet(slug: string): void {
    this.router.navigate(['/exalted-planet', slug]);
  }
}
