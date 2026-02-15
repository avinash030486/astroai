import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HoroscopeComponent } from './components/horoscope/horoscope.component';
import { BirthChartComponent } from './components/birth-chart/birth-chart.component';
import { DailyPredictionComponent } from './components/daily-prediction/daily-prediction.component';
import { DailyPanchangComponent } from './components/daily-panchang/daily-panchang.component';
import { UpcomingFeaturesComponent } from './components/upcoming-features/upcoming-features.component';
import { LandingComponent } from './components/landing/landing.component';
import { NumerologyComponent } from './components/numerology/numerology.component';
import { MatchmakingComponent } from './components/matchmaking/matchmaking.component';
import { YearlyHoroscopeComponent } from './components/yearly-horoscope/yearly-horoscope.component';
import { RemediesComponent } from './components/remedies/remedies.component';
import { CityPanchangListComponent } from './components/city-panchang-list/city-panchang-list.component';
import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HoroscopeComponent,
    BirthChartComponent,
    DailyPredictionComponent,
    DailyPanchangComponent,
    UpcomingFeaturesComponent,
    LandingComponent,
    NumerologyComponent,
    MatchmakingComponent,
    YearlyHoroscopeComponent,
    RemediesComponent,
    CityPanchangListComponent,
    LoginComponent,
    AuthCallbackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
