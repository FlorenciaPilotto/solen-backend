import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { saveMorningJournal } from '../store/storage';
import { colors, spacing, radius, fonts } from '../theme';

type Step = 'energia' | 'intencion' | 'identidad';
const STEPS: Step[] = ['energia', 'intencion', 'identidad'];

export function JournalScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [step, setStep]           = useState<Step>('energia');
  const [energia, setEnergia]     = useState(70);
  const [intencion, setIntencion] = useState('');
  const [identidad, setIdentidad] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const stepIdx      = STEPS.indexOf(step);
  const energiaLabel = energia >= 70
    ? t('journal.energy.high')
    : energia >= 40
      ? t('journal.energy.medium')
      : t('journal.energy.low');
  const energiaColor = energia >= 70
    ? colors.creacion.primary
    : energia >= 40
      ? colors.pineal.primary
      : colors.supervivencia.primary;

  const handleSave = async () => {
    if (!identidad.trim()) { setError(t('journal.identity.error')); return; }
    setSaving(true); setError('');
    try {
      await saveMorningJournal({ energia, intencion: intencion || '—', identidad });
      navigation.goBack();
    } catch {
      setError(t('journal.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const dots = STEPS.map((s, i) => (
    <View
      key={s}
      style={[styles.dot, i === stepIdx && styles.dotActive, i < stepIdx && styles.dotDone]}
    />
  ));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>{t('journal.title')}</Text>
      <Text style={styles.subtitulo}>{t('journal.subtitle')}</Text>

      <View style={styles.dotsRow}>{dots}</View>

      {step === 'energia' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>{t('journal.energy.label')}</Text>
          <Text style={styles.stepQ}>{t('journal.energy.question')}</Text>

          <View style={styles.energiaDisplay}>
            <Text style={[styles.energiaNum, { color: energiaColor }]}>{energia}</Text>
            <Text style={[styles.energiaLabel, { color: energiaColor }]}>{energiaLabel}</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0} maximumValue={100} step={1}
            value={energia} onValueChange={setEnergia}
            minimumTrackTintColor={energiaColor}
            maximumTrackTintColor={colors.border}
            thumbTintColor={energiaColor}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderEnd}>{t('journal.energy.sliderLow')}</Text>
            <Text style={styles.sliderEnd}>{t('journal.energy.sliderHigh')}</Text>
          </View>

          <TouchableOpacity style={styles.btnNext} onPress={() => setStep('intencion')}>
            <Text style={styles.btnNextText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'intencion' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>{t('journal.intention.label')}</Text>
          <Text style={styles.stepQ}>{t('journal.intention.question')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('journal.intention.placeholder')}
            placeholderTextColor={colors.textHint}
            value={intencion}
            onChangeText={setIntencion}
            multiline
            numberOfLines={3}
            autoFocus
          />

          <TouchableOpacity style={styles.btnNext} onPress={() => setStep('identidad')}>
            <Text style={styles.btnNextText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'identidad' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>{t('journal.identity.label')}</Text>
          <Text style={styles.stepQ}>{t('journal.identity.question')}</Text>

          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder={t('journal.identity.placeholder')}
            placeholderTextColor={colors.textHint}
            value={identidad}
            onChangeText={v => { setIdentidad(v); setError(''); }}
            multiline
            numberOfLines={4}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.btnNext}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.btnNextText}>{saving ? t('common.saving') : t('journal.start')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xxl },
  back:       { position: 'absolute', top: spacing.xl, right: spacing.lg, zIndex: 10 },
  backText:   { fontSize: 16, color: colors.textMuted },
  titulo:     { fontSize: 28, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 34, marginBottom: 4 },
  subtitulo:  { fontSize: 11, fontWeight: fonts.light, color: colors.textHint, marginBottom: spacing.xl },
  dotsRow:    { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  dot:        { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.border },
  dotActive:  { width: 16, height: 5, borderRadius: 3, backgroundColor: colors.creacion.primary },
  dotDone:    { backgroundColor: colors.accentMuted },
  stepWrap:   { gap: spacing.md },
  stepLabel:  { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 2 },
  stepQ:      { fontSize: 18, fontWeight: fonts.light, color: colors.textSecondary, lineHeight: 26 },
  energiaDisplay: { alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  energiaNum:     { fontSize: 52, fontWeight: fonts.light, lineHeight: 56 },
  energiaLabel:   { fontSize: 12, fontWeight: fonts.medium },
  slider:       { width: '100%' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEnd:    { fontSize: 9, fontWeight: fonts.light, color: colors.textHint },
  input: {
    backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder,
    borderRadius: radius.md, padding: spacing.md, fontSize: 13, fontWeight: fonts.light,
    color: colors.textPrimary, lineHeight: 20,
  },
  inputLarge: { minHeight: 100 },
  errorText:  { fontSize: 12, color: colors.supervivencia.primary },
  btnNext:     { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnNextText: { fontSize: 16, fontWeight: fonts.medium, color: '#000000' },
});
