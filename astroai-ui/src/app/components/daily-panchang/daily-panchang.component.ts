import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PredictionsService, DailyPanchangResponse } from '../../services/predictions.service';
import { HttpClient } from '@angular/common/http';
import { SeoFocusService } from '../../services/seo-focus.service';

@Component({
  selector: 'app-daily-panchang',
  templateUrl: './daily-panchang.component.html',
  styleUrls: ['./daily-panchang.component.scss']
})
export class DailyPanchangComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  error?: string;
  result?: DailyPanchangResponse;
  statusMsg = '';
  placeName?: string;
  private locationAttempted = false;
  private geolocationTimeout: any;

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

  ngOnDestroy(): void {
    if (this.geolocationTimeout) {
      clearTimeout(this.geolocationTimeout);
    }
  }

  getBrowserLocation(autoFetch: boolean = false): void {
    if (this.locationAttempted) {
      return; // Prevent multiple attempts
    }
    this.locationAttempted = true;
    this.statusMsg = 'Attempting to fetch your location…';
    
    if (!('geolocation' in navigator)) {
      this.statusMsg = '';
      this.error = 'Geolocation is not supported by your browser. You can type a place manually.';
      // Still try to fetch with default location
      if (autoFetch) {
        this.fetchWithDefaultLocation();
      }
      return;
    }
    
    // Set a timeout for geolocation to prevent hanging
    this.geolocationTimeout = setTimeout(() => {
      console.log('⏰ Geolocation timeout, using default location');
      this.statusMsg = 'Location detection timeout. Using Delhi, India.';
      if (autoFetch) {
        this.fetchWithDefaultLocation();
      }
    }, 5000); // 5 seconds max
    
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(this.geolocationTimeout);
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
        clearTimeout(this.geolocationTimeout);
        console.error('Geolocation error:', err);
        this.statusMsg = 'Could not access location. Using default location (Delhi, India).';
        // Fallback: Use default location for India if geolocation fails
        if (autoFetch) {
          this.fetchWithDefaultLocation();
        }
      },
      { 
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 4000, // Reduced timeout from 5s to 4s
        maximumAge: 300000 // Allow cached location up to 5 minutes old
      }
    );
  }

  private fetchWithDefaultLocation(): void {
    // Default to Delhi, India coordinates if geolocation fails
    const defaultLat = 28.6139;
    const defaultLon = 77.2090;
    const loc = `${defaultLat.toFixed(5)}, ${defaultLon.toFixed(5)}`;
    this.form.patchValue({ location: loc });
    this.placeName = 'New Delhi, India (default)';
    this.fetch();
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
    
    const startTime = Date.now();
    
    this.svc.getDailyPanchang(location, dateStr).subscribe({
      next: (res) => {
        const duration = Date.now() - startTime;
        console.log(`✅ Panchang received in ${duration}ms`);
        
        this.result = res;
        this.loading = false;
        this.statusMsg = `Panchang loaded successfully (${duration}ms).`;
        // Use server-resolved place name when available
        this.placeName = res?.coordinates?.resolvedLocation || this.placeName;
      },
      error: (e) => {
        const duration = Date.now() - startTime;
        console.error(`❌ Panchang fetch error after ${duration}ms:`, e);
        this.error = e?.error?.message || e?.message || 'Failed to fetch panchang.';
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
      error: (err) => {
        console.error('Reverse geocoding error:', err);
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

  getDisplayDate(): Date {
    if (!this.result?.dateUtc) {
      return new Date();
    }
    // The server returns a UTC date string (e.g., "2026-01-25T00:00:00Z")
    // We need to display it in the user's local timezone
    const utcDate = new Date(this.result.dateUtc);
    
    // Create a new date in local timezone with the same calendar date
    // This ensures January 25 UTC shows as January 25 in local time
    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth();
    const day = utcDate.getUTCDate();
    
    return new Date(year, month, day);
  }
}
