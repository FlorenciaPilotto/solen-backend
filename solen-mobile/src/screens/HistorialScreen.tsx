import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { protocolsService, ProtocolSummary } from '../api/protocols';
import { analyticsService } from '../api/protocols';
import { getPoder } from '../store/storage';
import { PoderIdentidad } from '../models';
import { colors, spacing, radius, fonts } from '../theme';

const TYPE_COLORS: Record<string, string> = {
  calma: colors.accent, energia: colors.accent,
  enfoque: colors.accent, claridad: colors.accent,
  alto_rendimiento: colors.accent,
};

export function HistorialScreen() {
  const [items, setItems] = useState<ProtocolSummary[]>([]);
  const [poder, setPoder] = useState<PoderIdentidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const load = useCallback(async () => {
    const [p] = await Promise.all([getPoder()]);
    setPoder(p);
    try {
      const { data } = await protocolsService.historial(20);
      setItems(data);
    } catch { setItems([]); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.creacion.primary} /></View>;

  return (
    <View style={s.container}>
      <Text style={s.title}>Historial</Text>

      {poder && (
        <View style={s.nivelCard}>
          <View>
            <Text style={s.nivelLabel}>Nivel de Identidad</Text>
            <Text style={s.nivelNivel}>{poder.nivel}</Text>
          </View>
          <View style={s.nivelRight}>
            <Text style={s.nivelPts}>{poder.total}</Text>
            <Text style={s.nivelPtsLabel}>pts</Text>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.creacion.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Sin protocolos todavía.</Text>
            <Text style={s.emptySub}>Hacé tu primer check-in.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = TYPE_COLORS[item.protocol_type] ?? colors.neutro.primary;
          const date = new Date(item.created_at).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <View style={s.item}>
              <View style={[s.dot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.itemType}>{item.protocol_type.replace('_', ' ')}</Text>
                <Text style={s.itemMeta}>E {item.energy} · S {item.stress} · F {item.focus} · {item.total_minutes} min</Text>
              </View>
              <Text style={s.itemDate}>{date}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: fonts.light, color: colors.textPrimary, padding: spacing.lg, paddingTop: spacing.xl + spacing.md },
  nivelCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivelLabel: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5 },
  nivelNivel: { fontSize: 18, fontWeight: fonts.regular, color: colors.accent, marginTop: 2 },
  nivelRight: { alignItems: 'flex-end' },
  nivelPts: { fontSize: 28, fontWeight: fonts.light, color: colors.accent },
  nivelPtsLabel: { fontSize: 9, fontWeight: fonts.light, color: colors.textHint },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  item: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgCardBorder, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemType: { fontSize: 13, fontWeight: fonts.regular, color: colors.textPrimary, textTransform: 'capitalize', marginBottom: 2 },
  itemMeta: { fontSize: 10, fontWeight: fonts.light, color: colors.textMuted },
  itemDate: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyTxt: { fontSize: 14, fontWeight: fonts.regular, color: colors.textPrimary },
  emptySub: { fontSize: 12, fontWeight: fonts.light, color: colors.textMuted, marginTop: 4 },
});
