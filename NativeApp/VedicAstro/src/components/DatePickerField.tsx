import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { theme } from '../theme/theme';

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  androidDisplay?: 'default' | 'spinner' | 'calendar';
}

function parseYMD(str: string): Date {
  if (str) {
    const [y, m, d] = str.split('-').map(Number);
    if (y > 0 && m > 0 && d > 0) return new Date(y, m - 1, d);
  }
  return new Date(1990, 0, 15);
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DatePickerField: React.FC<Props> = ({
  label, value, onChangeText, placeholder = 'Select date', error, maximumDate, minimumDate,
  androidDisplay = 'default',
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => parseYMD(value));

  const openPicker = () => {
    setTempDate(parseYMD(value));
    setShow(true);
  };

  const onAndroidChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShow(false);
    if (selected) onChangeText(toYMD(selected));
  };

  const onIOSChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const confirmIOS = () => {
    onChangeText(toYMD(tempDate));
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
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Android: native dialog auto-opens when rendered */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={parseYMD(value)}
          mode="date"
          display={androidDisplay}
          onChange={onAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
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
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onIOSChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
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
