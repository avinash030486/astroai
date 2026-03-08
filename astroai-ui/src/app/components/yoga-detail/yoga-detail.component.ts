import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getYogaBySlug, YogaData } from '../../data/yogas';

@Component({
  selector: 'app-yoga-detail',
  templateUrl: './yoga-detail.component.html',
  styleUrls: ['./yoga-detail.component.scss']
})
export class YogaDetailComponent implements OnInit {
  yoga: YogaData | undefined;
  loading: boolean = true;
  notFound: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadYoga(slug);
    });
  }

  private loadYoga(slug: string): void {
    this.yoga = getYogaBySlug(slug);
    
    if (this.yoga) {
      this.setMetaTags();
      this.loading = false;
    } else {
      this.notFound = true;
      this.loading = false;
    }
  }

  private setMetaTags(): void {
    if (!this.yoga) return;

    const title = `${this.yoga.name} - ${this.yoga.category === 'beneficial' ? 'Beneficial' : 'Malefic'} Yoga in Vedic Astrology | Vedic Astro`;
    this.titleService.setTitle(title);

    const description = `${this.yoga.shortDescription} Learn about planetary combinations, effects, ${this.yoga.category === 'malefic' ? 'powerful remedies, ' : ''}and detailed analysis of ${this.yoga.name} in Vedic astrology.`;
    
    this.metaService.updateTag({ name: 'description', content: description });
    
    const keywords = this.yoga.keywords ? this.yoga.keywords.join(', ') : `${this.yoga.name}, ${this.yoga.slug}, vedic astrology yoga, planetary combinations`;
    this.metaService.updateTag({ name: 'keywords', content: keywords });

    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: `https://vedicastro.app/yoga/${this.yoga.slug}` });
  }

  goBack(): void {
    this.router.navigate(['/yogas']);
  }

  shareYoga(): void {
    if (navigator.share && this.yoga) {
      navigator.share({
        title: this.yoga.name,
        text: this.yoga.shortDescription,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    }
  }
}
