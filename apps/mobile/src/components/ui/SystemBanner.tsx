import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';

type BannerVariant = 'info' | 'warning' | 'error';

interface SystemBannerProps {
  variant: BannerVariant;
  message: string;
  onDismiss?: () => void;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const VARIANT_CONFIG: Record<
  BannerVariant,
  { bg: string; icon: IoniconsName; iconColor: string; textColor: string }
> = {
  info: {
    bg: '#D1ECF1',
    icon: 'information-circle-outline',
    iconColor: '#0C5460',
    textColor: '#0C5460',
  },
  warning: {
    bg: '#FFF3CD',
    icon: 'warning-outline',
    iconColor: '#856404',
    textColor: '#856404',
  },
  error: {
    bg: '#F8D7DA',
    icon: 'alert-circle-outline',
    iconColor: '#721C24',
    textColor: '#721C24',
  },
};

export default function SystemBanner({
  variant,
  message,
  onDismiss,
}: SystemBannerProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Ionicons
        name={config.icon}
        size={20}
        color={config.iconColor}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: config.textColor }]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={config.iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: 10,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
});
