import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import MembershipBadge from '@/components/ui/MembershipBadge';
import { useMyActivePasses } from '@/hooks/api';
import { deriveTier } from '@/utils/membership';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingsItem({
  icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? Colors.error : Colors.text}
        />
        <Text
          style={[
            styles.settingsItemLabel,
            danger && styles.settingsItemLabelDanger,
          ]}
        >
          {label}
        </Text>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: activePasses } = useMyActivePasses();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'Guest User';
  const displayEmail = user?.email ?? 'guest@example.com';
  const activePass = activePasses?.[0];
  const activeTier = activePass ? deriveTier(activePass.product?.name ?? '') : null;

  function handleLogout() {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          {activeTier && (
            <MembershipBadge tier={activeTier} style={{ marginBottom: Spacing.xs }} />
          )}
          <Text style={styles.profileEmail}>{displayEmail}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="person-outline"
            label={t('profile.editProfile')}
            onPress={() => router.push('/profile/edit')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="card-outline"
            label={t('membership.title')}
            onPress={() => router.push('/profile/membership')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="wallet-outline"
            label={t('paymentMethods.title')}
            onPress={() => router.push('/profile/payment-methods')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="person-add-outline"
            label={t('visitors.inviteVisitor')}
            onPress={() => router.push('/profile/invite-visitor')}
          />
        </View>

        {/* Preferences Section */}
        <View style={[styles.settingsSection, { marginTop: Spacing.lg }]}>
          <SettingsItem
            icon="language-outline"
            label={t('profile.language')}
            onPress={() => router.push('/profile/language')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="notifications-outline"
            label={t('profile.notifications')}
            onPress={() => router.push('/profile/notifications')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="mail-outline"
            label={t('notifications.title')}
            onPress={() => router.push('/profile/notifications-list')}
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="shield-checkmark-outline"
            label={t('profile.twoFactor')}
            onPress={() => {
              Alert.alert(t('profile.twoFactor'), 'Two-factor authentication setup coming soon.');
            }}
          />
        </View>

        {/* Support & Legal Section */}
        <View style={[styles.settingsSection, { marginTop: Spacing.lg }]}>
          <SettingsItem
            icon="help-circle-outline"
            label={t('profile.helpSupport')}
            onPress={() => router.push('/profile/support')}
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.settingsSection, { marginTop: Spacing.lg }]}>
          <SettingsItem
            icon="log-out-outline"
            label={t('profile.logout')}
            onPress={handleLogout}
            showChevron={false}
            danger
          />
          <View style={styles.separator} />
          <SettingsItem
            icon="trash-outline"
            label={t('deleteAccount.title')}
            onPress={() => router.push('/profile/delete-account')}
            showChevron={false}
            danger
          />
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
    paddingBottom: Spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  profileEmail: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  settingsSection: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingsItemLabel: {
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  settingsItemLabelDanger: {
    color: Colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  logoutSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
});
