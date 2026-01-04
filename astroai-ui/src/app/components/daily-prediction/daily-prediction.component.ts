import { Component, OnInit } from '@angular/core';
import { PredictionsService, DailyPredictionsResponse, DailyPrediction } from '../../services/predictions.service';

interface ZodiacTile extends DailyPrediction {
  symbol: string;
}

@Component({
  selector: 'app-daily-prediction',
  templateUrl: './daily-prediction.component.html',
  styleUrls: ['./daily-prediction.component.scss']
})
export class DailyPredictionComponent implements OnInit {
  loading = false;
  error?: string;
  dateUtc?: string;

  tiles: ZodiacTile[] = [];

  private readonly order = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  private readonly symbols: Record<string, string> = {
    Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
    Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
  };

  constructor(private predictions: PredictionsService) {}

  ngOnInit(): void {
    this.fetchDaily();
  }

  refresh(): void {
    this.fetchDaily();
  }

  private fetchDaily(): void {
    this.error = undefined;
    this.loading = true;
    this.predictions.getDailyPredictions().subscribe({
      next: (res: DailyPredictionsResponse) => {
        this.dateUtc = res.dateUtc;
        const bySign: Record<string, DailyPrediction> = {};
        for (const p of res.predictions || []) {
          bySign[p.sign] = p;
        }
        this.tiles = this.order.map(sign => ({
          sign,
          symbol: this.symbols[sign],
          career: bySign[sign]?.career || '—',
          money: bySign[sign]?.money || '—',
          love: bySign[sign]?.love || '—'
        }));
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.message || 'Failed to load daily predictions.';
        this.loading = false;
      }
    });
  }
}
