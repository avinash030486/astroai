import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { DailyHoroscopeScreen } from '../screens/DailyHoroscopeScreen';
import { PanchangScreen } from '../screens/PanchangScreen';
import { CityPanchangScreen } from '../screens/CityPanchangScreen';
import { YogasScreen } from '../screens/YogasScreen';
import { YearlyHoroscopeScreen } from '../screens/YearlyHoroscopeScreen';
import { BirthChartScreen } from '../screens/BirthChartScreen';
import { RemediesScreen } from '../screens/RemediesScreen';
import { NumerologyScreen } from '../screens/NumerologyScreen';
import { MatchmakingScreen } from '../screens/MatchmakingScreen';
import { AskAIScreen } from '../screens/AskAIScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { user, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="DailyHoroscope" component={DailyHoroscopeScreen} />
          <Stack.Screen name="Panchang" component={PanchangScreen} />
          <Stack.Screen name="CityPanchang" component={CityPanchangScreen} />
          <Stack.Screen name="Yogas" component={YogasScreen} />
          <Stack.Screen name="YearlyHoroscope" component={YearlyHoroscopeScreen} />
          <Stack.Screen name="BirthChart" component={BirthChartScreen} />
          <Stack.Screen name="Remedies" component={RemediesScreen} />
          <Stack.Screen name="Numerology" component={NumerologyScreen} />
          <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
          <Stack.Screen name="AskAI" component={AskAIScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
