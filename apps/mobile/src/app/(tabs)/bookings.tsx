import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useMyBookings, useCancelBooking } from '@/hooks/api';
import type { Booking } from '@/services/bookings';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success,
  pending: Colors.warning,
  cancelled: Colors.error,
  completed: Colors.accent,
  checked_in: Colors.success,
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status] ?? Colors.textSecondary;
  const label = t(`bookings.status.${status}`, status);
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function BookingListItem({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/booking/${booking.id}`)}
    >
      <Card style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingResource} numberOfLines={1}>
            {booking.resource?.name ?? 'Workspace'}
          </Text>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingDetailText}>
            {booking.resource?.location?.name ?? ''}
          </Text>
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingDetailText}>{dateStr}</Text>
        </View>

        <View style={styles.bookingDetail}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingDetailText}>{timeStr}</Text>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingAmount}>
            {Number(booking.totalAmount).toFixed(2)} {booking.currency}
          </Text>
          {booking.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onCancel(booking.id)}
            >
              <Text style={styles.cancelButtonText}>{t('bookings.cancelBooking')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const cancelMutation = useCancelBooking();

  const statusMap: Record<TabKey, string | undefined> = {
    upcoming: 'confirmed',
    past: 'completed',
    cancelled: 'cancelled',
  };

  const { data, isLoading, refetch } = useMyBookings({
    status: statusMap[activeTab],
  });

  const bookings = data?.data ?? [];

  function handleCancel(id: string) {
    Alert.alert(t('bookings.cancelBooking'), t('bookings.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(
            { id },
            {
              onSuccess: () => {
                Alert.alert('', t('bookings.bookingCancelled'));
                refetch();
              },
            },
          );
        },
      },
    ]);
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: t('bookings.upcoming') },
    { key: 'past', label: t('bookings.past') },
    { key: 'cancelled', label: t('bookings.cancelled') },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('bookings.title')}</Text>
        </View>

        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingListItem booking={item} onCancel={handleCancel} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={Colors.border} />
                <Text style={styles.emptyTitle}>{t('bookings.noBookings')}</Text>
                <Text style={styles.emptySubtitle}>{t('bookings.noBookingsSubtitle')}</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/booking/select-location')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCard: {
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bookingResource: {
    ...Typography.bodyBold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bookingDetailText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookingAmount: {
    ...Typography.bodyBold,
    color: Colors.accent,
  },
  cancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
