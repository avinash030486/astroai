import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getCitiesByCountry, CityData } from '../../data/cities';

@Component({
  selector: 'app-city-panchang-list',
  templateUrl: './city-panchang-list.component.html',
  styleUrls: ['./city-panchang-list.component.scss']
})
export class CityPanchangListComponent implements OnInit {
  indianCities: CityData[] = [];
  americanCities: CityData[] = [];
  searchQuery = '';
  filteredIndianCities: CityData[] = [];
  filteredAmericanCities: CityData[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.indianCities = getCitiesByCountry('India');
    this.americanCities = getCitiesByCountry('USA');
    this.filteredIndianCities = this.indianCities;
    this.filteredAmericanCities = this.americanCities;
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.filteredIndianCities = this.indianCities;
      this.filteredAmericanCities = this.americanCities;
      return;
    }

    this.filteredIndianCities = this.indianCities.filter(city =>
      city.city.toLowerCase().includes(query) ||
      city.state.toLowerCase().includes(query)
    );

    this.filteredAmericanCities = this.americanCities.filter(city =>
      city.city.toLowerCase().includes(query) ||
      city.state.toLowerCase().includes(query)
    );
  }

  navigateToCity(city: CityData, date: string = 'today'): void {
    this.router.navigate(['/panchang', city.slug, date]);
  }
}
