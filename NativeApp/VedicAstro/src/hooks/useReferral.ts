import { useCallback } from 'react';
import { Share, Clipboard, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

const BASE_URL = 'https://vedicastro.app';

/** Derives a referral code from the user's UUID — consistent, no extra DB call. */
export function useReferral() {
  const { user } = useAuthStore();

  const referralCode = user?.id ? `VA${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}` : '';
  const referralLink = referralCode ? `${BASE_URL}/?ref=${referralCode}` : '';

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    Clipboard.setString(referralLink);
    Alert.alert('Copied!', 'Your referral link has been copied.');
  }, [referralLink]);

  const shareLink = useCallback(async () => {
    if (!referralLink) return;
    const message =
      `✨ Discover your Vedic destiny with VedicAstro!\n\n` +
      `Get personalised birth chart readings, daily horoscope, palmistry, past life insights and more.\n\n` +
      `Join using my link and get $2 free credit: ${referralLink}`;
    await Share.share({ message, url: referralLink });
  }, [referralLink]);

  return { referralCode, referralLink, copyLink, shareLink };
}
