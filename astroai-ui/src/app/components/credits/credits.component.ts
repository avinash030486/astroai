import { Component, OnInit } from '@angular/core';
import { CreditsService, CreditTransaction } from '../../services/credits.service';
import { ReferralService } from '../../services/referral.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.scss']
})
export class CreditsComponent implements OnInit {

  copied = false;
  referralLink = '';
  referralCode = '';

  constructor(
    public credits: CreditsService,
    public referral: ReferralService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.credits.loadCredits();
    this.referralLink = this.referral.getReferralLink();
    this.referralCode = this.referral.getReferralCode();
  }

  async copyLink(): Promise<void> {
    const ok = await this.referral.copyReferralLink();
    if (ok) {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    }
  }

  shareWhatsApp(): void {
    this.referral.shareOnWhatsApp();
  }

  txIcon(type: string): string {
    return type === 'spend' ? '↓' : '↑';
  }

  txColor(type: string): string {
    if (type === 'spend') return 'var(--error)';
    if (type.startsWith('referral')) return 'var(--teal)';
    return 'var(--gold)';
  }
}
