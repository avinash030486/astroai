import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StarField } from '../components/StarField';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const displayName = user?.email?.split('@')[0] ?? 'Cosmic Seeker';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
      <StarField />
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Astrology Tools</Text>
        {[
          { label: '☀️  Daily Horoscope', screen: 'DailyHoroscope' },
          { label: '📅  Panchang', screen: 'Panchang' },
          { label: '🌍  City Panchang', screen: 'CityPanchang' },
          { label: '✨  Yogas', screen: 'Yogas' },
          { label: '📊  Yearly Horoscope', screen: 'YearlyHoroscope' },
          { label: '🔮  Birth Chart', screen: 'BirthChart' },
          { label: '💊  Remedies', screen: 'Remedies' },
          { label: '🔢  Numerology', screen: 'Numerology' },
          { label: '❤️  Matchmaking', screen: 'Matchmaking' },
        ].map(item => (
          <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 70, paddingBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(201,150,58,0.15)',
    borderWidth: 2, borderColor: theme.colors.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 32 },
  name: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 22 },
  email: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.goldDim },
  menuLabel: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14 },
  menuArrow: { color: theme.colors.gold, fontSize: 18 },
  signOutBtn: { backgroundColor: 'rgba(231,76,60,0.12)', borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c44' },
  signOutText: { color: '#e74c3c', fontFamily: theme.fonts.bodyBold, fontSize: 15 },
});
