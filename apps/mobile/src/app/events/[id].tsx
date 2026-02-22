import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useEvent, usePurchaseTicket } from '@/hooks/api';

export default function EventDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id ?? '');
  const purchaseMutation = usePurchaseTicket();
  const [quantity, setQuantity] = useState(1);

  if (isLoading || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={Colors.secondary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const spotsLeft = event.capacity - event.attendeesCount;
  const totalPrice = event.price * quantity;

  function handlePurchase() {
    purchaseMutation.mutate(
      { eventId: event!.id, quantity },
      {
        onSuccess: () => {
          Alert.alert(
            t('events.ticketConfirmed'),
            t('events.ticketConfirmedMessage'),
            [{ text: t('common.ok'), onPress: () => router.back() }],
          );
        },
        onError: () => Alert.alert(t('common.error'), t('events.purchaseFailed')),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroPlaceholder}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Ionicons name="calendar" size={64} color="rgba(255,255,255,0.5)" />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
            <View>
              <Text style={styles.infoLabel}>{dateStr}</Text>
              <Text style={styles.infoSub}>{event.startTime} - {event.endTime}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.secondary} />
            <View>
              <Text style={styles.infoLabel}>{event.locationName}</Text>
              <Text style={styles.infoSub}>{event.address}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoLabel}>
              {spotsLeft} {t('events.spotsLeft')} ({event.attendeesCount}/{event.capacity})
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('events.about')}</Text>
          <Text style={styles.description}>{event.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('events.host')}</Text>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Ionicons name="person" size={20} color={Colors.white} />
            </View>
            <Text style={styles.hostName}>{event.hostName}</Text>
          </View>

          {!event.isFree && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>{t('events.tickets')}</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.min(spotsLeft, q + 1))}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <Text style={styles.totalPrice}>{totalPrice} {event.currency}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseBtn, purchaseMutation.isPending && styles.btnDisabled]}
          onPress={handlePurchase}
          disabled={purchaseMutation.isPending}
        >
          <Text style={styles.purchaseBtnText}>
            {event.isFree ? t('events.register') : t('events.getTickets')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  heroPlaceholder: {
    height: 220,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  categoryText: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  content: { padding: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.md, marginBottom: Spacing.md,
  },
  infoLabel: { ...Typography.bodyMedium, color: Colors.text },
  infoSub: { ...Typography.caption, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  description: { ...Typography.bodyRegular, color: Colors.text, lineHeight: 22 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  hostAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  hostName: { ...Typography.bodyMedium, color: Colors.text },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  qtyText: { ...Typography.h3, color: Colors.text, minWidth: 30, textAlign: 'center' },
  totalPrice: { ...Typography.h3, color: Colors.secondary },
  footer: {
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  purchaseBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  purchaseBtnText: { ...Typography.bodyBold, color: Colors.white },
  btnDisabled: { opacity: 0.6 },
});
