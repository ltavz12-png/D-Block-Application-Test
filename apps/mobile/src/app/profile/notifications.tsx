import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useUpdateNotifications } from '@/hooks/api';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const updateNotifications = useUpdateNotifications();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(false);

  function handleToggle(key: string, value: boolean) {
    const prefs: Record<string, boolean> = {
      push: pushEnabled,
      email: emailEnabled,
      sms: smsEnabled,
      marketing: marketingEnabled,
      bookingReminders: remindersEnabled,
      promotions: promotionsEnabled,
    };
    prefs[key] = value;

    switch (key) {
      case 'push': setPushEnabled(value); break;
      case 'email': setEmailEnabled(value); break;
      case 'sms': setSmsEnabled(value); break;
      case 'marketing': setMarketingEnabled(value); break;
      case 'bookingReminders': setRemindersEnabled(value); break;
      case 'promotions': setPromotionsEnabled(value); break;
    }

    updateNotifications.mutate(prefs as any, {
      onError: () => {
        Alert.alert(t('common.error'), 'Failed to update preferences');
      },
    });
  }

  const settings = [
    {
      title: t('profile.pushNotifications'),
      key: 'push',
      value: pushEnabled,
    },
    {
      title: t('profile.emailNotifications'),
      key: 'email',
      value: emailEnabled,
    },
    {
      title: t('profile.smsNotifications'),
      key: 'sms',
      value: smsEnabled,
    },
    {
      title: t('profile.bookingReminders'),
      key: 'bookingReminders',
      value: remindersEnabled,
    },
    {
      title: t('profile.promotions'),
      key: 'promotions',
      value: promotionsEnabled,
    },
    {
      title: t('profile.marketingEmails'),
      key: 'marketing',
      value: marketingEnabled,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: t('profile.notifications') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {settings.map((setting, index) => (
            <View
              key={setting.key}
              style={[
                styles.item,
                index < settings.length - 1 && styles.itemBorder,
              ]}
            >
              <Text style={styles.label}>{setting.title}</Text>
              <Switch
                value={setting.value}
                onValueChange={(value) => handleToggle(setting.key, value)}
                trackColor={{
                  false: Colors.border,
                  true: Colors.secondary + '80',
                }}
                thumbColor={setting.value ? Colors.secondary : Colors.surface}
              />
            </View>
          ))}
        </View>
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
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    ...Typography.bodyRegular,
    color: Colors.text,
    flex: 1,
  },
});
