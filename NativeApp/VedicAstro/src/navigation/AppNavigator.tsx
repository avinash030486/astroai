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
import { TransitAlertsScreen } from '../screens/TransitAlertsScreen';
import { MuhuratScreen } from '../screens/MuhuratScreen';
import { GemstoneScreen } from '../screens/GemstoneScreen';
import { FestivalCalendarScreen } from '../screens/FestivalCalendarScreen';
import { ARSkyGuideScreen } from '../screens/ARSkyGuideScreen';
import { VedicVRScreen } from '../screens/VedicVRScreen';
import { BirthChartRoomScreen } from '../screens/BirthChartRoomScreen';
import { CosmosMeditationScreen } from '../screens/CosmosMeditationScreen';
import { DashaTimelineScreen } from '../screens/DashaTimelineScreen';
import { PalmistryScreen } from '../screens/PalmistryScreen';
import { PastLifeScreen } from '../screens/PastLifeScreen';
import { GrahaGazingScreen } from '../screens/GrahaGazingScreen';
import { CreditsScreen } from '../screens/CreditsScreen';
import { ARNakshatraAuraScreen } from '../screens/ARNakshatraAuraScreen';
import { ARGemstoneScreen } from '../screens/ARGemstoneScreen';
import { SoulSketchScreen } from '../screens/SoulSketchScreen';
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
          <Stack.Screen name="TransitAlerts" component={TransitAlertsScreen} />
          <Stack.Screen name="Muhurat" component={MuhuratScreen} />
          <Stack.Screen name="Gemstone" component={GemstoneScreen} />
          <Stack.Screen name="FestivalCalendar" component={FestivalCalendarScreen} />
          <Stack.Screen name="ARSkyGuide" component={ARSkyGuideScreen} />
          <Stack.Screen name="VedicVR" component={VedicVRScreen} />
          <Stack.Screen name="BirthChartRoom" component={BirthChartRoomScreen} />
          <Stack.Screen name="CosmosMeditation" component={CosmosMeditationScreen} />
          <Stack.Screen name="DashaTimeline" component={DashaTimelineScreen} />
          <Stack.Screen name="Palmistry" component={PalmistryScreen} />
          <Stack.Screen name="PastLife" component={PastLifeScreen} />
          <Stack.Screen name="GrahaGazing" component={GrahaGazingScreen} />
          <Stack.Screen name="Credits" component={CreditsScreen} />
          <Stack.Screen name="ARNakshatraAura" component={ARNakshatraAuraScreen} />
          <Stack.Screen name="ARGemstone" component={ARGemstoneScreen} />
          <Stack.Screen name="SoulSketch" component={SoulSketchScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
