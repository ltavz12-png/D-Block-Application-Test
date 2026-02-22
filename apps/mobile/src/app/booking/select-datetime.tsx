import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';

function generateDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

const DURATION_OPTIONS = [1, 2, 3, 4, 8];

export default function SelectDateTimeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resourceId, resourceName, resourceType, pricePerHour, currency } =
    useLocalSearchParams<{
      resourceId: string;
      resourceName: string;
      resourceType: string;
      pricePerHour: string;
      currency: string;
    }>();

  const dates = generateDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);

  const price = parseFloat(pricePerHour || '0');
  const total = price * duration;

  function handleContinue() {
    if (!selectedTime) return;

    const startDate = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);

    router.push({
      pathname: '/booking/confirm',
      params: {
        resourceId,
        resourceName,
        resourceType,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        total: String(total),
        currency: currency || 'GEL',
      },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: t('booking.selectDateTime') }} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Selection */}
          <Text style={styles.sectionTitle}>{t('booking.selectDate')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesRow}>
              {dates.map((date) => {
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateWeekday,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[
                        styles.dateDay,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Time Selection */}
          <Text style={styles.sectionTitle}>{t('booking.startTime')}</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.timeTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duration */}
          <Text style={styles.sectionTitle}>{t('booking.duration')}</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d) => {
              const isSelected = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationItem,
                    isSelected && styles.durationItemSelected,
                  ]}
                  onPress={() => setDuration(d)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      isSelected && styles.durationTextSelected,
                    ]}
                  >
                    {d}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary */}
          {selectedTime && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{resourceName}</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.summaryText}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.summaryText}>
                  {selectedTime} - {duration}h
                </Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.totalLabel}>{t('booking.total')}</Text>
                <Text style={styles.totalAmount}>
                  {total.toFixed(2)} {currency || 'GEL'}
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedTime && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedTime}
          >
            <Text style={styles.continueText}>{t('common.next')}</Text>
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
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  datesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateItem: {
    width: 64,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  dateItemSelected: {
    backgroundColor: Colors.secondary,
  },
  dateWeekday: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dateDay: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 20,
  },
  dateMonth: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dateTextSelected: {
    color: Colors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    minWidth: 72,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: Colors.secondary,
  },
  timeText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
  },
  timeTextSelected: {
    color: Colors.white,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  durationItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  durationItemSelected: {
    backgroundColor: Colors.secondary,
  },
  durationText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  durationTextSelected: {
    color: Colors.white,
  },
  summaryCard: {
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  totalAmount: {
    ...Typography.h3,
    color: Colors.accent,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  continueButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
  },
  continueText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});
