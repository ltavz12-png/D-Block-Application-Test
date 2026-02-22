import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { usePurchasePass } from '@/hooks/api';
import { billingPeriodLabel } from '@/utils/membership';

export default function ConfirmPlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    productId,
    rateCodeId,
    productName,
    amount,
    currency,
    billingPeriod,
  } = useLocalSearchParams<{
    productId: string;
    rateCodeId: string;
    productName: string;
    amount: string;
    currency: string;
    billingPeriod: string;
  }>();

  const [autoRenew, setAutoRenew] = useState(false);
  const purchaseMutation = usePurchasePass();

  const price = parseFloat(amount || '0');
  const periodLabel = billingPeriodLabel(billingPeriod || '');
  const today = new Date().toISOString().split('T')[0];

  function handleConfirm() {
    purchaseMutation.mutate(
      {
        productId: productId!,
        rateCodeId: rateCodeId || undefined,
        startDate: today,
        autoRenew,
      },
      {
        onSuccess: () => {
          router.replace('/plans/success');
        },
        onError: (error: any) => {
          Alert.alert(
            t('common.error'),
            error?.response?.data?.message ?? 'Failed to purchase plan',
          );
        },
      },
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('plans.confirmPurchase') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Summary */}
        <Card style={styles.card}>
          <View style={styles.planRow}>
            <View style={styles.planIcon}>
              <Ionicons name="people-outline" size={28} color={Colors.secondary} />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{productName}</Text>
              <Text style={styles.planPeriod}>
                {billingPeriod ? billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1) : ''}{' '}
                {t('plans.billingPeriod').toLowerCase()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <View>
              <Text style={styles.detailLabel}>{t('plans.startDate')}</Text>
              <Text style={styles.detailValue}>
                {new Date(today).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.autoRenewRow}>
            <View style={styles.autoRenewLeft}>
              <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>{t('plans.autoRenew')}</Text>
            </View>
            <Switch
              value={autoRenew}
              onValueChange={setAutoRenew}
              trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
              thumbColor={autoRenew ? Colors.secondary : Colors.surface}
            />
          </View>
        </Card>

        {/* Total */}
        <Card style={[styles.card, styles.totalCard]}>
          <Text style={styles.totalLabel}>{t('plans.totalDue')}</Text>
          <Text style={styles.totalAmount}>
            {price.toFixed(2)} {currency}{periodLabel}
          </Text>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, purchaseMutation.isPending && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={purchaseMutation.isPending}
        >
          {purchaseMutation.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>{t('plans.confirmPurchase')}</Text>
          )}
        </TouchableOpacity>
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
    paddingBottom: 120,
  },
  card: {
    marginBottom: Spacing.md,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 18,
  },
  planPeriod: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
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
  autoRenewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoRenewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  totalCard: {
    backgroundColor: Colors.accent + '10',
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: Spacing.md,
    borderRadius: 26,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
