import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { FormField } from '../components/FormField';
import { PlaceInput } from '../components/PlaceInput';
import { PaymentModal, PlanOption } from '../components/PaymentModal';
import { horoscopeApi, paymentsApi } from '../api/services';
import { theme } from '../theme/theme';

const MAX_FREE_QUESTIONS = 1;

const QNA_PLANS: PlanOption[] = [
  { id: 'qna-10',        label: '10 Questions',  price: '$3.00', amountUsd: 3.00, note: '10 AI answers' },
  { id: 'qna-unlimited', label: 'Unlimited',      price: '$10.00', amountUsd: 10.00, note: 'Ask anything', popular: true },
];

interface Message { role: 'user' | 'ai'; text: string }

export const AskAIScreen: React.FC = () => {
  const navigation = useNavigation();
  const [question, setQuestion]     = useState('');
  const [name, setName]             = useState('');
  const [birthDate, setBirthDate]   = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [hasPaid, setHasPaid]               = useState(false);
  const [showPayment, setShowPayment]       = useState(false);
  const [paymentError, setPaymentError]     = useState('');

  const canAsk = hasPaid || questionsAsked < MAX_FREE_QUESTIONS;

  const ask = async () => {
    if (!question.trim()) { setError('Please enter a question.'); return; }
    if (!canAsk) { setShowPayment(true); return; }

    const q = question.trim();
    setMessages(m => [...m, { role: 'user', text: q }]);
    setQuestion('');
    setError(''); setLoading(true);
    try {
      const data = await horoscopeApi.ask({ question: q, name, dateOfBirth: birthDate, timeOfBirth, placeOfBirth: birthPlace });
      const reply = data?.answer ?? data?.prediction ?? data?.response ?? JSON.stringify(data);
      setMessages(m => [...m, { role: 'ai', text: reply }]);
      setQuestionsAsked(n => n + 1);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'ai', text: '⚠️ ' + (e.message || 'Something went wrong.') }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (pmId: string, planId: string, amountUsd: number, name: string, email: string) => {
    const res = await paymentsApi.chargeForQNA({ plan: planId, amountUsd, name, email, paymentMethodId: pmId });
    if (!res.success) throw new Error(res.error ?? 'Payment failed. Please try again.');
    setHasPaid(true);
    setShowPayment(false);
    setPaymentError('');
  };

  return (
    <ScreenLayout title="Ask AI Astrologer" subtitle="Get cosmic guidance" onBack={() => navigation.goBack()}>
      {loading && <LoadingOverlay message="Consulting the cosmos…" />}

      <FormField label="Your Name (optional)" value={name} onChangeText={setName} placeholder="Your name" />
      <FormField label="Your Date of Birth (optional)" value={birthDate} onChangeText={setBirthDate} placeholder="1990-01-15" />
      <FormField label="Time of Birth (optional)" value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder="06:30" />
      <PlaceInput label="Your Birthplace (optional)" value={birthPlace} onChangeText={setBirthPlace} placeholder="Delhi, India" />

      {messages.length > 0 && (
        <View style={styles.chatBox}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={[styles.bubbleText, m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI]}>
                {m.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Free question counter */}
      {!hasPaid && questionsAsked > 0 && (
        <Text style={styles.freeNote}>
          {MAX_FREE_QUESTIONS - questionsAsked > 0
            ? `${MAX_FREE_QUESTIONS - questionsAsked} free question remaining`
            : 'Free limit reached'}
        </Text>
      )}

      {/* Paywall prompt after free limit */}
      {!hasPaid && questionsAsked >= MAX_FREE_QUESTIONS && (
        <LinearGradient colors={['rgba(201,150,58,0.15)', 'rgba(201,150,58,0.04)']} style={styles.paywall}>
          <Text style={styles.paywallTitle}>🌟 Continue Asking</Text>
          <Text style={styles.paywallText}>Unlock more questions to get personalised cosmic guidance</Text>
          {paymentError ? <Text style={styles.payError}>{paymentError}</Text> : null}
          <TouchableOpacity style={styles.paywallBtn} onPress={() => setShowPayment(true)}>
            <Text style={styles.paywallBtnText}>Unlock Questions from $3.00</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormField
        label="Your Question"
        value={question}
        onChangeText={setQuestion}
        placeholder="Ask anything about your chart, life path, timing…"
        multiline
        numberOfLines={3}
      />
      <PrimaryButton
        label={canAsk ? 'Ask the Stars' : 'Unlock & Ask'}
        onPress={ask}
        loading={loading}
      />

      <PaymentModal
        visible={showPayment}
        title="Unlock AI Answers"
        subtitle="Choose a Q&A package for personalised astrology guidance"
        plans={QNA_PLANS}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  chatBox: { marginBottom: 20 },
  bubble: { borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, maxWidth: '90%' },
  bubbleUser: { backgroundColor: 'rgba(201,150,58,0.15)', alignSelf: 'flex-end', borderWidth: 1, borderColor: theme.colors.gold + '44' },
  bubbleAI: { backgroundColor: theme.colors.card, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.goldDim },
  bubbleText: { fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: theme.colors.textPrimary },
  bubbleTextAI: { color: theme.colors.textPrimary },
  freeNote: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  paywall: { borderRadius: theme.radius.xl, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.goldDim, marginBottom: 16 },
  paywallTitle: { color: theme.colors.gold, fontFamily: theme.fonts.heading, fontSize: 18, marginBottom: 6 },
  paywallText: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  paywallBtn: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingVertical: 10, paddingHorizontal: 24 },
  paywallBtnText: { color: theme.colors.navy, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  payError: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 12, marginBottom: 8 },
  error: { color: theme.colors.error, fontFamily: theme.fonts.body, fontSize: 13, marginBottom: 12 },
});
