import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function PlanSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.title}>{t('plans.purchaseSuccess')}</Text>
          <Text style={styles.subtitle}>{t('plans.purchaseSuccessSubtitle')}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.primaryButtonText}>{t('plans.explore')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: Spacing.md,
    borderRadius: 26,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
