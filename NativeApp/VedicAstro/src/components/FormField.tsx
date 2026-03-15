import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../theme/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const FormField: React.FC<Props> = ({ label, error, ...rest }) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error ? styles.inputError : null]}
      placeholderTextColor={theme.colors.textSecondary}
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  inputError: { borderColor: '#e74c3c' },
  error: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 11, marginTop: 4 },
});
