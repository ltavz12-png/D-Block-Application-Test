import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : t('home.welcome');

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
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={Colors.white} />
          </View>
        </View>

        {/* Quick Book Card */}
        <Card style={styles.quickBookCard}>
          <View style={styles.quickBookContent}>
            <View style={styles.quickBookIconContainer}>
              <Ionicons name="flash" size={28} color={Colors.white} />
            </View>
            <View style={styles.quickBookTextContainer}>
              <Text style={styles.quickBookTitle}>{t('home.quickBook')}</Text>
              <Text style={styles.quickBookSubtitle}>
                Book a desk or meeting room instantly
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.white}
            />
          </View>
        </Card>

        {/* Credit Balance Card */}
        <Card style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={Colors.accent}
            />
            <Text style={styles.creditTitle}>{t('home.creditBalance')}</Text>
          </View>
          <Text style={styles.creditAmount}>0.00 GEL</Text>
          <Text style={styles.creditSubtext}>Available balance</Text>
        </Card>

        {/* Recent Bookings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.recentBookings')}</Text>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            </View>
          </Card>
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
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
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
});
