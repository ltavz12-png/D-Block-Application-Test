import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useCommunityPosts, useCommunityMembers, useEvents, useLikePost, useUnlikePost } from '@/hooks/api';
import type { CommunityPost, CommunityMember } from '@/services/community';
import type { Event } from '@/services/events';

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

function PostItem({ post }: { post: CommunityPost }) {
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likesCount);

  function handleLike() {
    if (liked) {
      unlikeMutation.mutate(post.id);
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      likeMutation.mutate(post.id);
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  const initials = `${post.author.firstName[0]}${post.author.lastName[0]}`;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>
            {post.author.firstName} {post.author.lastName}
          </Text>
          <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? Colors.secondary : Colors.textSecondary}
          />
          <Text style={[styles.actionText, liked && { color: Colors.secondary }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MemberCard({ member }: { member: CommunityMember }) {
  const initials = `${member.firstName[0]}${member.lastName[0]}`;
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.memberName} numberOfLines={1}>
        {member.firstName} {member.lastName}
      </Text>
      <Text style={styles.memberRole} numberOfLines={1}>
        {member.role}
      </Text>
    </View>
  );
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={styles.eventCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.eventDateBadge}>
        <Text style={styles.eventDateText}>{dateStr}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventLocation} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          {' '}{event.locationName}
        </Text>
      </View>
      <Text style={styles.eventPrice}>
        {event.isFree ? 'Free' : `${event.price} ${event.currency}`}
      </Text>
    </TouchableOpacity>
  );
}

type TabKey = 'feed' | 'members' | 'events';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const { data: posts, isLoading: postsLoading } = useCommunityPosts();
  const { data: members, isLoading: membersLoading } = useCommunityMembers();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'feed', label: t('community.feed') },
    { key: 'members', label: t('community.members') },
    { key: 'events', label: t('community.events') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('community.title')}</Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'feed' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {postsLoading ? (
            <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
          ) : (posts ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('community.noPosts')}</Text>
            </View>
          ) : (
            (posts ?? []).map((post) => <PostItem key={post.id} post={post} />)
          )}
        </ScrollView>
      )}

      {activeTab === 'members' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {membersLoading ? (
            <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
          ) : (
            <View style={styles.membersGrid}>
              {(members ?? []).map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'events' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {eventsLoading ? (
            <ActivityIndicator color={Colors.secondary} style={{ paddingVertical: Spacing.xl }} />
          ) : (events ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('community.noEvents')}</Text>
            </View>
          ) : (
            (events ?? []).map((event) => <EventCard key={event.id} event={event} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h2, color: Colors.text },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  tabPillActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.bodyMedium, color: Colors.textSecondary, fontSize: 14 },
  tabTextActive: { color: Colors.white },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  postAuthor: { ...Typography.bodyMedium, color: Colors.text },
  postTime: { ...Typography.caption, color: Colors.textSecondary },
  postBody: { ...Typography.bodyRegular, color: Colors.text, marginBottom: Spacing.md },
  postActions: { flexDirection: 'row', gap: Spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { ...Typography.caption, color: Colors.textSecondary },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  memberCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  memberAvatarText: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  memberName: { ...Typography.bodyMedium, color: Colors.text, textAlign: 'center', fontSize: 13 },
  memberRole: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  eventDateBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  eventDateText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  eventTitle: { ...Typography.bodyMedium, color: Colors.text },
  eventLocation: { ...Typography.caption, color: Colors.textSecondary },
  eventPrice: { ...Typography.bodyMedium, color: Colors.secondary, fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: { ...Typography.bodyRegular, color: Colors.textSecondary },
});
