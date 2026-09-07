import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SeoFocusService } from '../../services/seo-focus.service';

export interface SquadMember {
  name: string;
  sign: string;
  archetype: string;
  archetypeEmoji: string;
  role: string;
  element: string;
  elementEmoji: string;
  color: string;
}

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_EMOJIS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
};

const ARCHETYPES: Record<string, { archetype: string; emoji: string; role: string; color: string }> = {
  Aries:       { archetype: 'The Pioneer',     emoji: '🚀', role: 'Initiates, challenges, pushes everyone forward',   color: '#ff4757' },
  Taurus:      { archetype: 'The Anchor',       emoji: '⚓', role: 'Stabilises the group, provides patience & trust',   color: '#2ed573' },
  Gemini:      { archetype: 'The Connector',    emoji: '🗣️', role: 'Bridges ideas and people, keeps energy lively',     color: '#ffa502' },
  Cancer:      { archetype: 'The Nurturer',     emoji: '🤗', role: 'Holds emotional space, protects group bonds',       color: '#1e90ff' },
  Leo:         { archetype: 'The Visionary',    emoji: '👑', role: 'Inspires, leads with charisma and creative fire',   color: '#FFD700' },
  Virgo:       { archetype: 'The Analyst',      emoji: '🔬', role: 'Perfects, refines, catches what others miss',       color: '#7bed9f' },
  Libra:       { archetype: 'The Mediator',     emoji: '⚖️', role: 'Balances tensions, champions fairness for all',    color: '#eccc68' },
  Scorpio:     { archetype: 'The Transformer',  emoji: '🔮', role: 'Digs deep, uncovers truth, catalyses change',       color: '#9b59b6' },
  Sagittarius: { archetype: 'The Philosopher',  emoji: '🏹', role: 'Expands horizons, questions boundaries, seeks meaning', color: '#f39c12' },
  Capricorn:   { archetype: 'The Strategist',   emoji: '🏔️', role: 'Plans long-term, delivers results, builds legacy', color: '#aaa' },
  Aquarius:    { archetype: 'The Innovator',    emoji: '💡', role: 'Disrupts status quo, brings radical new ideas',      color: '#74b9ff' },
  Pisces:      { archetype: 'The Empath',       emoji: '🌊', role: 'Feels deeply, intuits hidden currents, inspires art', color: '#a29bfe' }
};

const ELEMENTS: Record<string, string> = {
  Aries:'Fire', Leo:'Fire', Sagittarius:'Fire',
  Taurus:'Earth', Virgo:'Earth', Capricorn:'Earth',
  Gemini:'Air', Libra:'Air', Aquarius:'Air',
  Cancer:'Water', Scorpio:'Water', Pisces:'Water'
};
const ELEMENT_EMOJIS: Record<string, string> = { Fire:'🔥', Earth:'🌍', Air:'💨', Water:'🌊' };

// Element compatibility scores (symmetric)
const COMPAT: Record<string, Record<string, number>> = {
  Fire:  { Fire: 78, Earth: 45, Air: 92, Water: 50 },
  Earth: { Fire: 45, Earth: 80, Air: 58, Water: 85 },
  Air:   { Fire: 92, Earth: 58, Air: 76, Water: 55 },
  Water: { Fire: 50, Earth: 85, Air: 55, Water: 82 }
};

function pairCompat(s1: string, s2: string): number {
  const e1 = ELEMENTS[s1] ?? 'Air';
  const e2 = ELEMENTS[s2] ?? 'Air';
  return COMPAT[e1]?.[e2] ?? 60;
}

@Component({
  selector: 'app-squad-compat',
  templateUrl: './squad-compat.component.html',
  styleUrls: ['./squad-compat.component.scss']
})
export class SquadCompatComponent implements OnInit {
  @ViewChild('resultCard') resultCard?: ElementRef<HTMLDivElement>;

  signs = SIGNS;
  signEmojis = SIGN_EMOJIS;

  // Input members (up to 6)
  inputMembers: { name: string; sign: string }[] = [
    { name: '', sign: 'Aries' },
    { name: '', sign: 'Taurus' }
  ];

  // Results
  squadMembers: SquadMember[] = [];
  groupScore = 0;
  groupVibe  = '';
  groupAdvice = '';
  pairScores: { pair: string; score: number; label: string }[] = [];
  showResult  = false;
  analyzed    = false;

  sharing = false;
  shared  = false;

  constructor(private seo: SeoFocusService) {}

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Squad Compatibility — Vedic Astrology Group Vibe Analysis',
      description: 'Find out how your friend group, family or team vibes together! Enter everyone\'s zodiac signs for a Vedic astrology squad compatibility report.',
      keywords: 'squad compatibility, group astrology, zodiac compatibility, friend group astrology, team astrology, vedic group compatibility',
      canonical: '/squad-compat'
    });
  }

  addMember(): void {
    if (this.inputMembers.length < 6) {
      this.inputMembers.push({ name: '', sign: 'Gemini' });
    }
  }

  removeMember(i: number): void {
    if (this.inputMembers.length > 2) {
      this.inputMembers.splice(i, 1);
    }
  }

  canAnalyze(): boolean {
    return this.inputMembers.filter(m => m.name.trim()).length >= 2;
  }

  analyze(): void {
    const valid = this.inputMembers.filter(m => m.name.trim());
    if (valid.length < 2) return;

    this.squadMembers = valid.map(m => {
      const a = ARCHETYPES[m.sign] ?? ARCHETYPES['Aries'];
      const el = ELEMENTS[m.sign] ?? 'Air';
      return {
        name: m.name.trim(),
        sign: m.sign,
        archetype: a.archetype,
        archetypeEmoji: a.emoji,
        role: a.role,
        element: el,
        elementEmoji: ELEMENT_EMOJIS[el] ?? '✨',
        color: a.color
      };
    });

    // Pairwise compatibility
    this.pairScores = [];
    let total = 0, count = 0;
    for (let i = 0; i < this.squadMembers.length; i++) {
      for (let j = i + 1; j < this.squadMembers.length; j++) {
        const s = pairCompat(this.squadMembers[i].sign, this.squadMembers[j].sign);
        total += s; count++;
        this.pairScores.push({
          pair:  `${this.squadMembers[i].name} & ${this.squadMembers[j].name}`,
          score: s,
          label: this.compatLabel(s)
        });
      }
    }
    this.groupScore = count > 0 ? Math.round(total / count) : 70;
    this.groupVibe  = this.getVibe();
    this.groupAdvice = this.getAdvice();

    this.showResult = true;
    this.analyzed   = true;
    this.shared     = false;
  }

  reset(): void {
    this.showResult = false;
    this.analyzed   = false;
    this.shared     = false;
  }

  private compatLabel(s: number): string {
    if (s >= 85) return '🔥 Magnetic';
    if (s >= 72) return '⭐ Harmonious';
    if (s >= 58) return '🌤 Compatible';
    return '🌧 Challenging';
  }

  getScoreColor(s: number): string {
    if (s >= 80) return '#2ed573';
    if (s >= 60) return '#ffa502';
    return '#ff4757';
  }

  private getVibe(): string {
    const elements = this.squadMembers.map(m => ELEMENTS[m.sign] ?? 'Air');
    const counts: Record<string, number> = { Fire:0, Earth:0, Air:0, Water:0 };
    elements.forEach(e => counts[e]++);
    const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];
    const vibes: Record<string, string> = {
      Fire:  '🔥 High-Energy Trailblazers — Bold, passionate, always on the move',
      Earth: '🌍 Grounded Builders — Reliable, practical, in it for the long haul',
      Air:   '💨 Ideas Factory — Intellectual, communicative, endlessly curious',
      Water: '🌊 Intuitive Collective — Deeply empathetic, emotionally intelligent'
    };
    return vibes[dominant] ?? '✨ Uniquely Diverse Collective';
  }

  private getAdvice(): string {
    if (this.groupScore >= 80) return 'This squad has exceptional natural synergy. Trust your collective instincts — you bring out the best in each other. Work on joint creative projects for maximum impact.';
    if (this.groupScore >= 65) return 'Good compatibility with some interesting friction that sparks creativity. Leverage your differences — your diverse energies make the group more resilient and adaptive.';
    return 'A dynamically challenging group — but the most transformative squads are often the most diverse. Respect each other\'s fundamentally different approaches; your contrasts make you stronger.';
  }

  async shareCard(): Promise<void> {
    if (!this.resultCard) return;
    this.sharing = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(this.resultCard.nativeElement, {
        backgroundColor: '#0a0f1e',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link    = document.createElement('a');
      link.download = `squad-compat-${new Date().toISOString().slice(0,10)}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
      this.shared = true;
    } catch (e) { console.error(e); }
    this.sharing = false;
  }
}
