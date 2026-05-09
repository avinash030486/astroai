import { useEffect } from 'react';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';

/**
 * Loads the user's saved profile (if not already loaded) and returns
 * pre-filled birth detail values ready to drop into any form state.
 */
export function useProfileAutofill() {
  const { profile, loading: profileLoading, loadProfile } = useProfileStore();
  const { user } = useAuthStore();

  // Trigger load if profile not yet fetched
  useEffect(() => {
    if (user?.id && !profile && !profileLoading) {
      loadProfile(user.id, user.email, user.name);
    }
  }, [user?.id]);

  return {
    profileLoading,
    autofill: {
      name:         profile?.full_name        ?? '',
      dateOfBirth:  profile?.date_of_birth    ?? '',
      timeOfBirth:  profile?.time_of_birth    ?? '',
      placeOfBirth: profile?.birth_place_label ?? '',
    },
  };
}
