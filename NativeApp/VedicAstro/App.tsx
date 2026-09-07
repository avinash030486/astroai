import React, { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_300Light,
} from '@expo-google-fonts/dm-sans';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { theme } from './src/theme/theme';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const { handleOAuthRedirect, storePendingReferral } = useAuthStore();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_300Light,
  });

  // Handle deep link OAuth redirect from the web app relay
  useEffect(() => {
    // Handle the case where the app was opened by the deep link (cold start)
    Linking.getInitialURL().then(url => {
      if (url && url.includes('code=')) {
        handleOAuthRedirect(url);
      }
      // Store referral code if present (e.g. vedicastro://...?ref=VA12345678)
      if (url) {
        const refMatch = url.match(/[?&]ref=([^&#]+)/);
        if (refMatch) storePendingReferral(refMatch[1]);
      }
    });
    // Handle deep links while app is already running (foreground)
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('code=')) {
        handleOAuthRedirect(url);
      }
      const refMatch = url?.match(/[?&]ref=([^&#]+)/);
      if (refMatch) storePendingReferral(refMatch[1]);
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.navy} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
