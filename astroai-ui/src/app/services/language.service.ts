import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLang = 'en' | 'hi' | 'ml';

export interface Translations {
  // Navbar
  home: string;
  forecasts: string;
  panchang: string;
  explore: string;
  panditArjun: string;
  myTools: string;
  signIn: string;
  signOut: string;
  dashboard: string;
  // Forecasts dropdown
  dailyHoroscope: string;
  yearlyHoroscope: string;
  transitAlerts: string;
  cosmicToday: string;
  // Panchang dropdown
  todayPanchang: string;
  cityPanchang: string;
  muhurat: string;
  festivals: string;
  // Cosmic Today page
  cosmicTodayTitle: string;
  cosmicTodaySubtitle: string;
  todayIs: string;
  moonNakshatra: string;
  vara: string;
  luckyColor: string;
  luckyNumber: string;
  luckyGem: string;
  avoidTime: string;
  auspiciousTime: string;
  brahmaTitle: string;
  abhijitTitle: string;
  rahuKalamTitle: string;
  moonInSign: string;
  dayEnergy: string;
  shareWhatsApp: string;
  shareText: string;
  todayTip: string;
  freeNoLogin: string;
  getFullChart: string;
  cosmicMessage: string;
}

const EN: Translations = {
  home: 'Home',
  forecasts: 'Forecasts',
  panchang: 'Panchang',
  explore: 'Explore',
  panditArjun: '🔮 Pandit Arjun',
  myTools: 'My Tools',
  signIn: 'Sign In',
  signOut: 'Sign Out',
  dashboard: '⚡ Dashboard',
  dailyHoroscope: '🌅 Daily Horoscope',
  yearlyHoroscope: '📅 Yearly Horoscope',
  transitAlerts: '🪐 Transit Alerts',
  cosmicToday: '🌌 Cosmic Today',
  todayPanchang: "📆 Today's Panchang",
  cityPanchang: '🏙️ City Panchang',
  muhurat: '✨ Muhurat',
  festivals: '🪔 Festivals',
  cosmicTodayTitle: "Today's Cosmic Weather",
  cosmicTodaySubtitle: 'Free daily Vedic energy snapshot — no login needed',
  todayIs: 'Today is',
  moonNakshatra: 'Moon Nakshatra',
  vara: "Today's Vara (Weekday)",
  luckyColor: 'Lucky Color',
  luckyNumber: 'Lucky Number',
  luckyGem: 'Lucky Gemstone',
  avoidTime: 'Rahu Kalam — Avoid',
  auspiciousTime: 'Auspicious Windows',
  brahmaTitle: 'Brahma Muhurta',
  abhijitTitle: 'Abhijit Muhurta',
  rahuKalamTitle: 'Rahu Kalam',
  moonInSign: 'Moon in Sign',
  dayEnergy: "Day's Energy",
  shareWhatsApp: '📲 Share on WhatsApp',
  shareText: "Check today's cosmic energy on VedicAstro!",
  todayTip: "Today's Cosmic Tip",
  freeNoLogin: '✅ 100% Free • No Login Required',
  getFullChart: '🔮 Get Your Full Birth Chart',
  cosmicMessage: 'Cosmic Message',
};

const HI: Translations = {
  home: 'होम',
  forecasts: 'भविष्यवाणी',
  panchang: 'पंचांग',
  explore: 'अन्वेषण',
  panditArjun: '🔮 पंडित अर्जुन',
  myTools: 'मेरे टूल्स',
  signIn: 'साइन इन',
  signOut: 'साइन आउट',
  dashboard: '⚡ डैशबोर्ड',
  dailyHoroscope: '🌅 दैनिक राशिफल',
  yearlyHoroscope: '📅 वार्षिक राशिफल',
  transitAlerts: '🪐 ग्रह गोचर',
  cosmicToday: '🌌 आज का ब्रह्मांड',
  todayPanchang: "📆 आज का पंचांग",
  cityPanchang: '🏙️ शहर पंचांग',
  muhurat: '✨ मुहूर्त',
  festivals: '🪔 त्योहार',
  cosmicTodayTitle: 'आज का ब्रह्मांडीय मौसम',
  cosmicTodaySubtitle: 'मुफ़्त दैनिक वैदिक ऊर्जा झलक — लॉगिन की ज़रूरत नहीं',
  todayIs: 'आज है',
  moonNakshatra: 'चंद्र नक्षत्र',
  vara: 'आज का वार',
  luckyColor: 'शुभ रंग',
  luckyNumber: 'शुभ अंक',
  luckyGem: 'शुभ रत्न',
  avoidTime: 'राहुकाल — बचें',
  auspiciousTime: 'शुभ मुहूर्त',
  brahmaTitle: 'ब्रह्म मुहूर्त',
  abhijitTitle: 'अभिजित मुहूर्त',
  rahuKalamTitle: 'राहु काल',
  moonInSign: 'चंद्र राशि',
  dayEnergy: 'दिन की ऊर्जा',
  shareWhatsApp: '📲 WhatsApp पर शेयर करें',
  shareText: 'VedicAstro पर आज की ब्रह्मांडीय ऊर्जा देखें!',
  todayTip: 'आज का ब्रह्मांडीय संदेश',
  freeNoLogin: '✅ पूरी तरह मुफ़्त • कोई लॉगिन नहीं',
  getFullChart: '🔮 अपनी जन्म कुंडली देखें',
  cosmicMessage: 'ब्रह्मांडीय संदेश',
};

const ML: Translations = {
  home: 'ഹോം',
  forecasts: 'പ്രവചനങ്ങൾ',
  panchang: 'പഞ്ചാംഗം',
  explore: 'പര്യവേക്ഷണം',
  panditArjun: '🔮 പണ്ഡിറ്റ് അർജുൻ',
  myTools: 'എന്റെ ടൂളുകൾ',
  signIn: 'സൈൻ ഇൻ',
  signOut: 'സൈൻ ഔട്ട്',
  dashboard: '⚡ ഡാഷ്ബോർഡ്',
  dailyHoroscope: '🌅 ദൈനിക രാശിഫലം',
  yearlyHoroscope: '📅 വാർഷിക രാശിഫലം',
  transitAlerts: '🪐 ഗ്രഹ ഗോചരം',
  cosmicToday: '🌌 ഇന്നത്തെ പ്രപഞ്ചം',
  todayPanchang: "📆 ഇന്നത്തെ പഞ്ചാംഗം",
  cityPanchang: '🏙️ നഗര പഞ്ചാംഗം',
  muhurat: '✨ മുഹൂർത്തം',
  festivals: '🪔 ഉത്സവങ്ങൾ',
  cosmicTodayTitle: 'ഇന്നത്തെ പ്രാപഞ്ചിക കാലാവസ്ഥ',
  cosmicTodaySubtitle: 'സൗജന്യ ദൈനിക വൈദിക ഊർജ്ജ ചിത്രം — ലോഗിൻ ആവശ്യമില്ല',
  todayIs: 'ഇന്ന്',
  moonNakshatra: 'ചന്ദ്ര നക്ഷത്രം',
  vara: 'ഇന്നത്തെ വാരം',
  luckyColor: 'ഭാഗ്യ വർണ്ണം',
  luckyNumber: 'ഭാഗ്യ സംഖ്യ',
  luckyGem: 'ഭാഗ്യ രത്നം',
  avoidTime: 'രാഹുകാലം — ഒഴിവാക്കുക',
  auspiciousTime: 'ശുഭ മുഹൂർത്തങ്ങൾ',
  brahmaTitle: 'ബ്രഹ്മ മുഹൂർത്തം',
  abhijitTitle: 'അഭിജിത് മുഹൂർത്തം',
  rahuKalamTitle: 'രാഹുകാലം',
  moonInSign: 'ചന്ദ്ര രാശി',
  dayEnergy: 'ദിന ഊർജ്ജം',
  shareWhatsApp: '📲 WhatsApp-ൽ പങ്കിടുക',
  shareText: 'VedicAstro-ൽ ഇന്നത്തെ പ്രാപഞ്ചിക ഊർജ്ജം നോക്കൂ!',
  todayTip: 'ഇന്നത്തെ പ്രാപഞ്ചിക സന്ദേശം',
  freeNoLogin: '✅ 100% സൗജന്യം • ലോഗിൻ ആവശ്യമില്ല',
  getFullChart: '🔮 നിങ്ങളുടെ ജന്മ കുണ്ഡലി കാണുക',
  cosmicMessage: 'പ്രാപഞ്ചിക സന്ദേശം',
};

const TRANSLATIONS: Record<SupportedLang, Translations> = { en: EN, hi: HI, ml: ML };

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _lang = new BehaviorSubject<SupportedLang>(this.loadSaved());
  lang$ = this._lang.asObservable();

  get current(): SupportedLang { return this._lang.value; }

  get t(): Translations { return TRANSLATIONS[this._lang.value]; }

  setLang(lang: SupportedLang): void {
    this._lang.next(lang);
    localStorage.setItem('va_lang', lang);
    document.documentElement.lang = lang;
  }

  private loadSaved(): SupportedLang {
    const saved = localStorage.getItem('va_lang') as SupportedLang;
    return saved && TRANSLATIONS[saved] ? saved : 'en';
  }
}
