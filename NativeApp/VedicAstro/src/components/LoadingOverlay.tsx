import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => (
  <View style={styles.overlay}>
    <ActivityIndicator size="large" color={theme.colors.gold} />
    {message ? <Text style={styles.msg}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,14,26,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  msg: { color: theme.colors.gold, fontFamily: theme.fonts.body, marginTop: 12, fontSize: 14 },
});
