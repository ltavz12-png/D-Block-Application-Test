import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function BookingSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>

          <Text style={styles.title}>{t('booking.bookingConfirmed')}</Text>
          <Text style={styles.subtitle}>{t('booking.bookingSuccess')}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace(`/booking/${bookingId}`)
            }
          >
            <Ionicons name="eye-outline" size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>{t('booking.viewBooking')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryButtonText}>{t('booking.goHome')}</Text>
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
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});
