import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useEvents } from '@/hooks/api';
import type { Event } from '@/services/events';

function FeaturedCard({ event }: { event: Event }) {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={styles.featuredCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.featuredImagePlaceholder}>
        <Ionicons name="calendar" size={40} color={Colors.white} />
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredCategory}>{event.category}</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.featuredMetaText}>{dateStr}</Text>
          <Text style={styles.featuredPrice}>
            {event.isFree ? 'Free' : `${event.price} ${event.currency}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EventListItem({ event }: { event: Event }) {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();

  return (
    <TouchableOpacity
      style={styles.eventItem}
      activeOpacity={0.7}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.eventMetaText}>{event.locationName}</Text>
        </View>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.eventMetaText}>{event.startTime} - {event.endTime}</Text>
        </View>
      </View>
      <View style={styles.eventRight}>
        <Text style={styles.eventPrice}>
          {event.isFree ? 'Free' : `${event.price} ${event.currency}`}
        </Text>
        <Text style={styles.attendees}>
          <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
          {' '}{event.attendeesCount}/{event.capacity}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const { t } = useTranslation();
  const { data: events, isLoading } = useEvents();

  const featured = (events ?? []).filter((e) => e.isFeatured);
  const allEvents = events ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('events.title')}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
        ) : (
          <>
            {featured.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('events.featured')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.featuredRow}>
                    {featured.map((event) => (
                      <FeaturedCard key={event.id} event={event} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('events.upcoming')}</Text>
              {allEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>{t('events.noEvents')}</Text>
                </View>
              ) : (
                allEvents.map((event) => (
                  <EventListItem key={event.id} event={event} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h2, color: Colors.text },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    ...Typography.h3, color: Colors.text,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  featuredRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md },
  featuredCard: {
    width: 280,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  featuredImagePlaceholder: {
    height: 140,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: { padding: Spacing.md },
  featuredCategory: {
    ...Typography.caption, color: Colors.secondary,
    fontWeight: '600', textTransform: 'uppercase', marginBottom: 4,
  },
  featuredTitle: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  featuredPrice: { ...Typography.bodyMedium, color: Colors.secondary, fontSize: 14 },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateBadge: {
    width: 48,
    height: 52,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { color: Colors.white, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateDay: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  eventTitle: { ...Typography.bodyMedium, color: Colors.text, marginBottom: 2 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { ...Typography.caption, color: Colors.textSecondary },
  eventRight: { alignItems: 'flex-end', gap: 4 },
  eventPrice: { ...Typography.bodyMedium, color: Colors.secondary, fontSize: 14 },
  attendees: { ...Typography.caption, color: Colors.textSecondary },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.xxl, gap: Spacing.md,
  },
  emptyText: { ...Typography.bodyRegular, color: Colors.textSecondary },
});
