import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCreditsStore } from '../store/creditsStore';
import { theme } from '../theme/theme';

interface Props {
  onPress?: () => void;
}

export const CreditsBadge: React.FC<Props> = ({ onPress }) => {
  const balance = useCreditsStore(s => s.balance);
  if (balance <= 0) return null;

  return (
    <TouchableOpacity style={styles.badge} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.icon}>💰</Text>
      <Text style={styles.text}>${balance.toFixed(2)} Credits</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.goldPale,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 12 },
  text: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
  },
});
