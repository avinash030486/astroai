/**
 * PaymentModal – reusable Stripe card payment sheet for Expo Go.
 *
 * Because @stripe/stripe-react-native requires a native development build,
 * we tokenise the card directly against Stripe's REST API using the
 * publishable key, then pass the resulting PaymentMethod ID to our backend.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { useCurrency } from '../hooks/useCurrency';

const STRIPE_PK =
  'pk_live_51SkYakPpSmZFXw4WZvXp8z7nLyOJmZReFnCtSqUnolgOWoDInuY8FhcJ0HRdbU5pKr3PLFSAj1ACkyktccWcdWmI00WrSAKFpD';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlanOption {
  id: string;
  label: string;
  price: string;      // display string e.g. "$3.99"
  amountUsd: number;
  note?: string;
  popular?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** If provided a plan selector is shown */
  plans?: PlanOption[];
  /** Used when no plans array is given */
  fixedAmountUsd?: number;
  /**
   * Called after card tokenisation succeeds.
   * The parent should call the backend charge API here.
   * Throwing causes the modal to display the error message.
   * Resolving causes the modal to stay open until the parent
   * calls onClose().
   */
  onSuccess: (
    pmId: string,
    planId: string,
    amountUsd: number,
    name: string,
    email: string,
  ) => Promise<void>;
  onClose: () => void;
}

// ─── Stripe tokenisation ─────────────────────────────────────────────────────

async function tokenizeCard(
  cardNumber: string,
  expiry: string,
  cvc: string,
): Promise<string> {
  const parts = expiry.split('/');
  const expMonth = (parts[0] ?? '').trim();
  const rawYear = (parts[1] ?? '').trim();
  const expYear = rawYear.length === 2 ? '20' + rawYear : rawYear;

  const params = new URLSearchParams({
    type: 'card',
    'card[number]': cardNumber.replace(/\s/g, ''),
    'card[exp_month]': expMonth,
    'card[exp_year]': expYear,
    'card[cvc]': cvc,
  });

  const resp = await fetch('https://api.stripe.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_PK}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(
      data?.error?.message ?? 'Card declined. Please check your details.',
    );
  }
  return data.id as string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PaymentModal: React.FC<Props> = ({
  visible,
  title,
  subtitle,
  plans,
  fixedAmountUsd,
  onSuccess,
  onClose,
}) => {
  const user = useAuthStore(s => s.user);
  const { currency, format, ready } = useCurrency();

  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill user info and reset card fields whenever modal opens
  useEffect(() => {
    if (visible) {
      setName(n => n || user?.name || '');
      setEmail(e => e || user?.email || '');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setError('');
      setLoading(false);
      if (plans?.length) setSelectedPlan(plans[0]);
    }
  }, [visible]);

  const activePlan = selectedPlan ?? plans?.[0] ?? null;
  const activeAmount = plans ? (activePlan?.amountUsd ?? 0) : (fixedAmountUsd ?? 0);
  const activePlanId = plans ? (activePlan?.id ?? 'one-time') : 'one-time';
  // Always format using detected local currency
  const displayPrice = format(activeAmount);

  const formatCard = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})(?=.)/g, '$1 ');
  };

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const handlePay = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (cardNumber.replace(/\s/g, '').length < 13) { setError('Please enter a valid card number.'); return; }
    if (!expiry.includes('/') || expiry.length < 5) { setError('Enter expiry as MM/YY.'); return; }
    if (cvc.length < 3) { setError('Please enter a valid CVC.'); return; }

    setLoading(true);
    setError('');
    try {
      const pmId = await tokenizeCard(cardNumber, expiry, cvc);
      await onSuccess(pmId, activePlanId, activeAmount, name.trim(), email.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.modal}>
              {/* Close button */}
              <TouchableOpacity
                style={s.closeBtn}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={s.closeX}>✕</Text>
              </TouchableOpacity>

              <Text style={s.title}>{title}</Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

              {/* Currency badge – shown when non-USD */}
              {ready && currency.code !== 'USD' && (
                <View style={s.currencyBadge}>
                  <Text style={s.currencyBadgeText}>💱 Prices shown in {currency.code}</Text>
                </View>
              )}

              {/* Plan selector */}
              {plans && plans.length > 1 && (
                <View style={s.planRow}>
                  {plans.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        s.planCard,
                        activePlan?.id === p.id && s.planCardActive,
                      ]}
                      onPress={() => setSelectedPlan(p)}
                      disabled={loading}
                    >
                      {p.popular && (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>Popular</Text>
                        </View>
                      )}
                      <Text style={s.planLabel}>{p.label}</Text>
                      <Text style={s.planPrice}>{format(p.amountUsd)}</Text>
                      {p.note ? (
                        <Text style={s.planNote}>{p.note}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Single price display */}
              {(!plans || plans.length === 1) && (
                <View style={s.singlePrice}>
                  <Text style={s.singleAmount}>
                    {plans ? format(plans[0].amountUsd) : format(fixedAmountUsd ?? 0)}
                  </Text>
                  <Text style={s.planNote}>
                    {plans ? (plans[0].note ?? 'One-time payment') : 'One-time payment'}
                  </Text>
                </View>
              )}

              {error ? <Text style={s.error}>{error}</Text> : null}

              {/* Card form */}
              <Field
                label="Name on card"
                value={name}
                onChange={setName}
                placeholder="Full name"
                disabled={loading}
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@email.com"
                keyboard="email-address"
                autoCapitalize="none"
                disabled={loading}
              />
              <Field
                label="Card Number"
                value={cardNumber}
                onChange={v => setCardNumber(formatCard(v))}
                placeholder="1234 5678 9012 3456"
                keyboard="number-pad"
                maxLength={19}
                disabled={loading}
              />
              <View style={s.row}>
                <View style={s.halfLeft}>
                  <Field
                    label="Expiry (MM/YY)"
                    value={expiry}
                    onChange={v => setExpiry(formatExpiry(v))}
                    placeholder="MM/YY"
                    keyboard="number-pad"
                    maxLength={5}
                    disabled={loading}
                  />
                </View>
                <View style={s.halfRight}>
                  <Field
                    label="CVC"
                    value={cvc}
                    onChange={v => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    keyboard="number-pad"
                    maxLength={4}
                    secure
                    disabled={loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.payBtn, loading && s.payBtnDisabled]}
                onPress={handlePay}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.navy} />
                ) : (
                  <Text style={s.payBtnText}>🔒 Pay {displayPrice}</Text>
                )}
              </TouchableOpacity>

              <Text style={s.stripe}>🔐 Secure payment via Stripe</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Field helper ────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
  maxLength?: number;
  disabled?: boolean;
  autoCapitalize?: any;
  secure?: boolean;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  maxLength,
  disabled,
  autoCapitalize,
  secure,
}) => (
  <View style={s.field}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={s.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.w30}
      keyboardType={keyboard}
      maxLength={maxLength}
      editable={!disabled}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      secureTextEntry={secure}
    />
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  kav: { width: '100%' },
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.navyMid,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.goldDim,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  closeX: { color: theme.colors.textSecondary, fontSize: 20 },
  title: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  currencyBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(201,150,58,0.15)',
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  currencyBadgeText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.body,
    fontSize: 11,
  },
  // Plans
  planRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  planCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.goldDim,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  planCardActive: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(201,150,58,0.1)',
  },
  badge: {
    backgroundColor: theme.colors.gold,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badgeText: {
    color: theme.colors.navy,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
  },
  planLabel: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  planPrice: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    marginBottom: 2,
  },
  planNote: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 10,
    textAlign: 'center',
  },
  singlePrice: { alignItems: 'center', marginBottom: 14 },
  singleAmount: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    marginBottom: 2,
  },
  // Form
  error: {
    color: theme.colors.error,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  field: { marginBottom: 12 },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.navyCard,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.goldDim,
  },
  row: { flexDirection: 'row' },
  halfLeft: { flex: 1, marginRight: 8 },
  halfRight: { flex: 1 },
  // Pay button
  payBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.lg,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: {
    color: theme.colors.navy,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
  },
  stripe: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
