import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { HoroscopeService, PlaceSuggestion, AskQuestionResponse } from '../../services/horoscope.service';
import { SeoFocusService } from '../../services/seo-focus.service';

@Component({
  selector: 'app-soulmate-sketch',
  templateUrl: './soulmate-sketch.component.html',
  styleUrls: ['./soulmate-sketch.component.scss']
})
export class SoulmateSketchComponent implements OnInit, OnDestroy {
  @ViewChild('sketchCard') sketchCard?: ElementRef<HTMLDivElement>;

  // Form fields
  birthDate  = '';
  birthTime  = '';
  birthPlace = '';

  // Autocomplete
  placeSuggestions: PlaceSuggestion[] = [];
  showSuggestions = false;
  private placeInput$ = new Subject<string>();
  private destroy$    = new Subject<void>();

  // State
  loading = false;
  error   = '';
  result: AskQuestionResponse | null = null;

  // Partner traits extracted from AI summary
  partnerTraits: string[] = [];

  // Sharing
  sharing  = false;
  shared   = false;

  constructor(
    private horoscope: HoroscopeService,
    private seo: SeoFocusService
  ) {}

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Soulmate Sketch — AI Vedic Partner Portrait from Your Birth Chart',
      description: 'Discover your destined life partner\'s traits using Vedic astrology. AI analyses your 7th house, Upapada Lagna, and Venus to paint your cosmic soulmate sketch.',
      keywords: 'soulmate astrology, vedic partner prediction, 7th house partner, upapada lagna, soulmate birth chart, vedic marriage prediction, ai astrology partner',
      canonical: '/soulmate-sketch'
    });

    this.placeInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => v.length >= 3),
      switchMap(v => this.horoscope.getPlaceSuggestions(v)),
      takeUntil(this.destroy$)
    ).subscribe({
      next:  s => { this.placeSuggestions = s; this.showSuggestions = s.length > 0; },
      error: () => { this.placeSuggestions = []; this.showSuggestions = false; }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onPlaceInput(val: string): void { this.placeInput$.next(val); }

  onPlaceSelected(s: PlaceSuggestion): void {
    this.birthPlace = s.description;
    this.placeSuggestions = [];
    this.showSuggestions  = false;
  }

  hideSuggestions(): void { setTimeout(() => { this.showSuggestions = false; }, 200); }

  isFormValid(): boolean {
    return !!(this.birthDate && this.birthTime && this.birthPlace.trim());
  }

  generateSketch(): void {
    if (!this.isFormValid()) return;
    this.loading = true;
    this.error   = '';
    this.result  = null;
    this.partnerTraits = [];
    this.shared  = false;

    const parts   = this.birthPlace.split(',').map(p => p.trim());
    const city    = parts[0] || '';
    const state   = parts[1] || '';
    const country = parts[2] || '';
    let   time    = this.birthTime;
    if (/^\d{2}:\d{2}$/.test(time)) time += ':00';

    const question = `Based on my Vedic birth chart, describe my destined life partner. ` +
      `Analyse my 7th house sign and its lord, 7th house occupants, Upapada Lagna, Venus placement, ` +
      `and Darakaraka planet. Paint a detailed picture of my soulmate's: ` +
      `(1) personality and character traits, (2) physical appearance and style, ` +
      `(3) profession or life path, (4) emotional nature and communication style, ` +
      `(5) the type of relationship we will share. ` +
      `Be specific, poetic, and optimistic. Format as a flowing narrative, not a list.`;

    this.horoscope.askQuestion({
      city, state, country,
      birthDate: this.birthDate,
      birthTime: time,
      question
    }).subscribe({
      next: res => {
        this.result = res;
        this.extractTraits(res.answer);
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Could not generate your soulmate sketch. Please check your birth details and try again.';
        this.loading = false;
      }
    });
  }

  private extractTraits(answer: string): void {
    // Extract key trait keywords to show as "essence tags"
    const keywords = [
      'intelligent','creative','nurturing','ambitious','compassionate','artistic',
      'spiritual','adventurous','grounded','charismatic','empathetic','loyal',
      'independent','playful','wise','sensitive','passionate','disciplined',
      'intuitive','expressive','calm','strong','gentle','magnetic','mysterious'
    ];
    const lower = answer.toLowerCase();
    this.partnerTraits = keywords.filter(k => lower.includes(k)).slice(0, 8);
  }

  async downloadSketch(): Promise<void> {
    if (!this.sketchCard) return;
    this.sharing = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(this.sketchCard.nativeElement, {
        backgroundColor: '#0e0820',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link    = document.createElement('a');
      link.download = `soulmate-sketch-${new Date().toISOString().slice(0,10)}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
      this.shared = true;
    } catch (e) { console.error(e); }
    this.sharing = false;
  }

  reset(): void {
    this.result = null;
    this.error  = '';
    this.shared = false;
  }
}
