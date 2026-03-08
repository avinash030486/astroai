import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { VEDIC_YOGAS, YogaData, getBeneficialYogas, getMaleficYogas } from '../../data/yogas';

@Component({
  selector: 'app-yoga-list',
  templateUrl: './yoga-list.component.html',
  styleUrls: ['./yoga-list.component.scss']
})
export class YogaListComponent implements OnInit {
  allYogas: YogaData[] = VEDIC_YOGAS;
  beneficialYogas: YogaData[] = getBeneficialYogas();
  maleficYogas: YogaData[] = getMaleficYogas();
  selectedCategory: 'all' | 'beneficial' | 'malefic' = 'all';

  constructor(
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.setMetaTags();
  }

  private setMetaTags(): void {
    this.titleService.setTitle('Vedic Astrology Yogas - Complete Guide to Auspicious & Malefic Combinations | Vedic Astro');
    
    this.metaService.updateTag({
      name: 'description',
      content: 'Comprehensive guide to 20+ Vedic astrology yogas including Pancha Mahapurusha Yogas (Hamsa, Malavya, Ruchaka, Bhadra, Sasha), beneficial yogas (Amala, Vimala, Gajakesari, Adhi), and malefic yogas (Kala Sarpa, Manglik Dosha, Kemadruma, Daridra). Learn planetary combinations, effects, and powerful remedies for each yoga.'
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'vedic astrology yogas, pancha mahapurusha yoga, hamsa yoga, malavya yoga, ruchaka yoga, bhadra yoga, sasha yoga, amala yoga, gajakesari yoga, kala sarpa dosha, manglik dosha, kemadruma yoga, daridra yoga, grahan yoga, vish yoga, astrological combinations, planetary yogas, yoga remedies, benefic yogas, malefic yogas'
    });

    this.metaService.updateTag({ property: 'og:title', content: 'Vedic Astrology Yogas - Complete Guide | Vedic Astro' });
    this.metaService.updateTag({ property: 'og:description', content: 'Explore 20+ major Vedic astrology yogas with detailed planetary combinations, effects, and remedies. From auspicious Pancha Mahapurusha Yogas to challenging malefic combinations.' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://vedicastro.app/yogas' });
  }

  get displayedYogas(): YogaData[] {
    switch (this.selectedCategory) {
      case 'beneficial':
        return this.beneficialYogas;
      case 'malefic':
        return this.maleficYogas;
      default:
        return this.allYogas;
    }
  }

  viewYoga(yoga: YogaData): void {
    this.router.navigate(['/yoga', yoga.slug]);
  }

  setCategory(category: 'all' | 'beneficial' | 'malefic'): void {
    this.selectedCategory = category;
  }
}
