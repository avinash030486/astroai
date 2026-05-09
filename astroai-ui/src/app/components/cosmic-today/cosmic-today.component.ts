import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService, Translations } from '../../services/language.service';
import { SeoFocusService } from '../../services/seo-focus.service';
import { PredictionsService } from '../../services/predictions.service';

interface VaraInfo {
  name: string; nameHi: string; nameMl: string;
  lord: string; lordHi: string; lordMl: string;
  color: string; colorHi: string; colorMl: string;
  gem: string; gemHi: string; gemMl: string;
  number: number;
  energy: string; energyHi: string; energyMl: string;
  tip: string; tipHi: string; tipMl: string;
  rahuKalam: string;
  emoji: string;
  bgClass: string;
}

const VARA_DATA: VaraInfo[] = [
  { // Sunday
    name: 'Sunday', nameHi: 'रविवार', nameMl: 'ഞായർ',
    lord: 'Sun', lordHi: 'सूर्य', lordMl: 'സൂര്യൻ',
    color: 'Orange & Gold', colorHi: 'नारंगी और सुनहरा', colorMl: 'ഓറഞ്ച് & സ്വർണ്ണം',
    gem: 'Ruby', gemHi: 'माणिक्य', gemMl: 'മാണിക്യം',
    number: 1,
    energy: 'Leadership & Vitality', energyHi: 'नेतृत्व और जीवन शक्ति', energyMl: 'നേതൃത്വവും ചൈതന്യവും',
    tip: 'Great day for new ventures, leadership tasks, and connecting with authority figures. Wear orange or gold.',
    tipHi: 'नए उद्यम, नेतृत्व कार्य और अधिकारियों से मिलने के लिए उत्तम दिन। नारंगी या सुनहरे वस्त्र धारण करें।',
    tipMl: 'പുതിയ സംരംഭങ്ങൾ, നേതൃത്വ ജോലികൾ, അധികാരികളെ കാണൽ എന്നിവയ്ക്ക് ഉത്തമ ദിനം. ഓറഞ്ച് അല്ലെങ്കിൽ സ്വർണ്ണ നിറം ധരിക്കൂ.',
    rahuKalam: '4:30 PM – 6:00 PM',
    emoji: '☀️', bgClass: 'vara-sun'
  },
  { // Monday
    name: 'Monday', nameHi: 'सोमवार', nameMl: 'തിങ്കൾ',
    lord: 'Moon', lordHi: 'चंद्र', lordMl: 'ചന്ദ്രൻ',
    color: 'White & Silver', colorHi: 'सफेद और चांदी', colorMl: 'വെള്ള & വെള്ളി',
    gem: 'Pearl', gemHi: 'मोती', gemMl: 'മുത്ത്',
    number: 2,
    energy: 'Emotions & Intuition', energyHi: 'भावनाएं और अंतर्ज्ञान', energyMl: 'വൈകാരികത & അഭിജ്ഞാനം',
    tip: 'Perfect for meditation, family time, and creative work. Emotions are heightened — channel them positively.',
    tipHi: 'ध्यान, पारिवारिक समय और रचनात्मक कार्य के लिए उत्तम। भावनाएं तीव्र हैं — उन्हें सकारात्मक रूप से उपयोग करें।',
    tipMl: 'ധ്യാനം, കുടുംബ സമയം, സർഗ്ഗാത്മക ജോലി എന്നിവയ്ക്ക് മികച്ചത്. വൈകാരികത ഉയർന്നിരിക്കും — ക്രിയാത്മകമായി ഉപയോഗിക്കൂ.',
    rahuKalam: '7:30 AM – 9:00 AM',
    emoji: '🌙', bgClass: 'vara-moon'
  },
  { // Tuesday
    name: 'Tuesday', nameHi: 'मंगलवार', nameMl: 'ചൊവ്വ',
    lord: 'Mars', lordHi: 'मंगल', lordMl: 'ചൊവ്വ',
    color: 'Red & Crimson', colorHi: 'लाल और क्रिमसन', colorMl: 'ചുവപ്പ് & ക്രിംസൺ',
    gem: 'Red Coral', gemHi: 'मूंगा', gemMl: 'പവിഴം',
    number: 9,
    energy: 'Courage & Action', energyHi: 'साहस और कार्यक्षमता', energyMl: 'ധൈര്യവും കർമ്മവും',
    tip: 'Ideal for physical activities, tackling challenges, and bold decisions. Avoid arguments — Mars amplifies conflict.',
    tipHi: 'शारीरिक गतिविधियों, चुनौतियों से निपटने और साहसी निर्णयों के लिए आदर्श। विवाद से बचें।',
    tipMl: 'ശാരീരിക പ്രവർത്തനങ്ങൾ, വെല്ലുവിളികൾ, ധീര തീരുമാനങ്ങൾ എന്നിവയ്ക്ക് അനുയോജ്യം. വഴക്ക് ഒഴിവാക്കൂ.',
    rahuKalam: '3:00 PM – 4:30 PM',
    emoji: '🔴', bgClass: 'vara-mars'
  },
  { // Wednesday
    name: 'Wednesday', nameHi: 'बुधवार', nameMl: 'ബുധൻ',
    lord: 'Mercury', lordHi: 'बुध', lordMl: 'ബുധൻ',
    color: 'Green & Emerald', colorHi: 'हरा और पन्ना', colorMl: 'പച്ച & മരതകം',
    gem: 'Emerald', gemHi: 'पन्ना', gemMl: 'മരതകം',
    number: 5,
    energy: 'Communication & Intelligence', energyHi: 'संचार और बुद्धिमत्ता', energyMl: 'ആശയവിനിമയവും ബുദ്ധിയും',
    tip: 'Best day for business deals, learning, writing, and communication. Mercury sharpens your mind today.',
    tipHi: 'व्यापारिक सौदे, सीखने, लिखने और संचार के लिए सर्वोत्तम दिन। बुध आज आपकी बुद्धि को तेज करता है।',
    tipMl: 'ബിസിനസ്സ് ഇടപാടുകൾ, പഠനം, എഴുത്ത്, ആശയവിനിമയം എന്നിവയ്ക്ക് ഏറ്റവും മികച്ച ദിനം.',
    rahuKalam: '12:00 PM – 1:30 PM',
    emoji: '💚', bgClass: 'vara-mercury'
  },
  { // Thursday
    name: 'Thursday', nameHi: 'गुरुवार', nameMl: 'വ്യാഴം',
    lord: 'Jupiter', lordHi: 'गुरु', lordMl: 'ഗുരു',
    color: 'Yellow & Saffron', colorHi: 'पीला और केसरिया', colorMl: 'മഞ്ഞ & കേസരി',
    gem: 'Yellow Sapphire', gemHi: 'पुखराज', gemMl: 'പുഷ്പരാഗം',
    number: 3,
    energy: 'Wisdom & Prosperity', energyHi: 'ज्ञान और समृद्धि', energyMl: 'ജ്ഞാനവും സമൃദ്ധിയും',
    tip: 'Auspicious for spiritual practices, education, financial planning, and seeking blessings from elders.',
    tipHi: 'आध्यात्मिक अभ्यास, शिक्षा, वित्तीय योजना और बड़ों का आशीर्वाद लेने के लिए शुभ।',
    tipMl: 'ആത്മീയ ആചാരങ്ങൾ, വിദ്യാഭ്യാസം, സാമ്പത്തിക ആസൂത്രണം, മൂത്തവരുടെ അനുഗ്രഹം തേടൽ എന്നിവയ്ക്ക് ശുഭം.',
    rahuKalam: '1:30 PM – 3:00 PM',
    emoji: '⭐', bgClass: 'vara-jupiter'
  },
  { // Friday
    name: 'Friday', nameHi: 'शुक्रवार', nameMl: 'വെള്ളി',
    lord: 'Venus', lordHi: 'शुक्र', lordMl: 'ശുക്രൻ',
    color: 'White & Pink', colorHi: 'सफेद और गुलाबी', colorMl: 'വെള്ള & പിങ്ക്',
    gem: 'Diamond', gemHi: 'हीरा', gemMl: 'വൈഡൂര്യം',
    number: 6,
    energy: 'Love & Creativity', energyHi: 'प्रेम और रचनात्मकता', energyMl: 'പ്രണയവും സർഗ്ഗാത്മകതയും',
    tip: 'Perfect for romance, art, music, beauty routines, and social gatherings. Venus blesses relationships.',
    tipHi: 'प्रेम, कला, संगीत, सौंदर्य और सामाजिक समारोहों के लिए उत्तम। शुक्र रिश्तों को आशीर्वाद देता है।',
    tipMl: 'പ്രണയം, കല, സംഗീതം, സൗന്ദര്യ ചടങ്ങുകൾ, സാമൂഹ്യ ഒത്തുചേരലുകൾ എന്നിവയ്ക്ക് മികച്ചത്.',
    rahuKalam: '10:30 AM – 12:00 PM',
    emoji: '💎', bgClass: 'vara-venus'
  },
  { // Saturday
    name: 'Saturday', nameHi: 'शनिवार', nameMl: 'ശനി',
    lord: 'Saturn', lordHi: 'शनि', lordMl: 'ശനി',
    color: 'Black & Dark Blue', colorHi: 'काला और गहरा नीला', colorMl: 'കറുപ്പ് & ഇരുണ്ട നീല',
    gem: 'Blue Sapphire', gemHi: 'नीलम', gemMl: 'നീലക്കല്ല്',
    number: 8,
    energy: 'Discipline & Karma', energyHi: 'अनुशासन और कर्म', energyMl: 'അച്ചടക്കവും കർമ്മവും',
    tip: 'Ideal for hard work, completing pending tasks, and service. Donate to the needy — Saturn rewards selfless acts.',
    tipHi: 'कठिन परिश्रम, अधूरे काम पूरे करने और सेवा के लिए आदर्श। जरूरतमंदों को दान करें।',
    tipMl: 'കഠിനാദ്ധ്വാനം, തീർക്കാത്ത ജോലികൾ, സേവനം എന്നിവയ്ക്ക് അനുയോജ്യം. ആവശ്യക്കാർക്ക് ദാനം ചെയ്യൂ.',
    rahuKalam: '9:00 AM – 10:30 AM',
    emoji: '🪐', bgClass: 'vara-saturn'
  }
];

// Nakshatra translations (EN → HI/ML) for live API values
const NAKSHATRA_HI: Record<string, string> = {
  'Ashwini':'अश्विनी','Bharani':'भरणी','Krittika':'कृत्तिका','Rohini':'रोहिणी',
  'Mrigashira':'मृगशिरा','Ardra':'आर्द्रा','Punarvasu':'पुनर्वसु','Pushya':'पुष्य',
  'Ashlesha':'आश्लेषा','Magha':'मघा','Purva Phalguni':'पूर्व फाल्गुनी',
  'Uttara Phalguni':'उत्तर फाल्गुनी','Hasta':'हस्त','Chitra':'चित्रा',
  'Swati':'स्वाति','Vishakha':'विशाखा','Anuradha':'अनुराधा','Jyeshtha':'ज्येष्ठा',
  'Mula':'मूल','Purva Ashadha':'पूर्व आषाढ़','Uttara Ashadha':'उत्तर आषाढ़',
  'Shravana':'श्रवण','Dhanishtha':'धनिष्ठा','Shatabhisha':'शतभिषा',
  'Purva Bhadrapada':'पूर्व भाद्रपद','Uttara Bhadrapada':'उत्तर भाद्रपद','Revati':'रेवती'
};
const NAKSHATRA_ML: Record<string, string> = {
  'Ashwini':'അശ്വതി','Bharani':'ഭരണി','Krittika':'കാർത്തിക','Rohini':'രോഹിണി',
  'Mrigashira':'മകയിരം','Ardra':'തിരുവാതിര','Punarvasu':'പുണർതം','Pushya':'പൂയം',
  'Ashlesha':'ആയില്യം','Magha':'മകം','Purva Phalguni':'പൂരം','Uttara Phalguni':'ഉത്രം',
  'Hasta':'അത്തം','Chitra':'ചിത്തിര','Swati':'ചോതി','Vishakha':'വിശാഖം',
  'Anuradha':'അനിഴം','Jyeshtha':'തൃക്കേട്ട','Mula':'മൂലം','Purva Ashadha':'പൂരാടം',
  'Uttara Ashadha':'ഉത്രാടം','Shravana':'തിരുവോണം','Dhanishtha':'അവിട്ടം',
  'Shatabhisha':'ചതയം','Purva Bhadrapada':'പൂരുരുട്ടാതി',
  'Uttara Bhadrapada':'ഉത്തൃട്ടാതി','Revati':'രേവതി'
};
const SIGN_HI: Record<string, string> = {
  'Aries':'मेष','Taurus':'वृषभ','Gemini':'मिथुन','Cancer':'कर्क','Leo':'सिंह',
  'Virgo':'कन्या','Libra':'तुला','Scorpio':'वृश्चिक','Sagittarius':'धनु',
  'Capricorn':'मकर','Aquarius':'कुम्भ','Pisces':'मीन'
};
const SIGN_ML: Record<string, string> = {
  'Aries':'മേടം','Taurus':'ഇടവം','Gemini':'മിഥുനം','Cancer':'കർക്കടകം','Leo':'ചിങ്ങം',
  'Virgo':'കന്നി','Libra':'തുലാം','Scorpio':'വൃശ്ചികം','Sagittarius':'ധനു',
  'Capricorn':'മകരം','Aquarius':'കുംഭം','Pisces':'മീനം'
};

@Component({
  selector: 'app-cosmic-today',
  templateUrl: './cosmic-today.component.html',
  styleUrls: ['./cosmic-today.component.scss']
})
export class CosmicTodayComponent implements OnInit, OnDestroy {
  t!: Translations;
  vara!: VaraInfo;
  today = new Date();
  // Live data from panchang API
  nakshatra = '';
  moonSign = '';
  rahuKalam = '';
  panchangLoading = true;
  private sub!: Subscription;

  constructor(
    public langSvc: LanguageService,
    private seo: SeoFocusService,
    private predictions: PredictionsService
  ) {}

  ngOnInit(): void {
    this.t = this.langSvc.t;
    this.vara = VARA_DATA[this.today.getDay()];
    this.sub = this.langSvc.lang$.subscribe(() => { this.t = this.langSvc.t; });
    this.seo.setPage({
      title: "Today's Cosmic Weather — Free Vedic Daily Energy | VedicAstro",
      description: "Free daily Vedic astrology snapshot: Moon nakshatra, lucky color, auspicious timings and cosmic tips — no login needed. Updated every day.",
      keywords: 'cosmic weather today, vedic astrology today, moon nakshatra today, rahu kalam today, lucky color today, free astrology',
      canonical: '/cosmic-today'
    });
    this.fetchLivePanchang();
  }

  private fetchLivePanchang(): void {
    // Use India/New Delhi as default — good for majority of users
    this.predictions.getMoonPosition().subscribe({
      next: (res) => {
        this.nakshatra = res.nakshatra || '';
        this.moonSign = res.moonSign || '';
        this.rahuKalam = res.rahuKalam || this.vara.rahuKalam;
        this.panchangLoading = false;
      },
      error: () => {
        // Fallback to vara static defaults on API error
        this.nakshatra = 'Krittika';
        this.moonSign = 'Aries';
        this.rahuKalam = this.vara.rahuKalam;
        this.panchangLoading = false;
      }
    });
  }

  get currentNakshatra(): string {
    if (!this.nakshatra) return '...';
    switch (this.langSvc.current) {
      case 'hi': return NAKSHATRA_HI[this.nakshatra] || this.nakshatra;
      case 'ml': return NAKSHATRA_ML[this.nakshatra] || this.nakshatra;
      default: return this.nakshatra;
    }
  }

  get currentMoonSign(): string {
    if (!this.moonSign) return '...';
    switch (this.langSvc.current) {
      case 'hi': return SIGN_HI[this.moonSign] || this.moonSign;
      case 'ml': return SIGN_ML[this.moonSign] || this.moonSign;
      default: return this.moonSign;
    }
  }

  get currentVaraName(): string {
    switch (this.langSvc.current) {
      case 'hi': return this.vara.nameHi;
      case 'ml': return this.vara.nameMl;
      default: return this.vara.name;
    }
  }

  get currentLuckyColor(): string {
    switch (this.langSvc.current) {
      case 'hi': return this.vara.colorHi;
      case 'ml': return this.vara.colorMl;
      default: return this.vara.color;
    }
  }

  get currentEnergy(): string {
    switch (this.langSvc.current) {
      case 'hi': return this.vara.energyHi;
      case 'ml': return this.vara.energyMl;
      default: return this.vara.energy;
    }
  }

  get currentTip(): string {
    switch (this.langSvc.current) {
      case 'hi': return this.vara.tipHi;
      case 'ml': return this.vara.tipMl;
      default: return this.vara.tip;
    }
  }

  get currentGem(): string {
    switch (this.langSvc.current) {
      case 'hi': return this.vara.gemHi;
      case 'ml': return this.vara.gemMl;
      default: return this.vara.gem;
    }
  }

  shareOnWhatsApp(): void {
    const url = encodeURIComponent('https://vedicastro.app/cosmic-today');
    const text = encodeURIComponent(
      `${this.vara.emoji} ${this.t.cosmicTodayTitle}\n` +
      `${this.t.moonNakshatra}: ${this.currentNakshatra}\n` +
      `${this.t.luckyColor}: ${this.currentLuckyColor}\n` +
      `${this.t.avoidTime}: ${this.rahuKalam}\n\n` +
      `${this.t.shareText}\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
