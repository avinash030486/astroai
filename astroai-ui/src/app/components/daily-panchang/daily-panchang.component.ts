import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PredictionsService, DailyPanchangResponse } from '../../services/predictions.service';
import { HttpClient } from '@angular/common/http';
import { SeoFocusService } from '../../services/seo-focus.service';

@Component({
  selector: 'app-daily-panchang',
  templateUrl: './daily-panchang.component.html',
  styleUrls: ['./daily-panchang.component.scss']
})
export class DailyPanchangComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error?: string;
  result?: DailyPanchangResponse;
  statusMsg = '';
  placeName?: string;

  constructor(
    private fb: FormBuilder,
    private svc: PredictionsService,
    private http: HttpClient,
    private seoFocus: SeoFocusService
  ) {
    this.form = this.fb.group({
      location: [''],
      date: ['']
    });
  }

  ngOnInit(): void {
    // Set document title and description for this view
    this.seoFocus.setTitle('Daily Panchang - AstroAI Vedic Calendar');
    this.seoFocus.setDescription('Get today\'s tithi, nakshatra, yogas and auspicious periods for your location with the AstroAI Daily Panchang.');

    // Auto-fetch on page load using browser location when available
    this.getBrowserLocation(true);
  }

  getBrowserLocation(autoFetch: boolean = false): void {
    this.statusMsg = 'Attempting to fetch your location…';
    if (!('geolocation' in navigator)) {
      this.statusMsg = '';
      this.error = 'Geolocation is not supported by your browser. You can type a place manually.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        console.log("Got position:", pos);
        const { latitude, longitude } = pos.coords;
        const loc = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        this.form.patchValue({ location: loc });
        this.statusMsg = 'Location detected. You can edit if needed.';
        this.reverseGeocode(latitude, longitude);
        if (autoFetch) {
          this.fetch();
        }
      },
      err => {
        this.statusMsg = '';
        this.error = 'We could not access your location. You can enter a city or place manually.';
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  fetch(): void {
    this.error = undefined;
    this.result = undefined;
    const location: string = this.form.value.location?.trim();
    const dateStr: string | undefined = this.form.value.date || undefined;
    if (!location) {
      this.error = 'Please provide a location.';
      return;
    }
    this.loading = true;
    this.statusMsg = 'Fetching daily panchang…';
    this.svc.getDailyPanchang(location, dateStr).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
        this.statusMsg = 'Panchang loaded successfully.';
        // Use server-resolved place name when available
        this.placeName = res?.coordinates?.resolvedLocation || this.placeName;
      },
      error: (e) => {
        this.error = e?.message || 'Failed to fetch panchang.';
        this.loading = false;
        this.statusMsg = '';
      }
    });
  }

  // Try to resolve a human-friendly place name from coordinates
  private reverseGeocode(lat: number, lon: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`;
    this.http.get<any>(url, { headers: { 'Accept-Language': 'en' } }).subscribe({
      next: (data) => {
        
        const display = data?.display_name as string | undefined;
        if (display) {
          this.placeName = display;
        }
      },
      error: () => {
        // Fail silently; we will still show lat/lon and server-resolved name after fetch
      }
    });
  }

  // Allow user-entered lat,lon to be resolved on blur
  onLocationBlur(): void {
    const val: string = this.form.value.location || '';
    const match = val.match(/\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        this.reverseGeocode(lat, lon);
      }
    }
  }
}
