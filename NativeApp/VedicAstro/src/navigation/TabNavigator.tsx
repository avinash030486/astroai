import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { DailyHoroscopeScreen } from '../screens/DailyHoroscopeScreen';
import { AskAIScreen } from '../screens/AskAIScreen';
import { BirthChartScreen } from '../screens/BirthChartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme/theme';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
);

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.navyLight,
        borderTopColor: theme.colors.goldDim,
        borderTopWidth: 1,
        height: 56 + insets.bottom,
        paddingBottom: insets.bottom || 8,
      },
      tabBarActiveTintColor: theme.colors.gold,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarLabelStyle: { fontFamily: theme.fonts.body, fontSize: 10, marginTop: -4 },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />, tabBarLabel: 'Home' }} />
    <Tab.Screen name="Horoscope" component={DailyHoroscopeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="☀️" focused={focused} />, tabBarLabel: 'Horoscope' }} />
    <Tab.Screen name="Ask" component={AskAIScreen} options={{
      tabBarIcon: ({ focused }) => (
        <View style={[styles.askTab, focused && styles.askTabActive]}>
          <Text style={{ fontSize: 22 }}>🔮</Text>
        </View>
      ),
      tabBarLabel: '',
    }} />
    <Tab.Screen name="Chart" component={BirthChartScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🌐" focused={focused} />, tabBarLabel: 'Chart' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />, tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  askTab: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: theme.colors.card,
    borderWidth: 2, borderColor: theme.colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  askTabActive: { borderColor: theme.colors.gold, backgroundColor: 'rgba(201,150,58,0.15)' },
});
