import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleGetStarted() {
    router.push('/(auth)/register');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark gradient background layers */}
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />

      {/* Dark gradient overlay from bottom */}
      <View style={styles.gradientOverlay} />

      {/* Content pinned to bottom */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineRegular}>A growing community of</Text>
          <Text style={styles.headlineBold}>Startups</Text>
        </View>

        {/* Get Started button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>{t('onboarding.getStarted')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1E1E',
  },
  backgroundBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  headline: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  headlineRegular: {
    fontSize: 36,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 44,
  },
  headlineBold: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 44,
  },
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E1E1E',
  },
});
