import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HoroscopeComponent } from './components/horoscope/horoscope.component';
import { BirthChartComponent } from './components/birth-chart/birth-chart.component';
import { UpcomingFeaturesComponent } from './components/upcoming-features/upcoming-features.component';
import { DailyPredictionComponent } from './components/daily-prediction/daily-prediction.component';
import { DailyPanchangComponent } from './components/daily-panchang/daily-panchang.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'horoscope', component: HoroscopeComponent },
  { path: 'daily-horoscope', component: DailyPredictionComponent },
  { path: 'daily-panchang', component: DailyPanchangComponent },
  { path: 'birth-chart', component: BirthChartComponent },
  { path: 'upcoming', component: UpcomingFeaturesComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
