import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, AnimationTokens } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // D Block UX/UI spec: spring animation with specific params
    Animated.spring(logoOpacity, {
      toValue: 1,
      useNativeDriver: true,
      mass: AnimationTokens.springConfig.mass,
      stiffness: AnimationTokens.springConfig.stiffness,
      damping: AnimationTokens.springConfig.damping,
    }).start();

    // Auto-advance to welcome screen after delay
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, AnimationTokens.splashDelay);

    return () => clearTimeout(timer);
  }, [router, logoOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>D</Text>
        </View>
        <Text style={styles.logoText}>D Block</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.black,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
});
