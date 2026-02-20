import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconsName;
  style?: ViewStyle;
}

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle; iconColor: string }
> = {
  primary: {
    container: {
      backgroundColor: Colors.secondary,
      borderWidth: 0,
    },
    text: { color: Colors.white },
    iconColor: Colors.white,
  },
  secondary: {
    container: {
      backgroundColor: Colors.primary,
      borderWidth: 0,
    },
    text: { color: Colors.white },
    iconColor: Colors.white,
  },
  outline: {
    container: {
      backgroundColor: Colors.transparent,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    text: { color: Colors.text },
    iconColor: Colors.text,
  },
  ghost: {
    container: {
      backgroundColor: Colors.transparent,
      borderWidth: 0,
    },
    text: { color: Colors.text },
    iconColor: Colors.text,
  },
  danger: {
    container: {
      backgroundColor: Colors.error,
      borderWidth: 0,
    },
    text: { color: Colors.white },
    iconColor: Colors.white,
  },
};

const sizeStyles: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle; iconSize: number }
> = {
  sm: {
    container: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
    },
    text: { fontSize: 14 },
    iconSize: 16,
  },
  md: {
    container: {
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
    },
    text: { fontSize: 16 },
    iconSize: 20,
  },
  lg: {
    container: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
    },
    text: { fontSize: 18 },
    iconSize: 22,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text.color as string}
        />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.iconColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyle.text,
              sizeStyle.text,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
