import React, { useState } from 'react';
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

interface MenuItemProps {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color={Colors.text} />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

interface SettingsSubItemProps {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
}

function SettingsSubItem({ icon, label, onPress }: SettingsSubItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsSubItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={styles.settingsSubItemLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: activePasses } = useMyActivePasses();
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'Guest User';
  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'G';
  const activePass = activePasses?.[0];
  const activeTier = activePass ? deriveTier(activePass.product?.name ?? '') : null;

  function handleSignOut() {
    Alert.alert(t('menu.signOut'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menu.signOut'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>D Block</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            {activeTier && (
              <MembershipBadge tier={activeTier} style={{ marginTop: Spacing.xs }} />
            )}
          </View>
        </View>

        {/* Navigation Links */}
        <View style={styles.navSection}>
          <MenuItem
            icon="home-outline"
            label={t('menu.home')}
            onPress={() => router.replace('/(tabs)')}
          />
          <View style={styles.separator} />

          <MenuItem
            icon="calendar-outline"
            label={t('menu.bookings')}
            onPress={() => router.replace('/(tabs)/bookings')}
          />
          <View style={styles.separator} />

          <MenuItem
            icon="card-outline"
            label={t('menu.membership')}
            onPress={() => router.push('/profile/membership')}
          />
          <View style={styles.separator} />

          <MenuItem
            icon="people-outline"
            label={t('menu.community')}
            onPress={() => router.push('/community')}
          />
          <View style={styles.separator} />

          <MenuItem
            icon="ticket-outline"
            label={t('menu.events')}
            onPress={() => router.push('/events')}
          />
          <View style={styles.separator} />

          {/* Settings - expandable inline */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setSettingsExpanded(!settingsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemLabel}>{t('menu.settings')}</Text>
            </View>
            <Ionicons
              name={settingsExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {settingsExpanded && (
            <View style={styles.settingsSubSection}>
              <SettingsSubItem
                icon="language-outline"
                label={t('profile.language')}
                onPress={() => router.push('/profile/language')}
              />
              <SettingsSubItem
                icon="notifications-outline"
                label={t('profile.notifications')}
                onPress={() => router.push('/profile/notifications')}
              />
            </View>
          )}
          <View style={styles.separator} />

          <MenuItem
            icon="help-circle-outline"
            label={t('menu.support')}
            onPress={() => router.push('/profile/support')}
          />
          <View style={styles.separator} />

          <MenuItem
            icon="document-text-outline"
            label={t('menu.legal')}
            onPress={() => router.push('/legal/terms')}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.signOutText}>{t('menu.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmark: {
    ...Typography.h2,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...Typography.h3,
    color: Colors.white,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  navSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  settingsSubSection: {
    backgroundColor: Colors.background,
    paddingLeft: Spacing.lg,
  },
  settingsSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: Spacing.md,
  },
  settingsSubItemLabel: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  signOutText: {
    ...Typography.bodyMedium,
    color: '#FF3B30',
  },
});
