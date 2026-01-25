import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  fireflies = [1, 2, 3, 4, 5, 6, 7];

  constructor(private router: Router) {}

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToSignIn(): void {
    // Navigate to sign in - you can implement this later
    console.log('Navigate to sign in');
  }

  startJourney(): void {
    this.router.navigate(['/birth-chart']);
  }

  getPersonalizedReading(): void {
    this.router.navigate(['/birth-chart']);
  }
}
