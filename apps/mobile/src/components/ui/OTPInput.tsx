import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
}: OTPInputProps) {
  const hiddenInputRef = useRef<TextInput>(null);

  const digits = value.split('').slice(0, length);

  function handlePress() {
    if (!disabled) {
      hiddenInputRef.current?.focus();
    }
  }

  function handleChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
  }

  function getBoxStyle(index: number) {
    const isFilled = index < digits.length;
    const isFocused = index === digits.length && index < length;

    if (error) {
      return styles.boxError;
    }
    if (isFocused) {
      return styles.boxFocused;
    }
    if (isFilled) {
      return styles.boxFilled;
    }
    return styles.boxDefault;
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        textContentType="oneTimeCode"
        editable={!disabled}
        caretHidden
      />

      <Pressable
        style={styles.boxRow}
        onPress={handlePress}
      >
        {Array.from({ length }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              getBoxStyle(index),
              disabled && styles.boxDisabled,
            ]}
          >
            <Text style={[styles.digit, error && styles.digitError]}>
              {digits[index] ?? ''}
            </Text>
          </View>
        ))}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  box: {
    width: 44,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  boxDefault: {
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  boxFocused: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  boxError: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  boxFilled: {
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  boxDisabled: {
    opacity: 0.4,
  },
  digit: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  digitError: {
    color: '#FF3B30',
  },
});
