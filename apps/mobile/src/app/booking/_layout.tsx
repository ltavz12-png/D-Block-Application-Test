import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    />
  );
}
