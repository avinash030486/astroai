import { Component } from '@angular/core';
import { RemediesService, PersonalizedRemediesRequest, PersonalizedRemediesResponse } from '../../services/remedies.service';

@Component({
  selector: 'app-remedies',
  templateUrl: './remedies.component.html',
  styleUrls: ['./remedies.component.scss']
})
export class RemediesComponent {
  birthDetails = {
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  };

  availableConcerns = [
    'Career',
    'Health',
    'Finance',
    'Love & Relationships',
    'Spiritual Growth',
    'Family',
    'Education',
    'Mental Peace'
  ];

  selectedConcerns: { [key: string]: boolean } = {};

  loading = false;
  error = '';
  result: PersonalizedRemediesResponse | null = null;
  activeTab: string = 'mantras';

  constructor(private remediesService: RemediesService) {}

  onGetRemedies(): void {
    if (!this.validateInputs()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;

    const concerns = Object.keys(this.selectedConcerns).filter(key => this.selectedConcerns[key]);

    const place = this.parsePlace(this.birthDetails.birthPlace);
    const request: PersonalizedRemediesRequest = {
      birthDate: this.birthDetails.birthDate,
      birthTime: this.birthDetails.birthTime + ':00',
      city: place.city,
      state: place.state,
      country: place.country,
      areasOfConcern: concerns
    };

    this.remediesService.getPersonalizedRemedies(request).subscribe({
      next: (response) => {
        this.result = response;
        this.loading = false;
        this.setDefaultTab();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to get personalized remedies. Please try again.';
        this.loading = false;
      }
    });
  }

  validateInputs(): boolean {
    if (!this.birthDetails.name || !this.birthDetails.birthDate || !this.birthDetails.birthTime || !this.birthDetails.birthPlace) {
      this.error = 'Please fill in all birth details';
      return false;
    }

    const selected = Object.keys(this.selectedConcerns).filter(key => this.selectedConcerns[key]);
    if (selected.length === 0) {
      this.error = 'Please select at least one area of concern';
      return false;
    }

    return true;
  }

  parsePlace(place: string): { city: string; state: string; country: string } {
    const parts = place.split(',').map(p => p.trim());
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[2] || ''
    };
  }

  setDefaultTab(): void {
    if (this.result) {
      if (this.result.mantras.length > 0) this.activeTab = 'mantras';
      else if (this.result.gemstones.length > 0) this.activeTab = 'gemstones';
      else if (this.result.fastingDays.length > 0) this.activeTab = 'fasting';
      else if (this.result.rituals.length > 0) this.activeTab = 'rituals';
      else if (this.result.donations.length > 0) this.activeTab = 'donations';
      else if (this.result.lifestyleAdjustments.length > 0) this.activeTab = 'lifestyle';
    }
  }

  getEffectivenessColor(score: number): string {
    if (score >= 8) return '#28a745';
    if (score >= 5) return '#ffc107';
    return '#dc3545';
  }

  reset(): void {
    this.result = null;
    this.error = '';
  }
}
