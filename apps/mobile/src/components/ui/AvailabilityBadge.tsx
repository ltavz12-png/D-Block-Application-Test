import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface AvailabilityBadgeProps {
  available: boolean;
  label?: string;
  style?: ViewStyle;
}

const VARIANTS = {
  available: {
    bg: 'rgba(52,199,89,0.15)',
    text: '#34C759',
    dot: '#34C759',
    defaultLabel: 'Available',
  },
  unavailable: {
    bg: 'rgba(255,59,48,0.15)',
    text: '#FF3B30',
    dot: '#FF3B30',
    defaultLabel: 'Unavailable',
  },
} as const;

export default function AvailabilityBadge({
  available,
  label,
  style,
}: AvailabilityBadgeProps) {
  const variant = available ? VARIANTS.available : VARIANTS.unavailable;
  const displayLabel = label ?? variant.defaultLabel;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: variant.bg },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: variant.dot }]} />
      <Text style={[styles.text, { color: variant.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
