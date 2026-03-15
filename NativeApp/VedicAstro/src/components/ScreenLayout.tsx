import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { StarField } from '../components/StarField';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
}

export const ScreenLayout: React.FC<Props> = ({ title, subtitle, children, onBack }) => (
  <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
    <StarField />
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.goldDim,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backArrow: { color: theme.colors.gold, fontSize: 22 },
  titleWrap: { flex: 1 },
  title: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 22 },
  subtitle: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  content: { padding: 20, paddingBottom: 40 },
});
