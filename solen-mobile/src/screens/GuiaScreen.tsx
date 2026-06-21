import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, fonts } from '../theme';

export function GuiaScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const sections = [
    { key: 'install',  title: t('guia.sections.install.title'),  items: t('guia.sections.install.items',  { returnObjects: true }) as string[] },
    { key: 'flows',    title: t('guia.sections.flows.title'),    items: t('guia.sections.flows.items',    { returnObjects: true }) as string[] },
    { key: 'bugs',     title: t('guia.sections.bugs.title'),     items: t('guia.sections.bugs.items',     { returnObjects: true }) as string[] },
    { key: 'notes',    title: t('guia.sections.notes.title'),    items: t('guia.sections.notes.items',    { returnObjects: true }) as string[] },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('guia.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.close}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{t('guia.intro')}</Text>

        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.bullet}>·</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.version}>{t('guia.version')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: fonts.medium, color: colors.textPrimary },
  close: { fontSize: 13, fontWeight: fonts.light, color: colors.textHint },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: 13, fontWeight: fonts.light, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 9, fontWeight: fonts.medium, color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm },
  item: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bullet: { fontSize: 13, color: colors.textHint, lineHeight: 20, marginTop: 1 },
  itemText: { flex: 1, fontSize: 13, fontWeight: fonts.light, color: colors.textPrimary, lineHeight: 20 },
  version: { fontSize: 10, fontWeight: fonts.light, color: colors.textHint, textAlign: 'center', marginTop: spacing.md },
});
