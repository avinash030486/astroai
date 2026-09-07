import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { theme } from '../theme/theme';

interface Props {
  label: string;
  value: string; // HH:MM
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
}

function parseHHMM(str: string): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  if (str) {
    const [h, m] = str.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      date.setHours(h, m, 0, 0);
      return date;
    }
  }
  // Default: current time (not hardcoded 6am)
  return date;
}

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const TimePickerField: React.FC<Props> = ({
  label, value, onChangeText, placeholder = 'Select time', error,
}) => {
  const [show, setShow] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(() => parseHHMM(value));

  const openPicker = () => {
    setTempTime(parseHHMM(value));
    setShow(true);
  };

  const onAndroidChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShow(false);
    if (selected) onChangeText(toHHMM(selected));
  };

  const onIOSChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempTime(selected);
  };

  const confirmIOS = () => {
    onChangeText(toHHMM(tempTime));
    setShow(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={openPicker}
        activeOpacity={0.75}
      >
        <Text style={value ? styles.valueText : styles.placeholder}>{value || placeholder}</Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Android: native time dialog */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={parseHHMM(value)}
          mode="time"
          display="default"
          onChange={onAndroidChange}
          is24Hour
        />
      )}

      {/* iOS: bottom-sheet modal with spinner */}
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={show} onRequestClose={() => setShow(false)}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{label}</Text>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={onIOSChange}
                is24Hour
                style={styles.picker}
                textColor={theme.colors.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: { borderColor: '#e74c3c' },
  valueText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
  },
  placeholder: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
  },
  icon: { fontSize: 16 },
  errorText: { color: '#e74c3c', fontFamily: theme.fonts.body, fontSize: 11, marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: theme.colors.navyCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.goldDim,
  },
  sheetTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cancelBtn: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 15 },
  doneBtn: { color: theme.colors.gold, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  picker: { backgroundColor: theme.colors.navyCard },
});
