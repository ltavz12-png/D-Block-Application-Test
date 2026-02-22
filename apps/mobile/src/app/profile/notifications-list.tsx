import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useMyNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/api';
import type { Notification } from '@/services/notifications';

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'booking': return 'calendar-outline';
    case 'payment': return 'card-outline';
    case 'membership': return 'people-outline';
    case 'promotion': return 'gift-outline';
    default: return 'notifications-outline';
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useMyNotifications({ limit: 50 });
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const notifications = data?.data ?? [];

  function handlePress(notif: Notification) {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
  }

  function handleDelete(notif: Notification) {
    Alert.alert(t('notifications.deleteTitle'), t('notifications.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteNotif.mutate(notif.id),
      },
    ]);
  }

  function renderItem({ item }: { item: Notification }) {
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.isRead && styles.notifUnread]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.notifIcon}>
          <Ionicons name={getNotificationIcon(item.type) as any} size={20} color={Colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        <TouchableOpacity onPress={() => markAllRead.mutate()}>
          <Ionicons name="checkmark-done-outline" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.secondary} style={{ flex: 1 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  listContent: { paddingBottom: Spacing.xxl },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifUnread: { backgroundColor: Colors.surface },
  notifIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  notifTitle: { ...Typography.bodyMedium, color: Colors.text, marginBottom: 2 },
  notifBody: { ...Typography.bodyRegular, color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  notifTime: { ...Typography.caption, color: Colors.textSecondary },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.secondary, marginTop: 6,
  },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  emptyText: { ...Typography.bodyRegular, color: Colors.textSecondary },
});
