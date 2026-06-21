import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { coachService, CoachMessage } from '../api/protocols';
import { getApiError } from '../api/client';
import { colors, spacing, radius, fonts } from '../theme';

export function CoachScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await coachService.historial();
      setMessages(data);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await coachService.enviarMensaje(text);
      setMessages(prev => [...prev, data]);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('coach.title')}</Text>
        <Text style={styles.subtitle}>{t('coach.subtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.welcome}>
              <Text style={styles.welcomeText}>{t('coach.welcome')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
                {item.content}
              </Text>
            </View>
          )}
        />
      )}

      {sending && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={styles.typingText}>{t('coach.typing')}</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t('coach.placeholder')}
          placeholderTextColor={colors.textHint}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: fonts.light, color: colors.textPrimary },
  subtitle: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint, marginTop: 2 },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, flexGrow: 1 },
  welcome: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  welcomeText: { fontSize: 14, fontWeight: fonts.light, color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: radius.md },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  bubbleText: { fontSize: 14, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: '#000000' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  typingText: { fontSize: 11, fontWeight: fonts.light, color: colors.textMuted },
  error: { fontSize: 12, fontWeight: fonts.light, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 0.5, borderTopColor: colors.borderSubtle },
  input: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, fontWeight: fonts.light, color: colors.textPrimary, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { fontSize: 18, fontWeight: fonts.medium, color: '#000000' },
});
