import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useProducts } from '@/hooks/api';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-based
}

export default function DayPassScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: products } = useProducts({ type: 'coworking_pass' });
  const dayPassProduct = (products ?? []).find((p) =>
    p.name.toLowerCase().includes('day pass'),
  );
  const price = dayPassProduct ? Number(dayPassProduct.rateCodes?.[0]?.amount ?? 25) : 25;
  const currency = dayPassProduct?.rateCodes?.[0]?.currency ?? 'GEL';

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
    );
  }

  function handlePurchase() {
    if (selectedDates.length === 0) return;
    Alert.alert(
      t('dayPass.confirmTitle'),
      `${selectedDates.length} day(s) x ${price} ${currency} = ${selectedDates.length * price} ${currency}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Alert.alert(t('dayPass.purchased'), t('dayPass.purchasedMessage'), [
              { text: t('common.ok'), onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  }

  const totalPrice = selectedDates.length * price;
  const todayStr = today.toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dayPass.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="today-outline" size={24} color={Colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t('dayPass.includes')}</Text>
            <Text style={styles.infoText}>{t('dayPass.includesDesc')}</Text>
          </View>
          <Text style={styles.priceTag}>{price} {currency}</Text>
        </View>

        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
              else setViewMonth((m) => m - 1);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => {
              if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
              else setViewMonth((m) => m + 1);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekdayText}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDates.includes(dateStr);
            const isPast = dateStr < todayStr;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCell, isSelected && styles.dayCellSelected, isPast && styles.dayCellPast]}
                onPress={() => !isPast && toggleDate(dateStr)}
                disabled={isPast}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isPast && styles.dayTextPast]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDates.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedDates.length} {t('dayPass.daysSelected')}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('dayPass.total')}</Text>
          <Text style={styles.totalPrice}>{totalPrice} {currency}</Text>
        </View>
        <TouchableOpacity
          style={[styles.purchaseBtn, selectedDates.length === 0 && styles.btnDisabled]}
          onPress={handlePurchase}
          disabled={selectedDates.length === 0}
        >
          <Text style={styles.purchaseBtnText}>{t('dayPass.purchase')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  content: { padding: Spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, ...Shadows.sm,
  },
  infoTitle: { ...Typography.bodyBold, color: Colors.text },
  infoText: { ...Typography.caption, color: Colors.textSecondary },
  priceTag: { ...Typography.h3, color: Colors.secondary },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthLabel: { ...Typography.h3, color: Colors.text },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekdayText: {
    flex: 1, textAlign: 'center',
    ...Typography.caption, color: Colors.textSecondary, fontWeight: '600',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: Colors.secondary, borderRadius: BorderRadius.full },
  dayCellPast: { opacity: 0.3 },
  dayText: { ...Typography.bodyMedium, color: Colors.text, fontSize: 15 },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  dayTextPast: { color: Colors.textSecondary },
  selectedCount: {
    ...Typography.bodyMedium, color: Colors.secondary,
    textAlign: 'center', marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  totalLabel: { ...Typography.bodyMedium, color: Colors.textSecondary },
  totalPrice: { ...Typography.h3, color: Colors.secondary },
  purchaseBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  purchaseBtnText: { ...Typography.bodyBold, color: Colors.white },
  btnDisabled: { opacity: 0.5 },
});
