import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import MembershipBadge from '@/components/ui/MembershipBadge';
import { useLocations, useCreditBalance, useUpcomingBookings, useMyActivePasses, useProducts, useEvents } from '@/hooks/api';
import { deriveTier } from '@/utils/membership';
import type { Location } from '@/services/locations';
import type { Booking } from '@/services/bookings';
import type { Product } from '@/services/products';

function LocationCard({ location }: { location: Location }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.locationCard}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/booking/select-resource',
          params: { locationId: location.id, locationName: location.name },
        })
      }
    >
      <View style={styles.locationIcon}>
        <Ionicons name="business-outline" size={24} color={Colors.accent} />
      </View>
      <Text style={styles.locationName} numberOfLines={1}>
        {location.name}
      </Text>
      <Text style={styles.locationCity}>{location.city}</Text>
    </TouchableOpacity>
  );
}

function PlanMiniCard({ product }: { product: Product }) {
  const router = useRouter();
  const rate = product.rateCodes?.[0];
  const price = Number(rate?.amount ?? 0);
  const tier = deriveTier(product.name);

  return (
    <TouchableOpacity
      style={styles.planMiniCard}
      activeOpacity={0.7}
      onPress={() => router.push('/plans')}
    >
      <View style={styles.planMiniIcon}>
        <Ionicons name="people-outline" size={24} color={Colors.secondary} />
      </View>
      <Text style={styles.planMiniName} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.planMiniPrice}>
        {price > 0 ? `${price} ${rate?.currency ?? 'GEL'}` : 'Free'}
      </Text>
    </TouchableOpacity>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
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
        <View style={styles.bookingRow}>
          <View style={styles.bookingDateBox}>
            <Text style={styles.bookingDateDay}>{start.getDate()}</Text>
            <Text style={styles.bookingDateMonth}>
              {start.toLocaleDateString('en-US', { month: 'short' })}
            </Text>
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingResource} numberOfLines={1}>
              {booking.resource?.name ?? 'Workspace'}
            </Text>
            <Text style={styles.bookingTime}>{timeStr}</Text>
            <Text style={styles.bookingLocation}>
              {booking.resource?.location?.name ?? ''}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: booking.status === 'confirmed' ? Colors.success : Colors.warning },
            ]}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: creditData } = useCreditBalance();
  const { data: upcomingData, isLoading: bookingsLoading } = useUpcomingBookings();
  const { data: activePasses } = useMyActivePasses();
  const { data: products } = useProducts({ type: 'coworking_pass' });
  const { data: events } = useEvents();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : t('home.welcome');
  const activePass = activePasses?.[0];
  const activeTier = activePass ? deriveTier(activePass.product?.name ?? '') : null;

  const creditBalance = creditData?.balance ?? 0;
  const creditCurrency = creditData?.currency ?? 'GEL';
  const upcomingBookings = upcomingData?.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('home.welcome')},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {activeTier && <MembershipBadge tier={activeTier} />}
            </View>
          </View>
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Quick Book Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/booking/select-location')}
        >
          <Card style={styles.quickBookCard}>
            <View style={styles.quickBookContent}>
              <View style={styles.quickBookIconContainer}>
                <Ionicons name="flash" size={28} color={Colors.white} />
              </View>
              <View style={styles.quickBookTextContainer}>
                <Text style={styles.quickBookTitle}>{t('home.quickBook')}</Text>
                <Text style={styles.quickBookSubtitle}>
                  {t('home.quickBookSubtitle')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.white}
              />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/booking/day-pass')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="today-outline" size={22} color="#1976D2" />
            </View>
            <Text style={styles.quickActionLabel}>{t('dayPass.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/booking/locker')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#E65100" />
            </View>
            <Text style={styles.quickActionLabel}>{t('locker.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/events')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="calendar-outline" size={22} color="#7B1FA2" />
            </View>
            <Text style={styles.quickActionLabel}>{t('events.title')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/community')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people-outline" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.quickActionLabel}>{t('community.title')}</Text>
          </TouchableOpacity>
        </View>

        {/* Credit Balance Card */}
        <Card style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <Ionicons name="wallet-outline" size={24} color={Colors.accent} />
            <Text style={styles.creditTitle}>{t('home.creditBalance')}</Text>
          </View>
          <Text style={styles.creditAmount}>
            {Number(creditBalance).toFixed(2)} {creditCurrency}
          </Text>
          <Text style={styles.creditSubtext}>{t('home.availableBalance')}</Text>
        </Card>

        {/* Upcoming Bookings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentBookings')}</Text>
            {upcomingBookings.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {bookingsLoading ? (
            <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>{t('home.noUpcoming')}</Text>
                <TouchableOpacity
                  style={styles.bookNowButton}
                  onPress={() => router.push('/booking/select-location')}
                >
                  <Text style={styles.bookNowText}>{t('home.bookNow')}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>

        {/* Membership Plans Section */}
        {(products ?? []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('plans.title')}</Text>
              <TouchableOpacity onPress={() => router.push('/plans')}>
                <Text style={styles.viewAllText}>{t('plans.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.locationsRow}>
                {(products ?? []).slice(0, 4).map((product) => (
                  <PlanMiniCard key={product.id} product={product} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Events Section */}
        {(events ?? []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('events.title')}</Text>
              <TouchableOpacity onPress={() => router.push('/events')}>
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {(events ?? []).slice(0, 2).map((event) => {
              const eventDate = new Date(event.date);
              const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventMiniCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/events/${event.id}`)}
                >
                  <View style={styles.eventMiniDate}>
                    <Text style={styles.eventMiniDateText}>{dateStr}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventMiniTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventMiniLocation}>{event.locationName}</Text>
                  </View>
                  <Text style={styles.eventMiniPrice}>
                    {event.isFree ? 'Free' : `${event.price} ${event.currency}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Locations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.locations')}</Text>
          {locationsLoading ? (
            <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.locationsRow}>
                {(locations ?? []).map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h2,
    color: Colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookCard: {
    backgroundColor: Colors.secondary,
    marginBottom: Spacing.md,
  },
  quickBookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickBookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookTextContainer: {
    flex: 1,
  },
  quickBookTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  quickBookSubtitle: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  creditCard: {
    marginBottom: Spacing.lg,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  creditTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  creditAmount: {
    ...Typography.h1,
    color: Colors.accent,
  },
  creditSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  viewAllText: {
    ...Typography.bodyMedium,
    color: Colors.secondary,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  bookNowButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  bookNowText: {
    ...Typography.bodyMedium,
    color: Colors.white,
  },
  locationsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  locationCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
  },
  locationCity: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bookingCard: {
    marginBottom: Spacing.sm,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bookingDateBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingDateDay: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  bookingDateMonth: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    lineHeight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingResource: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  bookingTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bookingLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planMiniCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  planMiniIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planMiniName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
  },
  planMiniPrice: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
    fontSize: 11,
  },
  eventMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  eventMiniDate: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  eventMiniDateText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  eventMiniTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
  },
  eventMiniLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  eventMiniPrice: {
    ...Typography.bodyMedium,
    color: Colors.secondary,
    fontSize: 13,
  },
});
