import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function AccessScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={64} color={Colors.accent} />
        </View>
        <Text style={styles.title}>{t('tabs.access')}</Text>
        <Text style={styles.subtitle}>
          BLE door access will be available here.{'\n'}
          Connect to nearby door locks to gain entry.
        </Text>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
