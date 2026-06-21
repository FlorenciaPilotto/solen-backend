import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/client';
import { colors, spacing, radius, fonts } from '../theme';

export function RegisterScreen() {
  const nav = useNavigation<any>();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setError('');
    if (!name || !email || !password) { setError(t('auth.fillFields')); return; }
    setLoading(true);
    try { await signUp(email.trim().toLowerCase(), password, name.trim()); }
    catch (e) { setError(getApiError(e)); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>{t('auth.appName')}</Text>
        <Text style={s.tag}>{t('auth.register.subtitle')}</Text>
        <TextInput style={s.input} placeholder={t('auth.register.name')} placeholderTextColor={colors.textHint} value={name} onChangeText={setName} autoCapitalize="words" />
        <TextInput style={s.input} placeholder={t('auth.login.email')} placeholderTextColor={colors.textHint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder={t('auth.register.passwordHint')} placeholderTextColor={colors.textHint} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
          {loading ? <ActivityIndicator color="#000000" /> : <Text style={s.btnTxt}>{t('auth.register.submit')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Login')}>
          <Text style={s.link}>{t('auth.register.hasAccount')} <Text style={s.linkAccent}>{t('auth.register.signIn')}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  logo: { fontSize: 40, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5, textAlign: 'center' },
  tag: { fontSize: 13, fontWeight: fonts.medium, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  input: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, fontSize: 16, fontWeight: fonts.light, color: colors.textPrimary },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  btnTxt: { fontSize: 16, fontWeight: fonts.medium, color: '#000000' },
  link: { fontSize: 13, fontWeight: fonts.light, color: colors.textSecondary, textAlign: 'center' },
  linkAccent: { color: colors.accent, fontWeight: fonts.medium },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
});
