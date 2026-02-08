import { Component, OnInit } from '@angular/core';
import { HoroscopeService, NumerologyDetailsResponse } from 'src/app/services/horoscope.service';

@Component({
  selector: 'app-numerology',
  templateUrl: './numerology.component.html',
  styleUrls: ['./numerology.component.scss']
})
export class NumerologyComponent implements OnInit {
  birthDate: string = '';
  loading: boolean = false;
  showResults: boolean = false;
  error: string = '';
  
  // Results
  numerologyData: NumerologyDetailsResponse | null = null;

  // Animation states
  showLifePath: boolean = false;
  showDestiny: boolean = false;
  showSoulUrge: boolean = false;
  showLuckyNumbers: boolean = false;
  showCareer: boolean = false;
  showLove: boolean = false;
  showMoney: boolean = false;
  showRemedies: boolean = false;

  constructor(private horoscopeService: HoroscopeService) { }

  ngOnInit(): void {
    // Set max date to today
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('birthDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.setAttribute('max', maxDate);
    }
  }

  onSubmit(): void {
    if (!this.birthDate) {
      this.error = 'Please select your birth date';
      return;
    }

    this.loading = true;
    this.error = '';
    this.showResults = false;
    this.resetAnimations();

    this.horoscopeService.getNumerologyDetails({ birthDate: this.birthDate })
      .subscribe({
        next: (response) => {
          this.numerologyData = response;
          this.loading = false;
          this.showResults = true;
          this.triggerAnimations();
        },
        error: (err) => {
          console.error('Numerology API error:', err);
          this.error = 'Failed to fetch numerology details. Please try again.';
          this.loading = false;
        }
      });
  }

  resetAnimations(): void {
    this.showLifePath = false;
    this.showDestiny = false;
    this.showSoulUrge = false;
    this.showLuckyNumbers = false;
    this.showCareer = false;
    this.showLove = false;
    this.showMoney = false;
    this.showRemedies = false;
  }

  triggerAnimations(): void {
    // Stagger animations for a dramatic reveal effect
    setTimeout(() => this.showLifePath = true, 200);
    setTimeout(() => this.showDestiny = true, 400);
    setTimeout(() => this.showSoulUrge = true, 600);
    setTimeout(() => this.showLuckyNumbers = true, 800);
    setTimeout(() => this.showCareer = true, 1000);
    setTimeout(() => this.showLove = true, 1200);
    setTimeout(() => this.showMoney = true, 1400);
    setTimeout(() => this.showRemedies = true, 1600);
  }

  getNumberColor(number: number): string {
    const colors: { [key: number]: string } = {
      1: '#FF6B6B',  // Red
      2: '#4ECDC4',  // Teal
      3: '#FFE66D',  // Yellow
      4: '#95E1D3',  // Mint
      5: '#F38181',  // Coral
      6: '#AA96DA',  // Purple
      7: '#FCBAD3',  // Pink
      8: '#A8D8EA',  // Sky Blue
      9: '#FFAAA5',  // Peach
      11: '#C7CEEA', // Light Purple (Master)
      22: '#FFDAB9', // Golden (Master)
      33: '#B5EAD7'  // Sage (Master)
    };
    return colors[number] || '#6C757D';
  }

  isMasterNumber(number: number): boolean {
    return number === 11 || number === 22 || number === 33;
  }

  reset(): void {
    this.birthDate = '';
    this.showResults = false;
    this.numerologyData = null;
    this.error = '';
    this.resetAnimations();
  }
}
