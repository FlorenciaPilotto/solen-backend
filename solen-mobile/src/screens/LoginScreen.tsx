import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../api/client';
import { colors, spacing, radius, fonts } from '../theme';

export function LoginScreen() {
  const nav = useNavigation<any>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setError('');
    if (!email || !password) { setError('Completá todos los campos.'); return; }
    setLoading(true);
    try { await signIn(email.trim().toLowerCase(), password); }
    catch (e: any) {
      const url = e?.config?.url ?? 'sin URL';
      setError(`${getApiError(e)} | URL: ${url}`);
    }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.logo}>Solen</Text>
        <Text style={s.tag}>Sistema de Identidad</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textHint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Contraseña" placeholderTextColor={colors.textHint} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
          {loading ? <ActivityIndicator color="#000000" /> : <Text style={s.btnTxt}>Iniciar sesión</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Register')}>
          <Text style={s.link}>¿Primera vez? <Text style={s.linkAccent}>Crear cuenta</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  logo: { fontSize: 40, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5, textAlign: 'center' },
  tag: { fontSize: 13, fontWeight: fonts.medium, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  input: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, fontSize: 16, fontWeight: fonts.light, color: colors.textPrimary },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  btnTxt: { fontSize: 16, fontWeight: fonts.medium, color: '#000000' },
  link: { fontSize: 13, fontWeight: fonts.light, color: colors.textSecondary, textAlign: 'center' },
  linkAccent: { color: colors.accent, fontWeight: fonts.medium },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
});
