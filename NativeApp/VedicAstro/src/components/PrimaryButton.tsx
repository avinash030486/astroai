import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'gold' | 'teal' | 'outline';
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<Props> = ({ label, onPress, loading, variant = 'gold', style }) => {
  const isOutline = variant === 'outline';
  const colors: [string, string] = variant === 'teal'
    ? [theme.colors.teal, '#18A88E']
    : ['#D4A843', theme.colors.gold];

  if (isOutline) {
    return (
      <TouchableOpacity style={[styles.outline, style]} onPress={onPress} activeOpacity={0.75} disabled={loading}>
        <Text style={styles.outlineText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} disabled={loading} style={style}>
      <LinearGradient colors={colors} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {loading
          ? <ActivityIndicator color={theme.colors.navy} />
          : <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { borderRadius: theme.radius.md, paddingVertical: 14, alignItems: 'center' },
  label: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 15, letterSpacing: 0.5 },
  outline: {
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  outlineText: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
});
