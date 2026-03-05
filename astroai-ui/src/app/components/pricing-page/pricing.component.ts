import { Component, OnInit, AfterViewInit, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

interface StarStyle { style: string; }
interface FaqItem { question: string; answer: string; open: boolean; }

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PricingComponent implements OnInit, AfterViewInit, OnDestroy {

  stars: StarStyle[] = [];
  private observer!: IntersectionObserver;

  faqItems: FaqItem[] = [
    {
      question: 'What does the birth chart cover?',
      answer: `Your Vedic birth chart analysis is a comprehensive, personalized reading covering the key areas of your life:
        <ul>
          <li>Career, finance, relationships & life direction</li>
          <li>Strengths & challenges revealed in your horoscope</li>
          <li>Beneficial yogas and challenging yogas</li>
          <li>Personalized remedial suggestions — mantras, practices & timing</li>
        </ul>`,
      open: true
    },
    {
      question: 'What planetary details are explained?',
      answer: `The analysis provides a detailed explanation of the cosmic forces at work in your chart:
        <ul>
          <li>Ascendant & ruling planets</li>
          <li>Current Mahadasha & Antardasha periods</li>
          <li>Key planetary influences shaping your current phase of life</li>
          <li>Gemstones to focus on for enhancement</li>
          <li>Key Muhurats to keep in mind when planning your life events</li>
        </ul>`,
      open: false
    },
    {
      question: 'What is Mahadasha & Antardasha?',
      answer: `In Vedic astrology, the <strong>Mahadasha</strong> is a major planetary period that governs a significant phase of your life — typically lasting between 6 and 20 years depending on the planet. The <strong>Antardasha</strong> is a sub-period within the Mahadasha that adds more specific influence and nuance to the themes you'll experience. Understanding your current Dasha can help you align your decisions with cosmic timing.`,
      open: false
    },
    {
      question: 'What are Yogas in Vedic astrology?',
      answer: `Yogas are special planetary combinations in your birth chart that indicate distinctive qualities, talents, or challenges. <strong>Beneficial yogas</strong> like Raj Yoga or Dhana Yoga can indicate prosperity, leadership ability, and spiritual gifts. <strong>Challenging yogas</strong> highlight areas needing attention or remediation. Identifying these gives you powerful self-knowledge and actionable guidance.`,
      open: false
    },
    {
      question: 'What are remedial suggestions?',
      answer: `Vedic astrology offers a rich tradition of remedies to balance planetary energies in your chart. These are personalized to your specific chart and may include:
        <ul>
          <li>Mantras — specific Sanskrit chants to strengthen or pacify planetary energies</li>
          <li>Practices — rituals, charity, fasting, or specific lifestyle adjustments</li>
          <li>Timing — auspicious moments (Muhurats) to initiate important decisions or events</li>
          <li>Gemstones — specific stones that resonate with your planetary lords</li>
        </ul>`,
      open: false
    }
  ];

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    for (let i = 0; i < 42; i++) {
      const sz = (Math.random() * 2.2 + 0.8).toFixed(1);
      this.stars.push({
        style: `width:${sz}px;height:${sz}px;left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--dur:${(Math.random()*3+2).toFixed(1)}s;--delay:${(Math.random()*5).toFixed(1)}s;`
      });
    }
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.renderer.addClass(e.target, 'visible');
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
  }

  toggleFaq(index: number): void {
    const wasOpen = this.faqItems[index].open;
    this.faqItems.forEach(item => item.open = false);
    if (!wasOpen) this.faqItems[index].open = true;
  }

  getStarted(): void {
    this.router.navigate(['/get-reading']);
  }
}