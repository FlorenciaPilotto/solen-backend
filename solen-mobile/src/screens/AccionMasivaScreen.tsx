import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { startAccionMasiva, completeAccionMasiva, getAccionMasivaHoy } from '../store/storage';
import { AccionMasivaSession } from '../models';
import { colors, spacing, radius, fonts } from '../theme';

const DURACION = 90 * 60;

export function AccionMasivaScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [session, setSession] = useState<AccionMasivaSession | null>(null);
  const [tarea, setTarea] = useState('');
  const [segundos, setSegundos] = useState(DURACION);
  const [activo, setActivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAccionMasivaHoy().then(s => {
      if (s) {
        setSession(s);
        if (!s.completado) {
          const iniciado = new Date(s.iniciado);
          const elapsed = Math.floor((Date.now() - iniciado.getTime()) / 1000);
          setSegundos(Math.max(0, DURACION - elapsed));
          setActivo(true);
        }
      }
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const iniciar = useCallback(async () => {
    if (!tarea.trim()) {
      Alert.alert(t('accion.alert.noTask'), t('accion.alert.noTaskMsg'));
      return;
    }
    const s = await startAccionMasiva(tarea.trim());
    setSession(s);
    setActivo(true);
    Vibration.vibrate(100);
  }, [tarea, t]);

  useEffect(() => {
    if (activo && !pausado && segundos > 0) {
      intervalRef.current = setInterval(() => {
        setSegundos(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            Vibration.vibrate([0, 300, 100, 300]);
            handleComplete();
            return 0;
          }
          if ((s - 1) % (15 * 60) === 0) Vibration.vibrate(50);
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activo, pausado]);

  const handleComplete = async () => {
    await completeAccionMasiva();
    Alert.alert(
      t('accion.alert.doneTitle'),
      t('accion.alert.doneMsg'),
      [{ text: t('accion.alert.back'), onPress: () => navigation.goBack() }],
    );
  };

  const togglePausa = () => {
    setPausado(p => !p);
    Vibration.vibrate(30);
  };

  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  const progress = (DURACION - segundos) / DURACION;
  const bloqueColor = colors.creacion;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t('accion.back')}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.tag}>{t('accion.tag')}</Text>
        <Text style={styles.title}>{t('accion.title')}</Text>
        <Text style={styles.sub}>{t('accion.sub')}</Text>
      </View>

      <View style={styles.timerWrap}>
        <View style={[styles.timerRing, { borderColor: bloqueColor.border }]}>
          <Text style={[styles.timerNum, { color: bloqueColor.primary }]}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </Text>
          <Text style={styles.timerLabel}>
            {activo ? (pausado ? t('accion.timer.paused') : t('accion.timer.flow')) : t('accion.timer.ready')}
          </Text>
        </View>
        <View style={[styles.progressBar, { borderBottomColor: bloqueColor.primary, borderBottomWidth: progress > 0 ? 2 : 0 }]} />
      </View>

      {!activo ? (
        <View style={styles.tareaSection}>
          <Text style={styles.tareaLabel}>{t('accion.task.question')}</Text>
          <TextInput
            style={styles.tareaInput}
            placeholder={t('accion.task.placeholder')}
            placeholderTextColor={colors.textHint}
            value={tarea}
            onChangeText={setTarea}
            multiline
            numberOfLines={2}
          />
          <TouchableOpacity
            style={[styles.btn, { borderColor: bloqueColor.border, backgroundColor: bloqueColor.bg }]}
            onPress={iniciar}
          >
            <Text style={[styles.btnText, { color: bloqueColor.primary }]}>{t('accion.start')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          {session && (
            <View style={styles.tareaActiva}>
              <Text style={styles.tareaActivaLabel}>{t('accion.task.active')}</Text>
              <Text style={styles.tareaActivaText}>{session.tarea}</Text>
            </View>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={togglePausa}>
              <Text style={styles.btnSecondaryText}>{pausado ? t('accion.resume') : t('accion.pause')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFull, { borderColor: bloqueColor.border, backgroundColor: bloqueColor.bg }]}
              onPress={handleComplete}
            >
              <Text style={[styles.btnText, { color: bloqueColor.primary }]}>{t('accion.complete')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noMolestar}>{t('accion.dnd')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: spacing.xl + spacing.md },
  back: { marginBottom: spacing.lg },
  backText: { fontSize: 12, fontWeight: fonts.light, color: colors.textMuted },
  header: { marginBottom: spacing.xl },
  tag: { fontSize: 9, fontWeight: fonts.medium, color: colors.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 32, marginBottom: 8 },
  sub: { fontSize: 12, fontWeight: fonts.light, color: colors.textMuted, lineHeight: 19 },
  timerWrap: { alignItems: 'center', marginBottom: spacing.xl },
  timerRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: 36, fontWeight: fonts.light },
  timerLabel: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' },
  progressBar: { width: 162, height: 0, marginTop: -1 },
  tareaSection: { gap: spacing.md },
  tareaLabel: { fontSize: 12, fontWeight: fonts.light, color: colors.textSecondary },
  tareaInput: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, fontSize: 14, fontWeight: fonts.light, color: colors.textPrimary, minHeight: 60 },
  btn: { borderWidth: 0.5, borderRadius: radius.full, padding: spacing.md, alignItems: 'center' },
  btnFull: { flex: 1 },
  btnText: { fontSize: 14, fontWeight: fonts.regular },
  controls: { gap: spacing.md },
  tareaActiva: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md },
  tareaActivaLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  tareaActivaText: { fontSize: 14, fontWeight: fonts.regular, color: colors.textPrimary },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btnSecondary: { flex: 1, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.full, padding: spacing.md, alignItems: 'center' },
  btnSecondaryText: { fontSize: 13, fontWeight: fonts.light, color: colors.textMuted },
  noMolestar: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint, textAlign: 'center' },
});
