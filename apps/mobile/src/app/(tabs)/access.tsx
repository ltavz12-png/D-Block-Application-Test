import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useUpcomingBookings } from '@/hooks/api';

type UnlockState = 'idle' | 'scanning' | 'unlocked';

export default function AccessScreen() {
  const { t } = useTranslation();
  const [unlockState, setUnlockState] = useState<UnlockState>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { data: upcomingData } = useUpcomingBookings();
  const hasAccess = (upcomingData?.data?.length ?? 0) > 0;

  function handleTapToUnlock() {
    if (unlockState !== 'idle') return;

    setUnlockState('scanning');

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    setTimeout(() => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      setUnlockState('unlocked');
      setTimeout(() => setUnlockState('idle'), 3000);
    }, 2000);
  }

  const mockActivity = [
    { id: '1', time: '09:15', location: 'Stamba - Main Entrance' },
    { id: '2', time: '12:30', location: 'Stamba - Meeting Room Floor' },
    { id: '3', time: '14:00', location: 'Stamba - Main Entrance' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('access.title')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.unlockSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.unlockButton,
                  unlockState === 'unlocked' && styles.unlockButtonSuccess,
                  !hasAccess && styles.unlockButtonDisabled,
                ]}
                onPress={handleTapToUnlock}
                disabled={!hasAccess || unlockState !== 'idle'}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={unlockState === 'unlocked' ? 'lock-open-outline' : 'key-outline'}
                  size={48}
                  color={Colors.white}
                />
                <Text style={styles.unlockText}>
                  {unlockState === 'idle'
                    ? t('access.tapToUnlock')
                    : unlockState === 'scanning'
                    ? t('access.scanning')
                    : t('access.unlocked')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {!hasAccess && (
              <View style={styles.noAccessInfo}>
                <Text style={styles.noAccessText}>{t('access.noAccess')}</Text>
                <Text style={styles.noAccessSubtext}>{t('access.noAccessSubtitle')}</Text>
              </View>
            )}
          </View>

          <Card style={styles.mockNotice}>
            <View style={styles.mockNoticeContent}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
              <Text style={styles.mockNoticeText}>{t('access.mockMode')}</Text>
            </View>
          </Card>

          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>{t('access.recentActivity')}</Text>
            {mockActivity.map((item) => (
              <Card key={item.id} style={styles.activityCard}>
                <View style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="enter-outline" size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLocation}>{item.location}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  unlockSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  unlockButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    gap: Spacing.sm,
  },
  unlockButtonSuccess: {
    backgroundColor: Colors.success,
  },
  unlockButtonDisabled: {
    backgroundColor: Colors.border,
  },
  unlockText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontSize: 14,
  },
  noAccessInfo: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  noAccessText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  noAccessSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mockNotice: {
    backgroundColor: Colors.warning + '15',
    marginBottom: Spacing.lg,
  },
  mockNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mockNoticeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  activitySection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  activityCard: {
    marginBottom: Spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityLocation: {
    ...Typography.bodyRegular,
    color: Colors.text,
    fontSize: 14,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
