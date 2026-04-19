import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { GuideData, getGuideBySlug, getRelatedGuides } from '../../data/guides';

@Component({
  selector: 'app-guide-detail',
  templateUrl: './guide-detail.component.html',
  styleUrls: ['./guide-detail.component.scss'],
})
export class GuideDetailComponent implements OnInit {
  guide: GuideData | undefined;
  relatedGuides: GuideData[] = [];
  loading = true;
  notFound = false;
  openFaqIndex: number | null = null;

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
    this.openFaqIndex = null;
    this.guide = getGuideBySlug(slug);
    if (this.guide) {
      this.relatedGuides = getRelatedGuides(this.guide.relatedGuides);
      this.setMetaTags();
      this.loading = false;
    } else {
      this.notFound = true;
      this.loading = false;
    }
  }

  private setMetaTags(): void {
    if (!this.guide) return;
    const g = this.guide;
    this.titleService.setTitle(g.title + ' | Vedic Astro');
    this.metaService.updateTag({ name: 'description', content: g.metaDescription });
    this.metaService.updateTag({ name: 'keywords', content: g.keywords.join(', ') });
    this.metaService.updateTag({ property: 'og:title', content: g.title });
    this.metaService.updateTag({ property: 'og:description', content: g.metaDescription });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/guide/${g.slug}` });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  isFaqOpen(index: number): boolean {
    return this.openFaqIndex === index;
  }

  getCategoryLabel(): string {
    const labels: Record<string, string> = {
      mahadasha: 'Mahadasha Guide',
      transit: 'Transit Guide',
      dosha: 'Dosha Guide',
      fundamentals: 'Vedic Fundamentals',
    };
    return labels[this.guide?.category ?? ''] ?? 'Vedic Guide';
  }

  goToAstrologer(): void {
    this.router.navigate(['/astrologer']);
  }

  goToBirthChart(): void {
    this.router.navigate(['/birth-chart']);
  }

  goToGuide(slug: string): void {
    this.router.navigate(['/guide', slug]);
  }

  goBack(): void {
    this.router.navigate(['/guides']);
  }
}
