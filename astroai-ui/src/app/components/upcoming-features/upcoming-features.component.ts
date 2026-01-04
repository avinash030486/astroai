import { Component } from '@angular/core';

interface Feature {
  icon: string;
  title: string;
  blurb: string;
  tag?: string;
}

@Component({
  selector: 'app-upcoming-features',
  templateUrl: './upcoming-features.component.html',
  styleUrls: ['./upcoming-features.component.scss']
})
export class UpcomingFeaturesComponent {
  features: Feature[] = [
    {
      icon: '💜',
      title: 'AI Match Making',
      blurb: 'Smart Vedic compatibility with synastry insights, match scores, and clear guidance for next steps.',
      tag: 'New'
    },
    {
      icon: '🔢',
      title: 'AI-Based Numerology',
      blurb: 'Personal numbers mapped to life themes, cycles, and practical timing windows you can act on.'
    },
    {
      icon: '📅',
      title: 'Yearly Horoscopes',
      blurb: 'Big‑picture outlook for career, money, love, and health with month‑by‑month highlights and PDF export.'
    },
    {
      icon: '🪷',
      title: 'Remedies & Guidance',
      blurb: 'Gentle, actionable recommendations—mantras, rituals, gemstones, fasting—tailored to your chart.'
    }
  ];
}
