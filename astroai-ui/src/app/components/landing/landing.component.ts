import { Component, OnInit, AfterViewInit, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

interface StarStyle { style: string; }
interface FaqItem { question: string; answer: string; open: boolean; }

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  encapsulation: ViewEncapsulation.None   // ← lets our CSS override Bootstrap globally
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  stars: StarStyle[] = [];
  private observer!: IntersectionObserver;

  faqItems: FaqItem[] = [
    {
      question: 'What is Vedic astrology and how is it different from Western astrology?',
      answer: `Vedic astrology (Jyotish) uses the <strong>sidereal zodiac</strong> — aligned with the actual positions of constellations — while Western astrology uses the tropical zodiac, which has drifted roughly 23 degrees from the sky. Vedic astrology also relies heavily on the <strong>27 Nakshatras</strong> (lunar mansions), the <strong>Dasha system</strong> of planetary periods, and a comprehensive system of Yogas (planetary combinations) to make predictions far more specific and time-sensitive.`,
      open: true
    },
    {
      question: 'What is a Mahadasha and why does it matter?',
      answer: `A <strong>Mahadasha</strong> is a major planetary period in Vedic astrology — each planet governs a phase of your life lasting between 6 and 20 years. Within each Mahadasha are <strong>Antardashas</strong> (sub-periods) that add nuance and timing to events. Knowing your current Mahadasha and Antardasha is essential for understanding why certain themes are prominent in your life right now.`,
      open: false
    },
    {
      question: 'What does the free plan actually include?',
      answer: `The free plan gives you access to your daily horoscope, the full Panchang (Tithi, Nakshatra, Yoga, Karana, Vara), Yoga updates, a one-time short Vedic astrology prediction, and <strong>5 questions to Vedic Astro per week</strong> that reset automatically. You also get weekly email updates covering your horoscope, Panchang, and Yogas. It's genuinely useful — not a locked demo.`,
      open: false
    },
    {
      question: 'What is the Panchang and why should I check it daily?',
      answer: `The Panchang is the Vedic almanac — it tracks five key elements of each day: <strong>Tithi</strong> (lunar day), <strong>Nakshatra</strong> (lunar mansion), <strong>Yoga</strong> (a combined sun-moon calculation), <strong>Karana</strong> (half-day division), and <strong>Vara</strong> (weekday ruler). Checking the Panchang helps you understand the cosmic quality of each day — what activities are favored, which auspicious windows exist, and what to avoid.`,
      open: false
    },
    {
      question: 'What are Yogas in a birth chart?',
      answer: `Yogas are special combinations of planets in your birth chart that indicate particular strengths, opportunities, or challenges. <strong>Raj Yoga</strong> signals leadership and authority. <strong>Dhana Yoga</strong> points to financial potential. Your birth chart may contain several Yogas — both beneficial and challenging — that shape your life's themes in profound ways.`,
      open: false
    },
    {
      question: 'What is a Muhurat and how do I use one?',
      answer: `A <strong>Muhurat</strong> is an auspicious time window calculated from the planetary positions on a given day. Initiating important activities — signing contracts, starting a new venture, getting married, beginning travel — during a favorable Muhurat is believed to align the endeavor with positive cosmic energy. VedicAstro surfaces relevant Muhurats daily so you can plan with precision.`,
      open: false
    },
    {
      question: 'Can I cancel my Rhythm subscription at any time?',
      answer: `Yes — the Rhythm plan ($2.99/week) can be cancelled at any time with no penalty. You'll retain access until the end of your current billing period. The Pay As You Go options are one-time purchases with no subscription. And the free plan is always there for you, with no expiry.`,
      open: false
    }
  ];

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Generate stars
    for (let i = 0; i < 50; i++) {
      const sz = (Math.random() * 2 + 0.7).toFixed(1);
      this.stars.push({
        style: `width:${sz}px;height:${sz}px;left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--dur:${(Math.random() * 3 + 2).toFixed(1)}s;--delay:${(Math.random() * 6).toFixed(1)}s;`
      });
    }
  }

  ngAfterViewInit(): void {
    // Scroll reveal
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.renderer.addClass(e.target, 'visible');
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => this.observer.observe(el));
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
  }

  toggleFaq(index: number): void {
    const wasOpen = this.faqItems[index].open;
    this.faqItems.forEach(item => item.open = false);
    if (!wasOpen) this.faqItems[index].open = true;
  }

  startJourney(): void {
    this.router.navigate(['/birth-chart']);
  }

  exploreFree(): void {
    this.router.navigate(['/birth-chart']);
  }

  getPersonalizedReading(): void {
    this.router.navigate(['/birth-chart']);
  }
  goToPricing(): void {
  this.router.navigate(['/pricing']);
}
}