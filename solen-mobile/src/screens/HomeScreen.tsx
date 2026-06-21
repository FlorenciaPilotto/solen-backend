import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useProtocolo } from '../hooks/useProtocolo';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  getPoder, getRoundsHoy, getJournalHoy,
  getMorningJournalHoy,
} from '../store/storage';
import { calcularModo, PoderIdentidad, RoundsDelDia } from '../models';
import { useTimeBasedRound } from '../ui/hooks/useTimeBasedRound';
import { colors, spacing, radius, fonts } from '../theme';

export function HomeScreen() {
  const { user, signOut } = useAuth();
  const navigation        = useNavigation<any>();
  const roundInfo         = useTimeBasedRound();
  const { generar, loading: generando } = useProtocolo();
  const { data: analytics } = useAnalytics();
  const { t } = useTranslation();

  const [estado, setEstado]   = useState(70);
  const [poder, setPoder]     = useState<PoderIdentidad | null>(null);
  const [rounds, setRounds]   = useState<RoundsDelDia | null>(null);
  const [journalDone, setJournalDone]           = useState(false);
  const [morningJournalDone, setMorningJournalDone] = useState(false);
  const [loading, setLoading]         = useState(true);

  const modo        = calcularModo(estado);
  const estadoColor = colors[modo] ?? colors.neutro;

  const load = useCallback(async () => {
    const [p, r, j, mj] = await Promise.all([
      getPoder(), getRoundsHoy(), getJournalHoy(), getMorningJournalHoy(),
    ]);
    setPoder(p); setRounds(r);
    setJournalDone(!!j); setMorningJournalDone(!!mj);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRoundUno = () => {
    navigation.navigate('Respiracion', { protocolo: 'rescate', roundUno: true });
  };

  const handleProtocolo = async () => {
    const protocolo = await generar({
      energy: estado,
      stress: 100 - estado,
      focus: Math.round(estado * 0.85),
      available_minutes: 90,
    });
    if (protocolo) {
      navigation.navigate('Respiracion', {
        protocolo: modo === 'supervivencia' ? 'rescate' : 'expansion',
      });
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t('home.greeting.morning')
    : hour < 20
      ? t('home.greeting.afternoon')
      : t('home.greeting.evening');

  const selectorLabel = modo === 'supervivencia'
    ? t('home.selector.labelSurvival')
    : modo === 'creacion'
      ? t('home.selector.labelCreation')
      : t('home.selector.labelNeutral');

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={colors.creacion.primary} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.name}>{greeting}, {user?.name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Guia')}>
            <Text style={styles.infoBtn}>ⓘ</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Text style={[styles.roundTag, { color: roundInfo.colorPrimary }]}>
            {roundInfo.label}
          </Text>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.logout}>{t('home.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard analytics */}
      {analytics && (
        <View style={styles.dashRow}>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.creacion.primary }]}>
              {analytics.modo_creacion_pct.toFixed(0)}%
            </Text>
            <Text style={styles.dashLabel}>{t('home.analytics.creation')}</Text>
          </View>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.pineal.primary }]}>
              {analytics.racha}
            </Text>
            <Text style={styles.dashLabel}>{t('home.analytics.streak')}</Text>
          </View>
          <View style={styles.dashCard}>
            <Text style={[styles.dashNum, { color: colors.neutro.primary }]}>
              {analytics.biohack_level}
            </Text>
            <Text style={styles.dashLabel}>{t('home.analytics.biohack')}</Text>
          </View>
        </View>
      )}

      {/* Poder de identidad */}
      {poder && (
        <View style={styles.poderRow}>
          <View style={styles.poderBarWrap}>
            <View style={[styles.poderBar, {
              width: `${poder.total % 100}%`,
              backgroundColor: estadoColor.primary,
            }]} />
          </View>
          <Text style={[styles.poderPts, { color: estadoColor.primary }]}>
            {poder.total} {t('common.pts')} · Nivel {poder.nivel}
          </Text>
        </View>
      )}

      {/* Selector de estado */}
      <View style={[styles.selectorCard, { borderColor: estadoColor.border, backgroundColor: estadoColor.bg }]}>
        <Text style={styles.selectorLabel}>{selectorLabel}</Text>
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
          <Text style={styles.sliderEnd}>{t('home.selector.survival')}</Text>
          <Text style={styles.sliderEnd}>{t('home.selector.creation')}</Text>
        </View>
      </View>

      {/* Botón de protocolo */}
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
                {modo === 'supervivencia' ? t('home.protocol.rescue') : t('home.protocol.expansion')}
              </Text>
              <Text style={styles.protocolBtnSub}>
                {modo === 'supervivencia' ? t('home.protocol.rescueSub') : t('home.protocol.expansionSub')}
              </Text>
            </>
        }
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('home.rounds.title')}</Text>

      {/* Journal de Inicio */}
      <TouchableOpacity
        style={[styles.journalBtn, morningJournalDone && styles.journalDone]}
        onPress={() => { if (!morningJournalDone) navigation.navigate('Journal'); }}
        disabled={morningJournalDone}
      >
        <Text style={styles.journalTitle}>
          {morningJournalDone ? t('home.rounds.journalStartDone') : t('home.rounds.journalStart')}
        </Text>
        <Text style={styles.journalSub}>
          {morningJournalDone ? t('home.rounds.journalStartDoneSub') : t('home.rounds.journalStartSub')}
        </Text>
      </TouchableOpacity>

      {/* Round Uno */}
      <TouchableOpacity
        style={[styles.roundCard, rounds?.roundUnoActivado && styles.roundCardDone]}
        onPress={rounds?.roundUnoActivado ? undefined : handleRoundUno}
        disabled={rounds?.roundUnoActivado}
      >
        <View style={styles.roundLeft}>
          <View style={[styles.roundDot, rounds?.roundUnoActivado && styles.roundDotDone]} />
          <View>
            <Text style={styles.roundTitle}>{t('home.rounds.roundOne')}</Text>
            <Text style={styles.roundSub}>{t('home.rounds.roundOneSub')}</Text>
          </View>
        </View>
        {rounds?.roundUnoActivado
          ? <Text style={styles.roundCheck}>✓ {rounds.roundUnoHora}</Text>
          : <Text style={styles.roundAction}>{t('home.rounds.activate')}</Text>}
      </TouchableOpacity>

      {/* Acción Masiva */}
      <TouchableOpacity style={styles.roundCard} onPress={() => navigation.navigate('AccionMasiva')}>
        <View style={styles.roundLeft}>
          <View style={styles.roundDot} />
          <View>
            <Text style={styles.roundTitle}>{t('home.rounds.actionMassive')}</Text>
            <Text style={styles.roundSub}>{t('home.rounds.actionMassiveSub')}</Text>
          </View>
        </View>
        <Text style={styles.roundAction}>{t('home.rounds.start')}</Text>
      </TouchableOpacity>

      {/* Pineal */}
      <TouchableOpacity style={styles.roundCard} onPress={() => navigation.navigate('Pineal')}>
        <View style={styles.roundLeft}>
          <View style={[styles.roundDot, { borderColor: colors.pineal.border }]} />
          <View>
            <Text style={styles.roundTitle}>{t('home.rounds.pineal')}</Text>
            <Text style={styles.roundSub}>{t('home.rounds.pinealSub')}</Text>
          </View>
        </View>
        <Text style={styles.roundAction}>{t('home.rounds.start')}</Text>
      </TouchableOpacity>

      {/* Journal de Integridad */}
      <TouchableOpacity
        style={[styles.journalBtn, journalDone && styles.journalDone]}
        onPress={() => navigation.navigate('IntegrityJournal')}
      >
        <Text style={styles.journalTitle}>
          {journalDone ? t('home.rounds.journalIntegrityDone') : t('home.rounds.journalIntegrity')}
        </Text>
        <Text style={styles.journalSub}>
          {journalDone ? t('home.rounds.journalIntegrityDoneSub') : t('home.rounds.journalIntegritySub')}
        </Text>
      </TouchableOpacity>

      {/* Racha */}
      {(analytics || poder) && (
        <View style={styles.rachaCard}>
          <Text style={[styles.rachaNum, { color: colors.pineal.primary }]}>
            {analytics?.racha ?? poder?.racha ?? 0}
          </Text>
          <View>
            <Text style={styles.rachaLabel}>{t('home.streak.days')}</Text>
            <Text style={styles.rachaSub}>
              {t('home.streak.best')} {analytics?.mejor_racha ?? poder?.mejorRacha ?? 0} días
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
  header: { marginBottom: spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  roundTag: { fontSize: 9, fontWeight: fonts.medium, textTransform: 'uppercase', letterSpacing: 2 },
  name: { fontSize: 24, fontWeight: fonts.light, color: colors.textPrimary },
  logout: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint },
  infoBtn: { fontSize: 18, color: colors.textHint },

  dashRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dashCard: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  dashNum: { fontSize: 24, fontWeight: fonts.light },
  dashLabel: { fontSize: 9, fontWeight: fonts.light, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  poderRow: { marginBottom: spacing.md },
  poderBarWrap: { height: 2, backgroundColor: colors.border, borderRadius: 1, marginBottom: 4 },
  poderBar: { height: '100%', borderRadius: 1 },
  poderPts: { fontSize: 11, fontWeight: fonts.light },

  selectorCard: { borderWidth: 0.5, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  selectorLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  selectorValue: { fontSize: 38, fontWeight: fonts.light, lineHeight: 42 },
  slider: { width: '100%', marginVertical: 6 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEnd: { fontSize: 9, fontWeight: fonts.light, color: colors.textHint },

  protocolBtn: { borderWidth: 0.5, borderRadius: radius.full, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm, minHeight: 52, justifyContent: 'center' },
  protocolBtnText: { fontSize: 14, fontWeight: fonts.regular },
  protocolBtnSub: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint, marginTop: 2 },

  sectionTitle: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm },
  roundCard: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  roundCardDone: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  roundLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  roundDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 0.5, borderColor: colors.border },
  roundDotDone: { backgroundColor: colors.creacion.primary, borderColor: colors.creacion.primary },
  roundTitle: { fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  roundSub: { fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 1 },
  roundCheck: { fontSize: 11, fontWeight: fonts.light, color: colors.creacion.primary },
  roundAction: { fontSize: 11, fontWeight: fonts.light, color: colors.textHint },

  journalBtn: { borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginVertical: spacing.sm },
  journalDone: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  journalTitle: { fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  journalSub: { fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 2 },

  rachaCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md },
  rachaNum: { fontSize: 40, fontWeight: fonts.light, lineHeight: 44 },
  rachaLabel: { fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary },
  rachaSub: { fontSize: 10, fontWeight: fonts.light, color: colors.textMuted, marginTop: 1 },
});
