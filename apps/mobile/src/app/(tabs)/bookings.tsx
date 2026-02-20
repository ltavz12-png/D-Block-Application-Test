import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '@/constants/theme';

export default function BookingsScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={64} color={Colors.border} />
        <Text style={styles.title}>{t('tabs.bookings')}</Text>
        <Text style={styles.subtitle}>{t('common.noResults')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
