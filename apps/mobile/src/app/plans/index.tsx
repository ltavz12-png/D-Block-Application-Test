import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useProducts, useMyActivePasses } from '@/hooks/api';
import PlanCard from '@/components/PlanCard';
import type { Product } from '@/services/products';

export default function PlansScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [billingToggle, setBillingToggle] = useState<'monthly' | 'annual'>('monthly');

  const { data: products, isLoading } = useProducts({ type: 'coworking_pass' });
  const { data: activePasses } = useMyActivePasses();

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products]);

  const activeProductId = activePasses?.[0]?.productId;

  function getRateForToggle(product: Product) {
    if (billingToggle === 'annual') {
      const annualRate = product.rateCodes.find(
        (r) => r.code.includes('ANNUAL') || r.code.includes('YEARLY'),
      );
      if (annualRate) return annualRate;
    }
    return product.rateCodes[0];
  }

  function handleChoose(product: Product) {
    const rate = getRateForToggle(product);
    router.push({
      pathname: '/plans/confirm',
      params: {
        productId: product.id,
        rateCodeId: rate?.id ?? '',
        productName: product.name,
        amount: String(Number(rate?.amount ?? 0)),
        currency: rate?.currency ?? 'GEL',
        billingPeriod: product.billingPeriod,
      },
    });
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t('plans.choosePlan') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('plans.choosePlan') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingToggle === 'monthly' && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingToggle('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                billingToggle === 'monthly' && styles.toggleTextActive,
              ]}
            >
              {t('plans.monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingToggle === 'annual' && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingToggle('annual')}
          >
            <Text
              style={[
                styles.toggleText,
                billingToggle === 'annual' && styles.toggleTextActive,
              ]}
            >
              {t('plans.annual')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        {sortedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('plans.noPlansAvailable')}</Text>
          </View>
        ) : (
          sortedProducts.map((product) => (
            <PlanCard
              key={product.id}
              product={product}
              selectedRate={getRateForToggle(product)}
              isCurrentPlan={product.id === activeProductId}
              isRecommended={product.sortOrder === 2}
              onChoose={() => handleChoose(product)}
            />
          ))
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 26,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.text,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
});
