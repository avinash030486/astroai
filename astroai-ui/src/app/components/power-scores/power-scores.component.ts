import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SeoFocusService } from '../../services/seo-focus.service';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_EMOJIS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
};

// Base scores [Career, Romance, Health] derived from sign traits
const SIGN_BASE: Record<string, [number,number,number]> = {
  Aries:       [75, 62, 78],  Taurus:      [68, 80, 74],
  Gemini:      [80, 68, 62],  Cancer:      [58, 85, 70],
  Leo:         [85, 74, 77],  Virgo:       [78, 58, 85],
  Libra:       [68, 87, 63],  Scorpio:     [70, 80, 68],
  Sagittarius: [80, 66, 74],  Capricorn:   [86, 52, 70],
  Aquarius:    [78, 64, 66],  Pisces:      [58, 84, 71]
};

// Weekday energy bonuses [Career, Romance, Health] — Sun=0 … Sat=6
const DAY_BONUS: [number,number,number][] = [
  [10,  8, 18], // Sunday   – Sun  – vitality, leadership
  [ 5, 18, 12], // Monday   – Moon – emotions, nurture
  [22,  3, 10], // Tuesday  – Mars – drive, ambition
  [15, 12,  8], // Wednesday– Mercury – intellect, deals
  [20, 10, 14], // Thursday – Jupiter – growth, luck
  [ 8, 22, 10], // Friday   – Venus – love, beauty
  [12,  5, 20]  // Saturday – Saturn – discipline, health
];

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

@Component({
  selector: 'app-power-scores',
  templateUrl: './power-scores.component.html',
  styleUrls: ['./power-scores.component.scss']
})
export class PowerScoresComponent implements OnInit {
  @ViewChild('scoreCard') scoreCard?: ElementRef<HTMLDivElement>;

  signs = SIGNS;
  signEmojis = SIGN_EMOJIS;
  selectedSign = 'Aries';

  today = new Date();
  todayLabel = '';
  dayName = '';

  careerScore  = 0;
  romanceScore = 0;
  healthScore  = 0;
  overallScore = 0;

  careerTip  = '';
  romanceTip = '';
  healthTip  = '';

  sharing = false;
  shared  = false;

  readonly CIRC_LARGE = +(2 * Math.PI * 55).toFixed(2);
  readonly CIRC_SMALL = +(2 * Math.PI * 40).toFixed(2);

  constructor(private seo: SeoFocusService) {}

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Daily Cosmic Power Scores — Career, Romance & Health Luck Index',
      description: 'Check your daily Vedic astrology power scores for Career, Romance & Health. Personalised luck index based on planetary transits and your zodiac sign.',
      keywords: 'daily astrology scores, vedic luck index, career astrology, romance astrology, health astrology, cosmic power score, zodiac scores',
      canonical: '/power-scores'
    });

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    this.dayName   = days[this.today.getDay()];
    this.todayLabel = this.today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const saved = localStorage.getItem('astroai_sign');
    if (saved && SIGNS.includes(saved)) this.selectedSign = saved;

    this.computeScores();
  }

  onSignChange(): void {
    localStorage.setItem('astroai_sign', this.selectedSign);
    this.computeScores();
    this.shared = false;
  }

  computeScores(): void {
    const base  = SIGN_BASE[this.selectedSign] ?? [70, 70, 70];
    const bonus = DAY_BONUS[this.today.getDay()];
    const idx   = SIGNS.indexOf(this.selectedSign);
    const seed  = this.today.getDate() + this.today.getMonth() * 31 + idx * 7;

    const rnd = (s: number) => Math.round((seededRand(s) * 12) - 6); // ±6

    this.careerScore  = this.clamp(base[0] + bonus[0] + rnd(seed));
    this.romanceScore = this.clamp(base[1] + bonus[1] + rnd(seed + 1));
    this.healthScore  = this.clamp(base[2] + bonus[2] + rnd(seed + 2));
    this.overallScore = Math.round((this.careerScore + this.romanceScore + this.healthScore) / 3);

    this.careerTip  = this.getCareerTip(this.careerScore);
    this.romanceTip = this.getRomanceTip(this.romanceScore);
    this.healthTip  = this.getHealthTip(this.healthScore);
  }

  private clamp(v: number): number { return Math.min(99, Math.max(35, v)); }

  getScoreColor(score: number): string {
    if (score >= 80) return '#2ed573';
    if (score >= 60) return '#ffa502';
    return '#ff4757';
  }

  getScoreLabel(score: number): string {
    if (score >= 85) return 'Excellent ✨';
    if (score >= 70) return 'Good ⭐';
    if (score >= 55) return 'Moderate 🌤';
    return 'Challenging 🌧';
  }

  largeDashOffset(score: number): number {
    return this.CIRC_LARGE - (score / 100) * this.CIRC_LARGE;
  }

  smallDashOffset(score: number): number {
    return this.CIRC_SMALL - (score / 100) * this.CIRC_SMALL;
  }

  private getCareerTip(score: number): string {
    const sign = this.selectedSign;
    if (score >= 80) return `🔥 Stellar day for ${sign}! Pitch ideas, take initiative, and make bold career moves. Planetary energy is firmly on your side.`;
    if (score >= 65) return `💡 Solid career energy for ${sign}. Complete pending tasks and build key relationships. Avoid major negotiations today.`;
    return `🧘 Quiet day for ${sign} at work. Observe, plan, and prepare. Your big career move belongs to a higher-score day coming soon.`;
  }

  private getRomanceTip(score: number): string {
    const sign = this.selectedSign;
    if (score >= 80) return `💖 Venus smiles on ${sign} today! Express your feelings, plan something special, or have that heart-to-heart conversation you've been postponing.`;
    if (score >= 65) return `🌹 Warm romantic energy for ${sign}. Small gestures carry big meaning today. Choose warmth over logic in conversations.`;
    return `🌙 Introspective day for ${sign}'s love life. Focus on self-understanding — clarity about what you truly want is forming beneath the surface.`;
  }

  private getHealthTip(score: number): string {
    const sign = this.selectedSign;
    if (score >= 80) return `🌟 High vitality for ${sign}! Perfect for exercise, starting a new health habit, or outdoor activities. Body and mind are fully aligned.`;
    if (score >= 65) return `🥗 Good health energy for ${sign}. Stay hydrated and eat mindfully. Light movement will noticeably lift your energy levels.`;
    return `😴 Rest-forward day for ${sign}. Don't push your body. Prioritise sleep, digestion, and stress relief over intense workouts today.`;
  }

  async shareCard(): Promise<void> {
    if (!this.scoreCard) return;
    this.sharing = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(this.scoreCard.nativeElement, {
        backgroundColor: '#0d1b2e',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link    = document.createElement('a');
      link.download = `cosmic-scores-${this.selectedSign}-${new Date().toISOString().slice(0,10)}.png`;
      link.href     = dataUrl;
      link.click();
      this.shared = true;
    } catch (e) { console.error(e); }
    this.sharing = false;
  }
}
