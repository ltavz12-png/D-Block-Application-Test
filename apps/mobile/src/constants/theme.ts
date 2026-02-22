import { TextStyle } from 'react-native';

// D Block UX/UI Design Spec — Color Palette
export const Colors = {
  primary: '#1E1E1E',       // bg/highest dark, text primary, button bg
  secondary: '#E94560',     // D Block brand accent (admin consistency)
  accent: '#007AFF',        // iOS blue — toggle ON, focus ring, links
  background: '#FFFDFA',    // bg/neutral/lowest — light surfaces
  surface: '#F8F9FA',       // card backgrounds
  text: '#1E1E1E',          // text/primary
  textSecondary: '#8E8E93', // text/secondary — medium grey
  error: '#FF3B30',         // iOS red — destructive actions
  success: '#34C759',       // iOS green — availability, confirmed
  warning: '#FFD60A',       // premium badge yellow
  border: '#C7C7CC',        // light border
  divider: 'rgba(75, 79, 85, 0.10)', // 4B4F55 @ 10% — section separators
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const DarkColors = {
  primary: '#FFFFFF',
  secondary: '#E94560',
  accent: '#0A84FF',        // iOS dark mode blue
  background: '#000000',    // bg/highest dark
  surface: '#1E1E1E',
  text: '#F8F9FA',
  textSecondary: '#8E8E93',
  error: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
  border: '#38383A',
  divider: 'rgba(75, 79, 85, 0.20)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// D Block UX/UI Design Spec — Typography System
export const Typography: Record<string, TextStyle> = {
  displayHero: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: 0,
  },
  titleSmall: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyRegular: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Legacy aliases for backward compatibility
  h1: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0,
  },
} as const;

// D Block UX/UI Design Spec — Spacing Scale
export const Spacing = {
  xs: 4,    // icon inner gap
  sm: 8,    // OTP box gap
  smd: 12,  // card inner padding
  md: 16,   // standard horizontal margin
  lg: 24,   // section gaps
  xl: 32,   // large section gaps
  xxl: 48,  // screen top padding
} as const;

// D Block UX/UI Design Spec — Border Radii
export const BorderRadius = {
  xs: 4,    // checkbox
  sm: 8,    // OTP boxes
  md: 10,   // input fields, banners, badges
  lg: 16,   // cards, screen corners
  xl: 20,   // modal/sheet top, country code pill
  pill: 26, // primary/pill button (52px height / 2)
  full: 9999,
} as const;

// D Block UX/UI Design Spec — Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 5,
  },
} as const;

// D Block UX/UI Design Spec — Component Dimensions
export const ComponentDimensions = {
  buttonHeight: 52,
  inputHeight: 52,
  otpBoxWidth: 44,
  otpBoxHeight: 56,
  otpBoxGap: 8,
  toggleWidth: 51,
  toggleHeight: 31,
  checkboxSize: 20,
  tabBarHeight: 83,     // 49px + 34px safe area
  tabBarContentHeight: 49,
  safeAreaBottom: 34,
  avatarSmall: 32,
  avatarLarge: 72,
  minTouchTarget: 44,
  availabilityBadgeHeight: 24,
} as const;

// D Block UX/UI Design Spec — Animation Tokens
export const AnimationTokens = {
  splashDelay: 401,
  springConfig: {
    mass: 1,
    stiffness: 35.6,
    damping: 13.33,
  },
  toggleDuration: 200,
} as const;

export type ThemeColors = typeof Colors;

export const lightTheme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  components: ComponentDimensions,
  animation: AnimationTokens,
} as const;

export const darkTheme = {
  colors: DarkColors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  components: ComponentDimensions,
  animation: AnimationTokens,
} as const;

export type Theme = typeof lightTheme;
