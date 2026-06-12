/**
 * IntegrityJournal — Flujo de 3 pantallas rápidas:
 * 1. Emoción: selector de iconos minimalistas
 * 2. Coherencia: slider 1-10
 * 3. Gratitud: campo de texto
 * → Tarjeta de identidad visual al finalizar
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { EmociónDia } from '../domain/entities';
import { colors, spacing, radius, fonts } from '../theme';

type Step = 'intencion' | 'emocion' | 'coherencia' | 'gratitud' | 'tarjeta';

type Intencion = 'procesar' | 'celebrar' | 'soltar' | 'registrar';

const INTENCIONES: { id: Intencion; label: string; descripcion: string; icon: string }[] = [
  { id: 'procesar', label: 'Procesar algo',   descripcion: 'Algo pasó hoy y necesito entenderlo',         icon: '◐' },
  { id: 'celebrar', label: 'Celebrar',        descripcion: 'Logré algo y quiero reconocerlo',             icon: '✦' },
  { id: 'soltar',   label: 'Soltar tensión',  descripcion: 'Necesito bajar revoluciones antes de cerrar', icon: '〜' },
  { id: 'registrar', label: 'Solo registrar', descripcion: 'Check-in neutral, sin nada puntual',          icon: '·' },
];

// Ajusta el enfoque del paso de Emoción según la intención elegida
const EMOCION_SUB: Record<Intencion, string> = {
  procesar:  'Vamos a nombrarla. Nombrarla ayuda a soltarla.',
  celebrar:  'Date un segundo para sentirlo de verdad.',
  soltar:    'Sin juzgar. Solo observar y empezar a soltar.',
  registrar: 'Sin juzgar. Solo observar.',
};

// Frase de contexto para el cierre, según la intención elegida
const CIERRE_SUB: Record<Intencion, string> = {
  procesar:  'Antes de cerrar, buscá algo bueno también — aunque el día haya sido difícil.',
  celebrar:  'Anotá esto para no perderlo.',
  soltar:    'Un par de líneas y soltás el día.',
  registrar: 'Sin presión. Lo que aparezca.',
};

const EMOCIONES: { id: EmociónDia; label: string; descripcion: string; color: string }[] = [
  { id: 'fuego',     label: 'Fuego',     descripcion: 'Determinación · Certeza',     color: '#FF9F0A' },
  { id: 'calma',     label: 'Calma',     descripcion: 'Paz · Enfoque',               color: '#64D2FF' },
  { id: 'gratitud',  label: 'Gratitud',  descripcion: 'Expansión · Bienestar',       color: '#BF5AF2' },
  { id: 'confusion', label: 'Confusión', descripcion: 'Dispersión · Duda',           color: '#8E8E93' },
  { id: 'miedo',     label: 'Miedo',     descripcion: 'Ansiedad · Parálisis',        color: '#FF375F' },
  { id: 'furia',     label: 'Furia',     descripcion: 'Ira · Frustración',           color: '#FF453A' },
];

const EMOCION_ICONS: Record<EmociónDia, string> = {
  fuego: '◈', calma: '◯', gratitud: '◇', confusion: '◌', miedo: '△', furia: '◼',
};

export function IntegrityJournalScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('intencion');
  const [intencion, setIntencion] = useState<Intencion | null>(null);
  const [emocion, setEmocion] = useState<EmociónDia | null>(null);
  const [coherencia, setCoherencia] = useState(5);
  const [gratitud, setGratitud] = useState('');
  const [logro, setLogro] = useState('');

  const selected = emocion ? EMOCIONES.find(e => e.id === emocion) : null;

  const nivelLabel = coherencia >= 8 ? 'Arquitecto en potencia'
    : coherencia >= 6 ? 'Creador activo'
    : coherencia >= 4 ? 'Reactivo'
    : 'Inercia presente';

  const nivelColor = coherencia >= 8 ? '#30D158'
    : coherencia >= 6 ? colors.accent
    : coherencia >= 4 ? '#8E8E93'
    : '#FF453A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      {/* ── STEP 0: Intención ───────────────────────────────────── */}
      {step === 'intencion' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepNum}>01 / 04</Text>
          <Text style={styles.stepTitle}>¿Qué necesitás de este journal hoy?</Text>
          <Text style={styles.stepSub}>Elegí lo que más resuena. Ajusta las preguntas siguientes.</Text>

          <View style={styles.intencionList}>
            {INTENCIONES.map(i => (
              <TouchableOpacity
                key={i.id}
                style={[styles.intencionCard, intencion === i.id && styles.intencionCardActive]}
                onPress={() => setIntencion(i.id)}
              >
                <Text style={[styles.intencionIcon, intencion === i.id && styles.intencionIconActive]}>{i.icon}</Text>
                <View style={styles.intencionTextWrap}>
                  <Text style={[styles.intencionLabel, intencion === i.id && styles.intencionLabelActive]}>{i.label}</Text>
                  <Text style={styles.intencionDesc}>{i.descripcion}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnNext, !intencion && styles.btnDisabled]}
            onPress={() => intencion && setStep('emocion')}
            disabled={!intencion}
          >
            <Text style={styles.btnNextText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── STEP 1: Emoción ─────────────────────────────────────── */}
      {step === 'emocion' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepNum}>02 / 04</Text>
          <Text style={styles.stepTitle}>¿Cuál fue la emoción dominante hoy?</Text>
          <Text style={styles.stepSub}>{intencion ? EMOCION_SUB[intencion] : 'Sin juzgar. Solo observar.'}</Text>

          <View style={styles.emocionGrid}>
            {EMOCIONES.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.emocionCard,
                  emocion === e.id && { borderColor: e.color, backgroundColor: `${e.color}18` },
                ]}
                onPress={() => setEmocion(e.id)}
              >
                <Text style={[styles.emocionIcon, { color: emocion === e.id ? e.color : colors.textMuted }]}>
                  {EMOCION_ICONS[e.id]}
                </Text>
                <Text style={[styles.emocionLabel, { color: emocion === e.id ? e.color : colors.textSecondary }]}>
                  {e.label}
                </Text>
                <Text style={styles.emocionDesc}>{e.descripcion}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnNext, !emocion && styles.btnDisabled]}
            onPress={() => emocion && setStep('coherencia')}
            disabled={!emocion}
          >
            <Text style={styles.btnNextText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── STEP 2: Coherencia ──────────────────────────────────── */}
      {step === 'coherencia' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepNum}>03 / 04</Text>
          <Text style={styles.stepTitle}>¿Cumpliste tu palabra hoy?</Text>
          <Text style={styles.stepSub}>Entre lo que dijiste que harías y lo que hiciste.</Text>

          <View style={styles.coherenciaDisplay}>
            <Text style={[styles.coherenciaNum, { color: nivelColor }]}>{coherencia}</Text>
            <Text style={[styles.coherenciaLevel, { color: nivelColor }]}>{nivelLabel}</Text>
          </View>

          <Slider
            style={styles.coherenciaSlider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={coherencia}
            onValueChange={setCoherencia}
            minimumTrackTintColor={nivelColor}
            maximumTrackTintColor={colors.border}
            thumbTintColor={nivelColor}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>No cumplí</Text>
            <Text style={styles.sliderLabel}>Integridad total</Text>
          </View>

          <TouchableOpacity style={styles.btnNext} onPress={() => setStep('gratitud')}>
            <Text style={styles.btnNextText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── STEP 3: Gratitud + Logro ─────────────────────────────── */}
      {step === 'gratitud' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepNum}>04 / 04</Text>
          <Text style={styles.stepTitle}>Cierre del día</Text>
          <Text style={styles.stepSub}>{intencion ? CIERRE_SUB[intencion] : ''}</Text>

          <Text style={styles.inputLabel}>¿Qué regalo recibiste hoy?</Text>
          <TextInput
            style={styles.input}
            placeholder="una charla, un insight, un café tranquilo..."
            placeholderTextColor={colors.textHint}
            value={gratitud}
            onChangeText={setGratitud}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>¿Qué acción confirmó que ya no sos la persona del pasado?</Text>
          <TextInput
            style={styles.input}
            placeholder="Hoy elegí... a pesar de..."
            placeholderTextColor={colors.textHint}
            value={logro}
            onChangeText={setLogro}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.btnNext, styles.btnFinal]}
            onPress={() => setStep('tarjeta')}
          >
            <Text style={styles.btnNextText}>Generar mi tarjeta →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── TARJETA DE IDENTIDAD ─────────────────────────────────── */}
      {step === 'tarjeta' && selected && (
        <View style={styles.tarjetaWrap}>
          <Text style={styles.stepNum}>Tarjeta de identidad</Text>
          <Text style={styles.tarjetaFecha}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>

          <View style={[styles.tarjeta, { borderColor: selected.color }]}>
            {/* Header */}
            <View style={[styles.tarjetaHeader, { backgroundColor: `${selected.color}18` }]}>
              <Text style={[styles.tarjetaIcon, { color: selected.color }]}>{EMOCION_ICONS[selected.id]}</Text>
              <View>
                <Text style={[styles.tarjetaEmocion, { color: selected.color }]}>{selected.label}</Text>
                <Text style={styles.tarjetaEmocionDesc}>{selected.descripcion}</Text>
              </View>
            </View>

            {/* Coherencia */}
            <View style={styles.tarjetaRow}>
              <Text style={styles.tarjetaRowLabel}>Coherencia del día</Text>
              <View style={styles.tarjetaCoherencia}>
                <View style={[styles.tarjetaCoherenciaBar, { width: `${coherencia * 10}%`, backgroundColor: nivelColor }]} />
              </View>
              <Text style={[styles.tarjetaRowValue, { color: nivelColor }]}>{coherencia}/10 · {nivelLabel}</Text>
            </View>

            {/* Gratitud */}
            {gratitud.trim().length > 0 && (
              <View style={styles.tarjetaSection}>
                <Text style={styles.tarjetaRowLabel}>Regalo del día</Text>
                <Text style={styles.tarjetaText}>{gratitud}</Text>
              </View>
            )}

            {/* Logro */}
            {logro.trim().length > 0 && (
              <View style={styles.tarjetaSection}>
                <Text style={styles.tarjetaRowLabel}>Identidad confirmada</Text>
                <Text style={styles.tarjetaText}>{logro}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.tarjetaFooter}>
              <Text style={styles.tarjetaFooterText}>Solen · Sistema de Identidad</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnNext} onPress={() => navigation.goBack()}>
            <Text style={styles.btnNextText}>Guardar y cerrar</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xxl },
  closeBtn: { position: 'absolute', top: spacing.xl, right: spacing.lg, zIndex: 10 },
  closeTxt: { color: colors.textHint, fontSize: 16 },

  stepWrap: { gap: spacing.md, paddingTop: spacing.sm },
  stepNum: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, letterSpacing: 2, textTransform: 'uppercase' },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, lineHeight: 28 },
  stepSub: { fontSize: 12, fontWeight: fonts.light, color: colors.textMuted },

  intencionList: { gap: 8, marginTop: 8 },
  intencionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.bgCardBorder,
    backgroundColor: colors.bgCard,
  },
  intencionCardActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}18` },
  intencionIcon: { fontSize: 20, color: colors.textMuted, width: 24, textAlign: 'center' },
  intencionIconActive: { color: colors.accent },
  intencionTextWrap: { flex: 1, gap: 2 },
  intencionLabel: { fontSize: 14, fontWeight: fonts.medium, color: colors.textSecondary },
  intencionLabelActive: { color: colors.accent },
  intencionDesc: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint },

  emocionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  emocionCard: {
    width: '31%',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.bgCardBorder,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    gap: 4,
  },
  emocionIcon: { fontSize: 22 },
  emocionLabel: { fontSize: 12, fontWeight: fonts.medium },
  emocionDesc: { fontSize: 8, fontWeight: fonts.light, color: colors.textHint, textAlign: 'center' },

  coherenciaDisplay: { alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  coherenciaNum: { fontSize: 56, fontWeight: '700', lineHeight: 60 },
  coherenciaLevel: { fontSize: 12, fontWeight: fonts.medium },
  coherenciaSlider: { width: '100%' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 9, fontWeight: fonts.light, color: colors.textHint },

  inputLabel: { fontSize: 11, fontWeight: fonts.light, color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    fontWeight: fonts.light,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 72,
  },

  btnNext: { marginTop: 8, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  btnFinal: {},
  btnDisabled: { opacity: 0.35 },
  btnNextText: { fontSize: 16, fontWeight: fonts.medium, color: '#000000' },

  tarjetaWrap: { gap: spacing.md },
  tarjetaFecha: { fontSize: 11, fontWeight: fonts.light, color: colors.textMuted, textTransform: 'capitalize' },

  tarjeta: {
    borderWidth: 0.5,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
  },
  tarjetaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  tarjetaIcon: { fontSize: 28 },
  tarjetaEmocion: { fontSize: 16, fontWeight: fonts.medium },
  tarjetaEmocionDesc: { fontSize: 10, fontWeight: fonts.light, color: colors.textMuted },

  tarjetaRow: { padding: spacing.md, gap: 6, borderTopWidth: 0.5, borderTopColor: colors.borderSubtle },
  tarjetaRowLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5 },
  tarjetaRowValue: { fontSize: 12, fontWeight: fonts.light },
  tarjetaCoherencia: { height: 2, backgroundColor: colors.borderSubtle, borderRadius: 1, overflow: 'hidden' },
  tarjetaCoherenciaBar: { height: '100%', borderRadius: 1 },
  tarjetaSection: { padding: spacing.md, borderTopWidth: 0.5, borderTopColor: colors.borderSubtle, gap: 6 },
  tarjetaText: { fontSize: 13, fontWeight: fonts.light, color: colors.textSecondary, lineHeight: 20 },
  tarjetaFooter: { padding: spacing.md, borderTopWidth: 0.5, borderTopColor: colors.borderSubtle },
  tarjetaFooterText: { fontSize: 9, fontWeight: fonts.light, color: colors.textHint, textAlign: 'center', letterSpacing: 1 },
});
