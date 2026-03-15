import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, FlatList,
} from 'react-native';
import { geoApi } from '../api/services';
import { theme } from '../theme/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}

export const PlaceInput: React.FC<Props> = ({ label, value, onChangeText, placeholder }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
      if (timer.current) clearTimeout(timer.current);
      if (text.length < 3) { setSuggestions([]); return; }
      timer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await geoApi.autocomplete(text);
          setSuggestions(results.map(r => r.description));
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [onChangeText],
  );

  const select = (desc: string) => {
    onChangeText(desc);
    setSuggestions([]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder ?? 'City, Country'}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator size="small" color={theme.colors.gold} style={styles.spinner} />
        )}
      </View>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(_, i) => String(i)}
          keyboardShouldPersistTaps="always"
          style={styles.dropdown}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.item, index < suggestions.length - 1 && styles.itemBorder]}
              onPress={() => select(item)}
            >
              <Text style={styles.itemText}>📍 {item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, zIndex: 10 },
  label: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
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
  spinner: { position: 'absolute', right: 14 },
  dropdown: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    borderRadius: theme.radius.md,
    marginTop: 2,
    maxHeight: 220,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  item: { paddingHorizontal: 14, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.goldDim + '66' },
  itemText: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14 },
});
