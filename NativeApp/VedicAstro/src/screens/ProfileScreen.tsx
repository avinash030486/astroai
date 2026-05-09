import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarField } from '../components/StarField';
import { DatePickerField } from '../components/DatePickerField';
import { TimePickerField } from '../components/TimePickerField';
import { PlaceInput } from '../components/PlaceInput';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { theme } from '../theme/theme';

const ASTRO_TOOLS = [
  { label: '☀️  Daily Horoscope', screen: 'DailyHoroscope' },
  { label: '📅  Panchang', screen: 'Panchang' },
  { label: '🌍  City Panchang', screen: 'CityPanchang' },
  { label: '✨  Yogas', screen: 'Yogas' },
  { label: '📊  Yearly Horoscope', screen: 'YearlyHoroscope' },
  { label: '🔮  Birth Chart', screen: 'BirthChart' },
  { label: '💊  Remedies', screen: 'Remedies' },
  { label: '🔢  Numerology', screen: 'Numerology' },
  { label: '❤️  Matchmaking', screen: 'Matchmaking' },
];

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { profile, loading, saving, error, loadProfile, updateProfile, clearProfile } = useProfileStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    time_of_birth: '',
    birth_place_label: '',
  });
  const [toast, setToast] = useState('');

  // Load profile when user is available
  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id, user.email, user.name);
    }
  }, [user?.id]);

  // Pre-fill form whenever profile data arrives
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        time_of_birth: profile.time_of_birth ?? '',
        birth_place_label: profile.birth_place_label ?? '',
      });
    }
  }, [profile]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: () => {
          clearProfile();
          signOut();
        },
      },
    ]);
  };

  const handleSave = async () => {
    const success = await updateProfile(form);
    if (success) {
      setEditing(false);
      setToast('✅ Profile saved!');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleCancelEdit = () => {
    // Restore form to last saved state
    setForm({
      full_name: profile?.full_name ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
      time_of_birth: profile?.time_of_birth ?? '',
      birth_place_label: profile?.birth_place_label ?? '',
    });
    setEditing(false);
  };

  const displayName = profile?.full_name || user?.name || user?.email?.split('@')[0] || 'Cosmic Seeker';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <LinearGradient colors={[theme.colors.navy, theme.colors.navyLight]} style={styles.root}>
      <StarField />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </View>

        {/* ── Birth Details ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Birth Details</Text>
            {!editing && !loading && (
              <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.editLink}>✏️  Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 20 }} />
            </View>
          ) : editing ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={form.full_name}
                onChangeText={v => setForm(f => ({ ...f, full_name: v }))}
                placeholder="Your full name"
                placeholderTextColor={theme.colors.textSecondary}
                autoCorrect={false}
              />

              <DatePickerField
                label="Date of Birth"
                value={form.date_of_birth}
                onChangeText={v => setForm(f => ({ ...f, date_of_birth: v }))}
                maximumDate={new Date()}
              />

              <TimePickerField
                label="Time of Birth"
                value={form.time_of_birth}
                onChangeText={v => setForm(f => ({ ...f, time_of_birth: v }))}
              />

              <PlaceInput
                label="Birth Place"
                value={form.birth_place_label}
                onChangeText={v => setForm(f => ({ ...f, birth_place_label: v }))}
                placeholder="City, Country"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={theme.colors.navy} />
                    : <Text style={styles.saveBtnText}>Save Profile</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelEdit}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              {[
                { label: 'Name', value: profile?.full_name },
                { label: 'Date of Birth', value: profile?.date_of_birth },
                { label: 'Time of Birth', value: profile?.time_of_birth },
                { label: 'Birth Place', value: profile?.birth_place_label },
              ].map((row, idx, arr) => (
                <View
                  key={row.label}
                  style={[styles.detailRow, idx < arr.length - 1 && styles.detailRowBorder]}
                >
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value || '—'}</Text>
                </View>
              ))}
            </View>
          )}

          {toast ? <Text style={styles.toast}>{toast}</Text> : null}
        </View>

        {/* ── Astrology Tools ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Astrology Tools</Text>
          {ASTRO_TOOLS.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  editLink: { color: theme.colors.gold, fontFamily: theme.fonts.body, fontSize: 13 },

  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.xl,
    padding: 16, borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  detailLabel: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13 },
  detailValue: {
    color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 13,
    flexShrink: 1, textAlign: 'right', marginLeft: 8,
  },

  fieldLabel: {
    color: theme.colors.textSecondary, fontFamily: theme.fonts.body,
    fontSize: 12, marginBottom: 4, marginTop: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.goldDim,
    color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4,
  },
  errorText: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 6 },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  saveBtn: {
    flex: 1, backgroundColor: theme.colors.gold, borderRadius: theme.radius.md,
    paddingVertical: 13, alignItems: 'center',
  },
  saveBtnText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  cancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: theme.radius.md,
    paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  cancelBtnText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 14 },

  toast: {
    color: theme.colors.gold, fontFamily: theme.fonts.body,
    fontSize: 13, textAlign: 'center', marginTop: 10,
  },

  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.goldDim,
  },
  menuLabel: { color: theme.colors.textPrimary, fontFamily: theme.fonts.body, fontSize: 14 },
  menuArrow: { color: theme.colors.gold, fontSize: 18 },

  signOutBtn: {
    backgroundColor: 'rgba(231,76,60,0.12)', borderRadius: theme.radius.md,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c44',
  },
  signOutText: { color: '#e74c3c', fontFamily: theme.fonts.bodyBold, fontSize: 15 },
});
