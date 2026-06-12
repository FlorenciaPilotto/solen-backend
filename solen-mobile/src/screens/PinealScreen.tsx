import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AudioPlayer } from '../ui/components/AudioPlayer';
import { saveBreathingSession } from '../store/storage';
import { colors, spacing, radius, fonts } from '../theme';

type Mode = 'intro' | 'session' | 'done';

const GUION = [
  'Sentate derecho. Visualizá tu columna como un conducto de luz.',
  'Al inhalar, apretá el perineo, apretá el abdomen inferior... empujá ese fluido hacia tu coronilla.',
  'Sostené... Sentí la presión en el centro de tu cabeza.',
  'Ahí se enciende tu antena. No hay pasado, no hay futuro.',
  'Solo esta frecuencia de paz absoluta.',
];

export function PinealScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>('intro');
  const [guionIdx, setGuionIdx] = useState(0);

  const handleComplete = async (duracion: number) => {
    await saveBreathingSession({
      protocolo: 'pineal',
      ciclosCompletados: Math.floor(duracion / 18),
      duracionSegundos: duracion,
      hzAlcanzado: 0.5,
      estado: 'creacion',
    });
    setMode('done');
  };

  if (mode === 'session') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AudioPlayer
          protocolo="pineal"
          onComplete={handleComplete}
          onClose={() => setMode('intro')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.close}>
        <Text style={s.closeTxt}>✕</Text>
      </TouchableOpacity>

      <Text style={s.tag}>Round Tres · Activación Pineal</Text>

      {mode === 'intro' && (
        <>
          <Text style={s.title}>Preparate{'\n'}para la noche</Text>
          <Text style={s.sub}>La app cambia a luz tenue. El sistema nervioso se prepara para el descanso profundo.</Text>

          <View style={s.guionCard}>
            <Text style={s.guionLabel}>Guión de activación · {guionIdx + 1}/{GUION.length}</Text>
            <Text style={s.guionText}>{GUION[guionIdx]}</Text>
            <View style={s.guionBtns}>
              <TouchableOpacity onPress={() => setGuionIdx(i => Math.max(0, i - 1))} style={s.guionBtn} disabled={guionIdx === 0}>
                <Text style={[s.guionBtnTxt, guionIdx === 0 && { opacity: 0.2 }]}>← Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setGuionIdx(i => Math.min(GUION.length - 1, i + 1))} style={s.guionBtn} disabled={guionIdx === GUION.length - 1}>
                <Text style={[s.guionBtnTxt, guionIdx === GUION.length - 1 && { opacity: 0.2 }]}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={() => setMode('session')}>
            <Text style={s.btnTxt}>Iniciar Activación Pineal</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'done' && (
        <>
          <Text style={s.title}>Frecuencia{'\n'}alcanzada</Text>
          <Text style={[s.hzDisplay, { color: colors.accent }]}>0.5 Hz</Text>
          <Text style={s.hzLabel}>Delta · Descanso profundo</Text>
          <Text style={s.doneMsg}>Tu sistema nervioso está en modo de recuperación máxima. Dormí.</Text>
          <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Journal')}>
            <Text style={s.btnTxt}>Abrir Journal nocturno</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, gap: spacing.lg, minHeight: '100%', alignItems: 'center' },
  close: { position: 'absolute', top: spacing.xl, right: spacing.lg, zIndex: 10 },
  closeTxt: { color: colors.textHint, fontSize: 16 },
  tag: { fontSize: 9, fontWeight: fonts.medium, color: colors.accent, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: fonts.light, color: colors.textPrimary, textAlign: 'center', lineHeight: 36 },
  sub: { fontSize: 12, fontWeight: fonts.light, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, maxWidth: 240 },
  guionCard: { width: '100%', backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  guionLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.accent, letterSpacing: 1.5, textTransform: 'uppercase' },
  guionText: { fontSize: 13, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 20 },
  guionBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  guionBtn: { padding: spacing.sm },
  guionBtnTxt: { fontSize: 11, fontWeight: fonts.light, color: colors.accent },
  btn: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.full, padding: spacing.md, alignItems: 'center' },
  btnTxt: { fontSize: 14, fontWeight: fonts.medium, color: '#000000' },
  hzDisplay: { fontSize: 52, fontWeight: fonts.light, textAlign: 'center' },
  hzLabel: { fontSize: 11, fontWeight: fonts.light, color: colors.textSecondary, textAlign: 'center' },
  doneMsg: { fontSize: 13, fontWeight: fonts.light, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 230 },
});
