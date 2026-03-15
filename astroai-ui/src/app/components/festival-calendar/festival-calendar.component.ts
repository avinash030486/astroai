import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface FestivalEvent {
  name: string;
  date: string;
  type: string;
  deity: string;
  significance: string;
  observance: string;
  isNationalHoliday: boolean;
}

export interface FestivalCalendarResponse {
  month: number;
  year: number;
  monthName: string;
  events: FestivalEvent[];
}

const TYPE_ICONS: Record<string, string> = {
  Festival: '🎉', Ekadashi: '🌙', Amavasya: '🌑', Purnima: '🌕',
  Vrat: '🙏', Pradosh: '🕯️', Navratri: '🪔', Jayanti: '⭐'
};

@Component({
  selector: 'app-festival-calendar',
  templateUrl: './festival-calendar.component.html',
  styleUrls: ['./festival-calendar.component.scss']
})
export class FestivalCalendarComponent implements OnInit {
  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  selectedMonth: number;
  selectedYear: number;
  readonly years: number[];

  loading = false;
  error = '';
  result: FestivalCalendarResponse | null = null;

  activeFilter = 'All';
  readonly filters = ['All', 'Festival', 'Ekadashi', 'Amavasya', 'Purnima', 'Vrat', 'Navratri'];

  constructor(private http: HttpClient) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.result = null;

    this.http.get<FestivalCalendarResponse>(
      `${environment.apiBaseUrl}/api/festivals/calendar?month=${this.selectedMonth}&year=${this.selectedYear}`
    ).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => { this.error = err?.error?.error ?? 'Failed to load festival calendar.'; this.loading = false; }
    });
  }

  get filteredEvents(): FestivalEvent[] {
    if (!this.result) return [];
    if (this.activeFilter === 'All') return this.result.events;
    return this.result.events.filter(e => e.type === this.activeFilter);
  }

  typeIcon(type: string): string { return TYPE_ICONS[type] ?? '📅'; }

  prevMonth(): void {
    if (this.selectedMonth === 1) { this.selectedMonth = 12; this.selectedYear--; }
    else this.selectedMonth--;
    this.load();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) { this.selectedMonth = 1; this.selectedYear++; }
    else this.selectedMonth++;
    this.load();
  }
}
