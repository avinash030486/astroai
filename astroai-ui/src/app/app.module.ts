import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
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
import { PricingComponent } from './components/pricing-page/pricing.component';
import { YogaListComponent } from './components/yoga-list/yoga-list.component';
import { YogaDetailComponent } from './components/yoga-detail/yoga-detail.component';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { TransitAlertsComponent } from './components/transit-alerts/transit-alerts.component';
import { MuhuratCalculatorComponent } from './components/muhurat-calculator/muhurat-calculator.component';
import { GemstoneEngineComponent } from './components/gemstone-engine/gemstone-engine.component';
import { FestivalCalendarComponent } from './components/festival-calendar/festival-calendar.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
// add to declarations: [PrivacyComponent, TermsComponent]
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
    AuthCallbackComponent,
    PricingComponent,
    YogaListComponent,
    YogaDetailComponent,
    SanitizePipe,
    TransitAlertsComponent,
    MuhuratCalculatorComponent,
    GemstoneEngineComponent,
    FestivalCalendarComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
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