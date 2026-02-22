import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import MembershipBadge from '@/components/ui/MembershipBadge';
import { useMyPasses, useCancelPass } from '@/hooks/api';
import { deriveTier } from '@/utils/membership';

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success,
  expired: Colors.textSecondary,
  cancelled: Colors.error,
  suspended: Colors.warning,
  pending_payment: Colors.warning,
};

export default function MembershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: passes, isLoading } = useMyPasses();
  const cancelMutation = useCancelPass();

  const activePasses = (passes ?? []).filter((p) => p.status === 'active');
  const otherPasses = (passes ?? []).filter((p) => p.status !== 'active');

  function handleCancel(passId: string) {
    Alert.alert(t('membership.cancelMembership'), t('membership.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(
            { id: passId },
            {
              onSuccess: () => {
                Alert.alert('', t('membership.cancelled'));
              },
            },
          );
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t('membership.title') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('membership.title') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activePasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('membership.noPlan')}</Text>
            <Text style={styles.emptySubtitle}>{t('membership.noPlanSubtitle')}</Text>
            <TouchableOpacity
              style={styles.browsePlansButton}
              onPress={() => router.push('/plans')}
            >
              <Text style={styles.browsePlansText}>{t('membership.browsePlans')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('membership.activePlan')}</Text>
            {activePasses.map((pass) => {
              const tier = deriveTier(pass.product?.name ?? '');
              return (
                <Card key={pass.id} style={styles.passCard}>
                  <View style={styles.passHeader}>
                    <View>
                      <Text style={styles.passName}>
                        {pass.product?.name ?? 'Membership'}
                      </Text>
                      <MembershipBadge tier={tier} style={{ marginTop: 4 }} />
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: (STATUS_COLORS[pass.status] ?? Colors.textSecondary) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_COLORS[pass.status] ?? Colors.textSecondary },
                        ]}
                      >
                        {t(`membership.status.${pass.status}`, pass.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.passDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>{t('membership.startedOn')}</Text>
                      <Text style={styles.detailValue}>
                        {new Date(pass.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>{t('membership.validUntil')}</Text>
                      <Text style={styles.detailValue}>
                        {new Date(pass.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {Number(pass.totalPaid) > 0 && (
                      <View style={styles.detailRow}>
                        <Ionicons name="wallet-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.detailLabel}>{t('bookings.amount')}</Text>
                        <Text style={styles.detailValue}>
                          {Number(pass.totalPaid).toFixed(2)} {pass.currency}
                        </Text>
                      </View>
                    )}
                  </View>

                  {pass.status === 'active' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancel(pass.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <ActivityIndicator color={Colors.error} />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                          <Text style={styles.cancelText}>{t('membership.cancelMembership')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })}
          </>
        )}

        {otherPasses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
              {t('bookings.past')}
            </Text>
            {otherPasses.map((pass) => (
              <Card key={pass.id} style={styles.passCard}>
                <View style={styles.passHeader}>
                  <Text style={styles.passName}>
                    {pass.product?.name ?? 'Membership'}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: (STATUS_COLORS[pass.status] ?? Colors.textSecondary) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_COLORS[pass.status] ?? Colors.textSecondary },
                      ]}
                    >
                      {t(`membership.status.${pass.status}`, pass.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.passDate}>
                  {new Date(pass.startDate).toLocaleDateString()} -{' '}
                  {new Date(pass.endDate).toLocaleDateString()}
                </Text>
              </Card>
            ))}
          </>
        )}

        {/* Browse more plans link */}
        {activePasses.length > 0 && (
          <TouchableOpacity
            style={styles.viewPlansLink}
            onPress={() => router.push('/plans')}
          >
            <Text style={styles.viewPlansText}>{t('membership.browsePlans')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.secondary} />
          </TouchableOpacity>
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
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  browsePlansButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 26,
    marginTop: Spacing.lg,
  },
  browsePlansText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  passCard: {
    marginBottom: Spacing.md,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  passName: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  passDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  passDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  cancelText: {
    ...Typography.bodyMedium,
    color: Colors.error,
  },
  viewPlansLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  viewPlansText: {
    ...Typography.bodyMedium,
    color: Colors.secondary,
  },
});
