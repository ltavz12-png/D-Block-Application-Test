import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { MembershipTier } from '@/utils/membership';

interface MembershipBadgeProps {
  tier: MembershipTier;
  style?: ViewStyle;
}

const BADGE_COLORS: Record<MembershipTier, { bg: string; text: string }> = {
  free: { bg: '#8E8E93', text: '#FFFFFF' },
  starter: { bg: '#34C759', text: '#FFFFFF' },
  premium: { bg: '#FFD60A', text: '#000000' },
  day_pass: { bg: '#007AFF', text: '#FFFFFF' },
};

const LABELS: Record<MembershipTier, string> = {
  free: 'FREE',
  starter: 'STARTER',
  premium: 'PREMIUM',
  day_pass: 'DAY PASS',
};

export default function MembershipBadge({ tier, style }: MembershipBadgeProps) {
  const colors = BADGE_COLORS[tier];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{LABELS[tier]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
