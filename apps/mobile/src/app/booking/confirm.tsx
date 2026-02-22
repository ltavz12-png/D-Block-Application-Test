import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useCreateBooking } from '@/hooks/api';

export default function ConfirmBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createBooking = useCreateBooking();
  const [notes, setNotes] = useState('');

  const { resourceId, resourceName, resourceType, startTime, endTime, total, currency } =
    useLocalSearchParams<{
      resourceId: string;
      resourceName: string;
      resourceType: string;
      startTime: string;
      endTime: string;
      total: string;
      currency: string;
    }>();

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = `${start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} - ${end.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;

  async function handleConfirm() {
    createBooking.mutate(
      {
        resourceId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: notes || undefined,
      },
      {
        onSuccess: (booking) => {
          router.replace({
            pathname: '/booking/success',
            params: { bookingId: booking.id },
          });
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ?? 'Failed to create booking';
          Alert.alert(t('common.error'), message);
        },
      },
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('booking.confirmBooking') }} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('booking.summary')}</Text>

          <Card style={styles.summaryCard}>
            <View style={styles.resourceHeader}>
              <View style={styles.resourceIcon}>
                <Ionicons name="cube-outline" size={24} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.resourceName}>{resourceName}</Text>
                <Text style={styles.resourceType}>
                  {t(`booking.resourceType.${resourceType}`, resourceType)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.detailLabel}>{t('bookings.date')}</Text>
                <Text style={styles.detailValue}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.detailLabel}>{t('bookings.time')}</Text>
                <Text style={styles.detailValue}>{timeStr}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={18} color={Colors.textSecondary} />
              <View>
                <Text style={styles.detailLabel}>{t('booking.duration')}</Text>
                <Text style={styles.detailValue}>
                  {durationHours} {t('booking.hours')}
                </Text>
              </View>
            </View>
          </Card>

          {/* Notes */}
          <Text style={styles.sectionTitle}>{t('bookings.notes')}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('booking.addNotes')}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />

          {/* Price Summary */}
          <Card style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('booking.total')}</Text>
              <Text style={styles.priceValue}>
                {parseFloat(total).toFixed(2)} {currency}
              </Text>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              createBooking.isPending && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.confirmText}>{t('booking.confirmAndPay')}</Text>
              </>
            )}
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
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  resourceType: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyRegular,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  priceCard: {
    backgroundColor: Colors.accent + '10',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  priceValue: {
    ...Typography.h2,
    color: Colors.accent,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  confirmButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});
