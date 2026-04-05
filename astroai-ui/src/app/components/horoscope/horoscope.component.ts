import { Component, OnInit } from '@angular/core';
import { SeoFocusService } from '../../services/seo-focus.service';

@Component({
  selector: 'app-horoscope',
  templateUrl: './horoscope.component.html',
  styleUrls: ['./horoscope.component.scss']
})
export class HoroscopeComponent implements OnInit {
  constructor(private seo: SeoFocusService) {}

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Free Vedic Horoscope — Personalised Jyotish Predictions',
      description: 'Get your free personalised Vedic horoscope. AI-powered Jyotish predictions based on your birth details — planets, houses, Dasha & transits.',
      keywords: 'vedic horoscope, free horoscope, jyotish predictions, personalised astrology, vedic astrology reading, ai astrology',
      canonical: '/horoscope'
    });
  }
}
