import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { Product, RateCode } from '@/services/products';
import { billingPeriodLabel } from '@/utils/membership';

interface PlanCardProps {
  product: Product;
  selectedRate?: RateCode;
  isCurrentPlan?: boolean;
  isRecommended?: boolean;
  onChoose?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  coworking_pass: 'people-outline',
  credit_package: 'wallet-outline',
  office: 'business-outline',
  meeting_room: 'videocam-outline',
  parking: 'car-outline',
  locker: 'lock-closed-outline',
  event_space: 'calendar-outline',
  box: 'cube-outline',
};

export default function PlanCard({
  product,
  selectedRate,
  isCurrentPlan = false,
  isRecommended = false,
  onChoose,
}: PlanCardProps) {
  const { t } = useTranslation();

  const rate = selectedRate ?? product.rateCodes?.[0];
  const amount = rate ? Number(rate.amount) : 0;
  const currency = rate?.currency ?? 'GEL';
  const periodLabel = billingPeriodLabel(product.billingPeriod);
  const iconName = TYPE_ICONS[product.productType] ?? 'cube-outline';

  return (
    <View
      style={[
        styles.card,
        isRecommended && styles.cardRecommended,
      ]}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>{t('plans.recommended')}</Text>
        </View>
      )}

      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={32} color={Colors.secondary} />
      </View>

      <Text style={styles.planName}>{product.name}</Text>

      <View style={styles.priceRow}>
        {amount === 0 ? (
          <Text style={styles.priceAmount}>{t('plans.free')}</Text>
        ) : (
          <>
            <Text style={styles.priceAmount}>
              {amount} {currency}
            </Text>
            <Text style={styles.pricePeriod}>{periodLabel}</Text>
          </>
        )}
      </View>

      {product.features && product.features.length > 0 && (
        <View style={styles.featuresList}>
          {product.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.ctaButton,
          isCurrentPlan && styles.ctaButtonDisabled,
        ]}
        onPress={onChoose}
        disabled={isCurrentPlan}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.ctaText,
            isCurrentPlan && styles.ctaTextDisabled,
          ]}
        >
          {isCurrentPlan ? t('plans.currentPlan') : t('plans.choosePlanCTA')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardRecommended: {
    borderWidth: 2,
    borderColor: '#007AFF',
    ...Shadows.md,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  pricePeriod: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  featuresList: {
    marginBottom: Spacing.lg,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: 26,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.border,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  ctaTextDisabled: {
    color: Colors.textSecondary,
  },
});
