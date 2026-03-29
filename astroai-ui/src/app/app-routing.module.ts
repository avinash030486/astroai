import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HoroscopeComponent } from './components/horoscope/horoscope.component';
import { BirthChartComponent } from './components/birth-chart/birth-chart.component';
import { UpcomingFeaturesComponent } from './components/upcoming-features/upcoming-features.component';
import { DailyPredictionComponent } from './components/daily-prediction/daily-prediction.component';
import { DailyPanchangComponent } from './components/daily-panchang/daily-panchang.component';
import { LandingComponent } from './components/landing/landing.component';
import { NumerologyComponent } from './components/numerology/numerology.component';
import { MatchmakingComponent } from './components/matchmaking/matchmaking.component';
import { YearlyHoroscopeComponent } from './components/yearly-horoscope/yearly-horoscope.component';
import { RemediesComponent } from './components/remedies/remedies.component';
import { CityPanchangListComponent } from './components/city-panchang-list/city-panchang-list.component';
import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { YogaListComponent } from './components/yoga-list/yoga-list.component';
import { YogaDetailComponent } from './components/yoga-detail/yoga-detail.component';
import { requireAuthGuard } from './guards/auth.guard';
import { TransitAlertsComponent } from './components/transit-alerts/transit-alerts.component';
import { MuhuratCalculatorComponent } from './components/muhurat-calculator/muhurat-calculator.component';
import { GemstoneEngineComponent } from './components/gemstone-engine/gemstone-engine.component';
import { FestivalCalendarComponent } from './components/festival-calendar/festival-calendar.component';
import { PricingComponent } from './components/pricing-page/pricing.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { PlanetHouseListComponent } from './components/planet-house-list/planet-house-list.component';
import { PlanetHouseDetailComponent } from './components/planet-house-detail/planet-house-detail.component';
import { PlanetSignListComponent } from './components/planet-sign-list/planet-sign-list.component';
import { PlanetSignDetailComponent } from './components/planet-sign-detail/planet-sign-detail.component';
import { NakshatraListComponent } from './components/nakshatra-list/nakshatra-list.component';
import { NakshatraDetailComponent } from './components/nakshatra-detail/nakshatra-detail.component';
const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { path: 'home', component: HomeComponent },
  { path: 'horoscope', component: HoroscopeComponent },
  { path: 'daily-prediction', component: DailyPredictionComponent },
  { path: 'daily-panchang', component: DailyPanchangComponent },
  { path: 'city-panchang', component: CityPanchangListComponent },
  { path: 'panchang/:city/:date', component: DailyPanchangComponent },
  { path: 'yogas', component: YogaListComponent },
  { path: 'yoga/:slug', component: YogaDetailComponent },
  { path: 'yearly-horoscope', component: YearlyHoroscopeComponent },
  { path: 'remedies', component: RemediesComponent },
  { path: 'birth-chart', component: BirthChartComponent, canActivate: [requireAuthGuard] },
  { path: 'numerology', component: NumerologyComponent, canActivate: [requireAuthGuard] },
  { path: 'matchmaking', component: MatchmakingComponent, canActivate: [requireAuthGuard] },
  { path: 'upcoming', component: UpcomingFeaturesComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'transit-alerts', component: TransitAlertsComponent },
  { path: 'transit-alerts/:sign', component: TransitAlertsComponent },
  { path: 'muhurat', component: MuhuratCalculatorComponent },
  { path: 'gemstones', component: GemstoneEngineComponent },
  { path: 'festivals', component: FestivalCalendarComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'planets', component: PlanetHouseListComponent },
  { path: 'planet/:slug', component: PlanetHouseDetailComponent },
  { path: 'planet-signs', component: PlanetSignListComponent },
  { path: 'planet-sign/:slug', component: PlanetSignDetailComponent },
  { path: 'nakshatras', component: NakshatraListComponent },
  { path: 'nakshatra/:slug', component: NakshatraDetailComponent },
  { path: '**', redirectTo: '' }                     // ← wildcard always last
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }