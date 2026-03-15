import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

interface StarStyle { style: string; }

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PrivacyComponent implements OnInit, AfterViewInit {
  stars: StarStyle[] = [];
  mobileTocOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    for (let i = 0; i < 40; i++) {
      const sz = (Math.random() * 2 + 0.6).toFixed(1);
      this.stars.push({
        style: `width:${sz}px;height:${sz}px;left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--dur:${(Math.random()*3+2).toFixed(1)}s;--delay:${(Math.random()*5).toFixed(1)}s;`
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 0);
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    this.mobileTocOpen = false;
  }

  goHome(): void { this.router.navigate(['/']); }
  goPricing(): void { this.router.navigate(['/pricing']); }
  goToTerms(): void { this.router.navigate(['/terms']); }
}

