import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useProtocolo } from '../hooks/useProtocolo';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  getPoder, getRoundsHoy, getJournalHoy,
  debeBloquear, activarRoundUno,
} from '../store/storage';
import { calcularModo, PoderIdentidad, RoundsDelDia } from '../models';
import { useTimeBasedRound } from '../ui/hooks/useTimeBasedRound';
import { colors, spacing, radius, fonts } from '../theme';

export function HomeScreen() {
  const { user, signOut } = useAuth();
  const navigation        = useNavigation<any>();
  const roundInfo         = useTimeBasedRound();
  const { generar, loading: generando } = useProtocolo();
  const { data: analytics, loading: loadingAnalytics } = useAnalytics();

  const [estado, setEstado]   = useState(70);
  const [emocion, setEmocion] = useState<string | null>(null);
  const [poder, setPoder]     = useState<PoderIdentidad | null>(null);
  const [rounds, setRounds]   = useState<RoundsDelDia | null>(null);
  const [journalDone, setJournalDone] = useState(false);
  const [bloqueado, setBloqueado]     = useState(false);
  const [loading, setLoading]         = useState(true);

  const modo       = calcularModo(estado);
  const estadoColor = colors[modo] ?? colors.neutro;

  // Mapeo emoción → parámetros del protocolo
  const EMOCION_PROTOCOLO: Record<string, {
    energy: number; stress: number; focus: number;
    protocolo: string; titulo: string; sub: string;
  }> = {
    'Triste':      { energy: 28, stress: 62, focus: 25, protocolo: 'rescate',   titulo: 'Protocolo de Elevación',   sub: '7 min · Activación de Serotonina' },
    'Enojado':     { energy: 60, stress: 82, focus: 28, protocolo: 'rescate',   titulo: 'Protocolo de Descarga',    sub: '5 min · Regulación del Cortisol' },
    'Ansioso':     { energy: 48, stress: 88, focus: 22, protocolo: 'rescate',   titulo: 'Protocolo de Calma',       sub: '8 min · Coherencia Cardíaca' },
    'Inconforme':  { energy: 44, stress: 66, focus: 32, protocolo: 'expansion', titulo: 'Protocolo de Claridad',    sub: '10 min · Reencuadre Cognitivo' },
    'Con miedo':   { energy: 22, stress: 82, focus: 18, protocolo: 'rescate',   titulo: 'Protocolo de Ancla',       sub: '6 min · Regulación del Sistema Nervioso' },
    'Irritable':   { energy: 55, stress: 76, focus: 28, protocolo: 'rescate',   titulo: 'Protocolo de Reset',       sub: '5 min · Descarga Somática' },
  };

  const emocionConfig = emocion ? EMOCION_PROTOCOLO[emocion] : null;

  const protocoloTitulo = emocionConfig
    ? emocionConfig.titulo
    : modo === 'supervivencia' ? 'Protocolo de Rescate' : 'Protocolo de Expansión';

  const protocoloSub = emocionConfig
    ? emocionConfig.sub
    : modo === 'supervivencia' ? '5 min · Ancla de Serotonina' : '10 min · Fuego y Magnetismo';

  const load = useCallback(async () => {
    const [p, r, j, b] = await Promise.all([
      getPoder(), getRoundsHoy(), getJournalHoy(), debeBloquear(),
    ]);
    setPoder(p); setRounds(r);
    setJournalDone(!!j); setBloqueado(b);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoundUno = async () => {
    try {
      const { puntos, racha } = await activarRoundUno();
      // Registrar en analytics
      const now = new Date();
      const hora = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const { analyticsService } = require('../api/protocols');
      analyticsService.registrarEvento('wakeup', { hora, puntos }).catch(() => {});
      Alert.alert('Round Uno activado', `+${puntos} puntos de identidad\nRacha: ${racha} días`);
      load();
    } catch { Alert.alert('Error', 'No se pudo activar el Round Uno.'); }
  };

  const handleProtocolo = async () => {
    if (bloqueado) {
      Alert.alert('Acceso bloqueado', 'No activaste el Round Uno antes de las 5:30 AM.');
      return;
    }

    // Si hay emoción seleccionada, usar sus parámetros; si no, usar el estado del slider
    const params = emocionConfig
      ? { energy: emocionConfig.energy, stress: emocionConfig.stress, focus: emocionConfig.focus, available_minutes: 90 }
      : { energy: estado, stress: 100 - estado, focus: Math.round(estado * 0.85), available_minutes: 90 };

    const protocolo = await generar(params);
    if (protocolo) {
      navigation.navigate('Respiracion', {
        protocolo: emocionConfig?.protocolo ?? (modo === 'supervivencia' ? 'rescate' : 'expansion'),
      });
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={colors.creacion.primary} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header con round activo */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.roundTag, { color: roundInfo.colorPrimary }]}>
            {roundInfo.label}
          </Text>
          <Text style={styles.name}>{greeting}, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard analytics del backend */}
      {analytics && (
        <View style={styles.dashRow}>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.creacion.primary }]}>
              {analytics.modo_creacion_pct.toFixed(0)}%
            </Text>
            <Text style={styles.dashLabel}>Creación</Text>
          </View>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.pineal.primary }]}>
              {analytics.racha}
            </Text>
            <Text style={styles.dashLabel}>Racha</Text>
          </View>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.neutro.primary }]}>
              {analytics.biohack_level}
            </Text>
            <Text style={styles.dashLabel}>Bio-Hack</Text>
          </View>
        </View>
      )}

      {/* Poder de identidad local */}
      {poder && (
        <View style={styles.poderRow}>
          <View style={styles.poderBarWrap}>
            <View style={[styles.poderBar, {
              width: `${poder.total % 100}%`,
              backgroundColor: estadoColor.primary,
            }]} />
          </View>
          <Text style={[styles.poderPts, { color: estadoColor.primary }]}>
            {poder.total} pts · Nivel {poder.nivel}
          </Text>
        </View>
      )}

      {/* Selector de estado / frecuencia */}
      <View style={[styles.selectorCard, { borderColor: estadoColor.border, backgroundColor: estadoColor.bg }]}>
        <Text style={styles.selectorLabel}>
          {modo === 'supervivencia' ? 'Supervivencia' : modo === 'creacion' ? 'Creación' : 'Neutro'}
        </Text>
        <Text style={[styles.selectorValue, { color: estadoColor.primary }]}>{estado}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0} maximumValue={100} step={1}
          value={estado} onValueChange={setEstado}
          minimumTrackTintColor={estadoColor.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={estadoColor.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderEnd}>Supervivencia</Text>
          <Text style={styles.sliderEnd}>Creación</Text>
        </View>

        {modo === 'creacion' && (
          <View style={styles.emocionWrap}>
            <Text style={styles.emocionQuestion}>¿Cómo te sentís? ¿Qué emoción predomina?</Text>
            <View style={styles.emocionGrid}>
              {[
                { emoji: '😢', label: 'Triste' },
                { emoji: '😡', label: 'Enojado' },
                { emoji: '😰', label: 'Ansioso' },
                { emoji: '😤', label: 'Inconforme' },
                { emoji: '😨', label: 'Con miedo' },
                { emoji: '😠', label: 'Irritable' },
              ].map((e) => (
                <TouchableOpacity
                  key={e.label}
                  style={[
                    styles.emocionBtn,
                    emocion === e.label && { borderColor: estadoColor.primary, backgroundColor: estadoColor.bg },
                  ]}
                  onPress={() => setEmocion(emocion === e.label ? null : e.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emocionEmoji}>{e.emoji}</Text>
                  <Text style={[styles.emocionLabel, emocion === e.label && { color: estadoColor.primary }]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Botón de protocolo → backend */}
      <TouchableOpacity
        style={[styles.protocolBtn, { borderColor: estadoColor.border, backgroundColor: estadoColor.bg }]}
        onPress={handleProtocolo}
        disabled={generando}
        activeOpacity={0.8}
      >
        {generando
          ? <ActivityIndicator color={estadoColor.primary} />
          : <>
              <Text style={[styles.protocolBtnText, { color: estadoColor.primary }]}>
                {protocoloTitulo}
              </Text>
              <Text style={styles.protocolBtnSub}>
                {protocoloSub}
              </Text>
            </>
        }
      </TouchableOpacity>

      {/* Rounds */}
      <Text style={styles.sectionTitle}>Rounds del día</Text>

      <TouchableOpacity
        style={[styles.roundCard, rounds?.roundUnoActivado && styles.roundCardDone]}
        onPress={rounds?.roundUnoActivado ? undefined : handleRoundUno}
        disabled={rounds?.roundUnoActivado}
      >
        <View style={styles.roundLeft}>
          <View style={[styles.roundDot, rounds?.roundUnoActivado && styles.roundDotDone]} />
          <View>
            <Text style={styles.roundTitle}>Round Uno</Text>
            <Text style={styles.roundSub}>5:00 AM · +15–50 pts</Text>
          </View>
        </View>
        {rounds?.roundUnoActivado
          ? <Text style={styles.roundCheck}>✓ {rounds.roundUnoHora}</Text>
          : <Text style={styles.roundAction}>Activar →</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.roundCard} onPress={() => navigation.navigate('AccionMasiva')}>
        <View style={styles.roundLeft}>
          <View style={styles.roundDot} />
          <View>
            <Text style={styles.roundTitle}>Round Dos · Acción Masiva</Text>
            <Text style={styles.roundSub}>90 min · +40 pts</Text>
          </View>
        </View>
        <Text style={styles.roundAction}>Iniciar →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.roundCard} onPress={() => navigation.navigate('Pineal')}>
        <View style={styles.roundLeft}>
          <View style={[styles.roundDot, { borderColor: colors.pineal.border }]} />
          <View>
            <Text style={styles.roundTitle}>Round Tres · Pineal</Text>
            <Text style={styles.roundSub}>22:00 · +20 pts</Text>
          </View>
        </View>
        <Text style={styles.roundAction}>Iniciar →</Text>
      </TouchableOpacity>

      {/* Journal */}
      <TouchableOpacity
        style={[styles.journalBtn, journalDone && styles.journalDone]}
        onPress={() => navigation.navigate('IntegrityJournal')}
      >
        <Text style={styles.journalTitle}>
          {journalDone ? '✓ Journal completado' : 'Journal de Integridad'}
        </Text>
        <Text style={styles.journalSub}>
          {journalDone ? 'Ver resumen' : 'Módulo nocturno · +20 pts'}
        </Text>
      </TouchableOpacity>

      {/* Racha */}
      {(analytics || poder) && (
        <View style={styles.rachaCard}>
          <Text style={[styles.rachaNum, { color: colors.pineal.primary }]}>
            {analytics?.racha ?? poder?.racha ?? 0}
          </Text>
          <View>
            <Text style={styles.rachaLabel}>días de racha</Text>
            <Text style={styles.rachaSub}>
              Mejor: {analytics?.mejor_racha ?? poder?.mejorRacha ?? 0} días
            </Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  roundTag: { fontFamily: 'DM Sans', fontSize: 9, fontWeight: fonts.medium, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 3 },
  name: { fontFamily: 'DM Sans', fontSize: 24, fontWeight: fonts.light, color: colors.textPrimary },
  logout: { fontFamily: 'DM Sans', fontSize: 11, fontWeight: fonts.light, color: colors.textHint, marginTop: 4 },

  dashRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dashCard: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  dashNum: { fontFamily: 'DM Sans', fontSize: 24, fontWeight: fonts.light },
  dashLabel: { fontFamily: 'DM Sans', fontSize: 9, fontWeight: fonts.light, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  poderRow: { marginBottom: spacing.md },
  poderBarWrap: { height: 2, backgroundColor: colors.border, borderRadius: 1, marginBottom: 4 },
  poderBar: { height: '100%', borderRadius: 1 },
  poderPts: { fontFamily: 'DM Sans', fontSize: 11, fontWeight: fonts.light },

  selectorCard: { borderWidth: 0.5, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  selectorLabel: { fontFamily: 'DM Sans', fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  selectorValue: { fontFamily: 'DM Sans', fontSize: 38, fontWeight: fonts.light, lineHeight: 42 },
  slider: { width: '100%', marginVertical: 6 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEnd: { fontFamily: 'DM Sans', fontSize: 9, fontWeight: fonts.light, color: colors.textHint },

  emocionWrap: { marginTop: spacing.md, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: spacing.md },
  emocionQuestion: { fontFamily: 'DM Sans', fontSize: 12, fontWeight: fonts.light, color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
  emocionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  emocionBtn: { borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.full, paddingVertical: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bgCard },
  emocionEmoji: { fontSize: 14 },
  emocionLabel: { fontFamily: 'DM Sans', fontSize: 11, fontWeight: fonts.light, color: colors.textMuted },

  protocolBtn: { borderWidth: 0.5, borderRadius: radius.full, padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg, minHeight: 52, justifyContent: 'center' },
  protocolBtnText: { fontFamily: 'DM Sans', fontSize: 14, fontWeight: fonts.regular },
  protocolBtnSub: { fontFamily: 'DM Sans', fontSize: 10, fontWeight: fonts.light, color: colors.textHint, marginTop: 2 },

  sectionTitle: { fontFamily: 'DM Sans', fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm },
  roundCard: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  roundCardDone: { borderColor: 'rgba(93,202,165,0.25)', backgroundColor: 'rgba(93,202,165,0.06)' },
  roundLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  roundDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 0.5, borderColor: colors.border },
  roundDotDone: { backgroundColor: colors.creacion.primary, borderColor: colors.creacion.primary },
  roundTitle: { fontFamily: 'DM Sans', fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  roundSub: { fontFamily: 'DM Sans', fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 1 },
  roundCheck: { fontFamily: 'DM Sans', fontSize: 11, fontWeight: fonts.light, color: colors.creacion.primary },
  roundAction: { fontFamily: 'DM Sans', fontSize: 11, fontWeight: fonts.light, color: colors.textHint },

  journalBtn: { borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginVertical: spacing.sm },
  journalDone: { borderColor: 'rgba(174,169,236,0.3)', backgroundColor: 'rgba(174,169,236,0.06)' },
  journalTitle: { fontFamily: 'DM Sans', fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  journalSub: { fontFamily: 'DM Sans', fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 2 },

  rachaCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, padding: spacing.md, backgroundColor: 'rgba(186,117,23,0.06)', borderWidth: 0.5, borderColor: 'rgba(186,117,23,0.18)', borderRadius: radius.md },
  rachaNum: { fontFamily: 'DM Sans', fontSize: 40, fontWeight: fonts.light, lineHeight: 44 },
  rachaLabel: { fontFamily: 'DM Sans', fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  rachaSub: { fontFamily: 'DM Sans', fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 1 },
});
