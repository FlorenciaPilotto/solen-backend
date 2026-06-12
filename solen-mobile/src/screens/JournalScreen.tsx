import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { saveJournal } from '../store/storage';
import { colors, spacing, radius, fonts } from '../theme';

type Gatillo = 'ninguno' | 'pereza' | 'miedo' | 'estrategia';

const STEPS = ['coherencia', 'gatillo', 'gratitud', 'cierre'] as const;
type Step = typeof STEPS[number];

export function JournalScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('coherencia');
  const [coherencia, setCoherencia] = useState(0);
  const [gatillo, setGatillo] = useState<Gatillo>('ninguno');
  const [textoCoherencia, setTextoCoherencia] = useState('');
  const [textoGratitud, setTextoGratitud] = useState('');
  const [textoCierre, setTextoCierre] = useState('');
  const [saving, setSaving] = useState(false);

  const stepIdx = STEPS.indexOf(step);
  const progress = (stepIdx + 1) / STEPS.length;

  const next = () => {
    const nextStep = STEPS[stepIdx + 1];
    if (nextStep) setStep(nextStep);
  };

  const handleSave = async () => {
    if (!textoCierre.trim()) {
      Alert.alert('Completá el cierre', 'Escribí aunque sea una línea sobre tu nueva identidad.');
      return;
    }
    setSaving(true);
    try {
      await saveJournal({
        coherencia,
        gatillo,
        textoCoherencia: textoCoherencia || '—',
        textoGratitud: textoGratitud || '—',
        textoCierre,
        modoDominante: 'creacion',
      });
      // Registrar en analytics (fire & forget)
      const { analyticsService } = require('../api/protocols');
      analyticsService.registrarEvento('journal', { coherencia, gatillo }).catch(() => {});
      Alert.alert(
        'Día cerrado',
        `Coherencia: ${coherencia}/10\n+20 puntos de identidad${coherencia >= 8 ? '\n+10 por alta coherencia' : ''}`,
        [{ text: 'Cerrar', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Error', 'No se pudo guardar el journal.');
    } finally {
      setSaving(false);
    }
  };

  const dots = STEPS.map((s, i) => (
    <View key={s} style={[styles.dot, i === stepIdx && styles.dotActive, i < stepIdx && styles.dotDone]} />
  ));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Journal de{'\n'}Integridad</Text>
      <Text style={styles.subtitulo}>22:00 · Cierre del día</Text>

      {/* Barra de progreso */}
      <View style={styles.dotsRow}>{dots}</View>

      {/* Step 1: Coherencia */}
      {step === 'coherencia' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>Coherencia · 1 de 4</Text>
          <Text style={styles.stepQ}>¿Mi claridad mental de esta mañana coincidió con mi aplicación real hoy?</Text>
          <View style={styles.scaleRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.scaleBtn, coherencia === n && styles.scaleBtnActive]}
                onPress={() => setCoherencia(n)}
              >
                <Text style={[styles.scaleBtnText, coherencia === n && styles.scaleBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {coherencia > 0 && (
            <Text style={[styles.coherenciaInsight, { color: coherencia <= 4 ? colors.supervivencia.primary : coherencia <= 7 ? colors.pineal.primary : colors.creacion.primary }]}>
              {coherencia <= 4 ? 'Brecha detectada. Sin culpa. Con claridad.' :
               coherencia <= 7 ? 'Coherencia en construcción. Seguís en el camino.' :
               'Alta coherencia. Día de construcción real.'}
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="¿Qué pasó entre lo que sabías y lo que hiciste? (opcional)"
            placeholderTextColor={colors.textHint}
            value={textoCoherencia}
            onChangeText={setTextoCoherencia}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.btnNext} onPress={next} disabled={coherencia === 0}>
            <Text style={styles.btnNextText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Gatillo */}
      {step === 'gatillo' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>Gatillo · 2 de 4</Text>
          <Text style={styles.stepQ}>Si fallé en algo hoy: ¿fue por pereza, miedo o falta de estrategia?</Text>
          <View style={styles.gatilloRow}>
            {(['ninguno','pereza','miedo','estrategia'] as Gatillo[]).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.gatilloBtn, gatillo === g && styles.gatilloBtnActive]}
                onPress={() => setGatillo(g)}
              >
                <Text style={[styles.gatilloBtnText, gatillo === g && styles.gatilloBtnTextActive]}>
                  {g === 'ninguno' ? 'No fallé' : g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btnNext} onPress={next}>
            <Text style={styles.btnNextText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Gratitud */}
      {step === 'gratitud' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>Gratitud real · 3 de 4</Text>
          <Text style={styles.stepQ}>Trae a tu mente un regalo que hayas recibido hoy. Saboréalo ahora. ¿Cómo se siente en el pecho?</Text>
          <Text style={styles.inputLabel}>El regalo fue...</Text>
          <TextInput
            style={styles.input}
            placeholder="una charla, un café, un logro pequeño..."
            placeholderTextColor={colors.textHint}
            value={textoGratitud}
            onChangeText={setTextoGratitud}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.btnNext} onPress={next}>
            <Text style={styles.btnNextText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 4: Cierre de identidad */}
      {step === 'cierre' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepLabel}>Identidad · 4 de 4</Text>
          <Text style={styles.stepQ}>Escribí una acción que hoy confirmó que ya no sos la persona del pasado.</Text>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder="Hoy elegí... a pesar de..."
            placeholderTextColor={colors.textHint}
            value={textoCierre}
            onChangeText={setTextoCierre}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.wordCount}>{textoCierre.trim().split(/\s+/).filter(Boolean).length} palabras</Text>
          <TouchableOpacity
            style={[styles.btnNext, styles.btnCierre]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.btnNextText}>{saving ? 'Guardando...' : 'Cerrar el día'}</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xxl },
  back: { position: 'absolute', top: spacing.xl, right: spacing.lg, zIndex: 10 },
  backText: { fontSize: 16, color: colors.textMuted },
  titulo: { fontSize: 28, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 34, marginBottom: 4 },
  subtitulo: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint, marginBottom: spacing.xl },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.border },
  dotActive: { width: 16, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  dotDone: { backgroundColor: colors.accentMuted },

  stepWrap: { gap: spacing.md },
  stepLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 2 },
  stepQ: { fontSize: 14, fontWeight: fonts.light, color: colors.textSecondary, lineHeight: 22 },

  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  scaleBtn: { flex: 1, minWidth: 26, height: 36, borderRadius: 6, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  scaleBtnActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  scaleBtnText: { fontSize: 11, fontWeight: fonts.light, color: colors.textMuted },
  scaleBtnTextActive: { color: colors.accent, fontWeight: fonts.medium },
  coherenciaInsight: { fontSize: 12, fontWeight: fonts.light, textAlign: 'center' },

  gatilloRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gatilloBtn: { flex: 1, minWidth: 80, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.bgCard, alignItems: 'center' },
  gatilloBtnActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  gatilloBtnText: { fontSize: 12, fontWeight: fonts.light, color: colors.textMuted },
  gatilloBtnTextActive: { color: colors.accent, fontWeight: fonts.medium },

  inputLabel: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint },
  input: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, fontSize: 13, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 20 },
  inputLarge: { minHeight: 100 },
  wordCount: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint, textAlign: 'right' },

  btnNext: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnCierre: {},
  btnNextText: { fontSize: 16, fontWeight: fonts.medium, color: '#000000' },
});
