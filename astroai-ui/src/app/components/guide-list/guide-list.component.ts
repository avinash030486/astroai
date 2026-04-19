import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { GUIDES, GuideData } from '../../data/guides';

@Component({
  selector: 'app-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.scss'],
})
export class GuideListComponent implements OnInit {
  allGuides: GuideData[] = GUIDES;
  activeCategory = 'all';

  categories = [
    { key: 'all', label: 'All Guides' },
    { key: 'mahadasha', label: 'Mahadasha' },
    { key: 'transit', label: 'Transits' },
    { key: 'dosha', label: 'Doshas' },
    { key: 'fundamentals', label: 'Fundamentals' },
  ];

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Vedic Astrology Guides: Mahadasha, Sade Sati, Doshas & More | Vedic Astro');
    this.metaService.updateTag({
      name: 'description',
      content:
        'In-depth Vedic astrology guides — Rahu Mahadasha, Sade Sati, Manglik Dosha, how to read your kundli and more. Free expert articles from Vedic Astro.',
    });
  }

  get filteredGuides(): GuideData[] {
    if (this.activeCategory === 'all') return this.allGuides;
    return this.allGuides.filter(g => g.category === this.activeCategory);
  }

  setCategory(key: string): void {
    this.activeCategory = key;
  }

  openGuide(slug: string): void {
    this.router.navigate(['/guide', slug]);
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }

  getCategoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      mahadasha: 'Mahadasha',
      transit: 'Transit',
      dosha: 'Dosha',
      fundamentals: 'Fundamentals',
    };
    return labels[cat] ?? cat;
  }
}
