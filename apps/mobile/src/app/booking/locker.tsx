import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface Locker {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'selected';
  size: 'small' | 'medium' | 'large';
}

const MOCK_LOCKERS: Locker[] = Array.from({ length: 24 }, (_, i) => ({
  id: `l${i + 1}`,
  number: `${i + 1}`,
  status: [3, 7, 11, 15, 19].includes(i) ? 'occupied' : 'available',
  size: i % 3 === 0 ? 'large' : i % 3 === 1 ? 'medium' : 'small',
})) as Locker[];

const DURATIONS = [
  { label: '1 Day', value: 1, price: 5 },
  { label: '1 Week', value: 7, price: 25 },
  { label: '1 Month', value: 30, price: 80 },
];

function getLockerColor(status: string): string {
  switch (status) {
    case 'available': return Colors.success;
    case 'occupied': return Colors.textSecondary;
    case 'selected': return Colors.secondary;
    default: return Colors.border;
  }
}

export default function LockerBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLocker, setSelectedLocker] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);

  function handleSelect(locker: Locker) {
    if (locker.status === 'occupied') return;
    setSelectedLocker(locker.id === selectedLocker ? null : locker.id);
  }

  function handleReserve() {
    if (!selectedLocker) return;
    Alert.alert(
      t('locker.confirmTitle'),
      t('locker.confirmMessage', {
        locker: MOCK_LOCKERS.find((l) => l.id === selectedLocker)?.number,
        duration: selectedDuration.label,
        price: selectedDuration.price,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Alert.alert(t('locker.reserved'), t('locker.reservedMessage'), [
              { text: t('common.ok'), onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('locker.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>{t('locker.available')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.legendText}>{t('locker.occupied')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.legendText}>{t('locker.selected')}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {MOCK_LOCKERS.map((locker) => {
            const isSelected = locker.id === selectedLocker;
            const status = isSelected ? 'selected' : locker.status;
            return (
              <TouchableOpacity
                key={locker.id}
                style={[styles.lockerCell, { backgroundColor: getLockerColor(status) + '20', borderColor: getLockerColor(status) }]}
                onPress={() => handleSelect(locker)}
                disabled={locker.status === 'occupied'}
              >
                <Text style={[styles.lockerNumber, { color: getLockerColor(status) }]}>
                  {locker.number}
                </Text>
                <Ionicons
                  name={locker.status === 'occupied' ? 'lock-closed' : 'lock-open-outline'}
                  size={16}
                  color={getLockerColor(status)}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.durationLabel}>{t('locker.duration')}</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((dur) => (
            <TouchableOpacity
              key={dur.value}
              style={[styles.durationChip, selectedDuration.value === dur.value && styles.durationChipActive]}
              onPress={() => setSelectedDuration(dur)}
            >
              <Text style={[styles.durationText, selectedDuration.value === dur.value && styles.durationTextActive]}>
                {dur.label}
              </Text>
              <Text style={[styles.durationPrice, selectedDuration.value === dur.value && styles.durationTextActive]}>
                {dur.price} GEL
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('locker.total')}</Text>
          <Text style={styles.totalPrice}>{selectedDuration.price} GEL</Text>
        </View>
        <TouchableOpacity
          style={[styles.reserveBtn, !selectedLocker && styles.btnDisabled]}
          onPress={handleReserve}
          disabled={!selectedLocker}
        >
          <Text style={styles.reserveBtnText}>{t('locker.reserve')}</Text>
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
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...Typography.caption, color: Colors.textSecondary },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  lockerCell: {
    width: '14.5%', aspectRatio: 1,
    borderRadius: BorderRadius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  lockerNumber: { fontWeight: '700', fontSize: 14 },
  durationLabel: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  durationRow: { flexDirection: 'row', gap: Spacing.sm },
  durationChip: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  durationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { ...Typography.bodyMedium, color: Colors.text, fontSize: 13 },
  durationPrice: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  durationTextActive: { color: Colors.white },
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
  reserveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  reserveBtnText: { ...Typography.bodyBold, color: Colors.white },
  btnDisabled: { opacity: 0.5 },
});
