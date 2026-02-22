import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useBooking, useCancelBooking } from '@/hooks/api';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success,
  pending: Colors.warning,
  cancelled: Colors.error,
  completed: Colors.accent,
  checked_in: Colors.success,
};

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading } = useBooking(id);
  const cancelMutation = useCancelBooking();

  if (isLoading || !booking) {
    return (
      <>
        <Stack.Screen options={{ title: t('bookings.details') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </>
    );
  }

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
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

  const statusColor = STATUS_COLORS[booking.status] ?? Colors.textSecondary;

  function handleCancel() {
    Alert.alert(t('bookings.cancelBooking'), t('bookings.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(
            { id: booking!.id },
            {
              onSuccess: () => {
                Alert.alert('', t('bookings.bookingCancelled'));
                router.back();
              },
            },
          );
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: t('bookings.details') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`bookings.status.${booking.status}`, booking.status)}
          </Text>
        </View>

        {/* Resource Info */}
        <Card style={styles.card}>
          <View style={styles.resourceRow}>
            <View style={styles.resourceIcon}>
              <Ionicons name="cube-outline" size={28} color={Colors.accent} />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceName}>
                {booking.resource?.name ?? 'Workspace'}
              </Text>
              <Text style={styles.resourceType}>
                {booking.resource?.resourceType ?? ''}
              </Text>
              {booking.resource?.location && (
                <Text style={styles.locationName}>
                  {booking.resource.location.name}, {booking.resource.location.city}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Date & Time */}
        <Card style={styles.card}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <View>
              <Text style={styles.detailLabel}>{t('bookings.date')}</Text>
              <Text style={styles.detailValue}>{dateStr}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <View>
              <Text style={styles.detailLabel}>{t('bookings.time')}</Text>
              <Text style={styles.detailValue}>{timeStr}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="hourglass-outline" size={20} color={Colors.textSecondary} />
            <View>
              <Text style={styles.detailLabel}>{t('booking.duration')}</Text>
              <Text style={styles.detailValue}>
                {durationHours} {t('booking.hours')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment */}
        <Card style={styles.card}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{t('bookings.amount')}</Text>
            <Text style={styles.paymentAmount}>
              {Number(booking.totalAmount).toFixed(2)} {booking.currency}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.detailLabel}>{t('bookings.payment')}</Text>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor:
                    booking.paymentStatus === 'paid'
                      ? Colors.success + '20'
                      : Colors.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  {
                    color:
                      booking.paymentStatus === 'paid'
                        ? Colors.success
                        : Colors.warning,
                  },
                ]}
              >
                {booking.paymentStatus}
              </Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card style={styles.card}>
            <Text style={styles.notesLabel}>{t('bookings.notes')}</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </Card>
        )}

        {/* Cancel Button */}
        {booking.status === 'confirmed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.cancelButtonText}>{t('bookings.cancelBooking')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...Typography.bodyBold,
    textTransform: 'capitalize',
  },
  card: {
    marginBottom: Spacing.md,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resourceIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  resourceType: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  locationName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailItem: {
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
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  paymentAmount: {
    ...Typography.h3,
    color: Colors.accent,
  },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paymentBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  notesText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    ...Typography.bodyBold,
    color: Colors.error,
  },
});
