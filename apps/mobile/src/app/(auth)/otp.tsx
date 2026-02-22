import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const OTP_LENGTH = 6;

type OtpState = 'idle' | 'filled' | 'error' | 'lockout' | 'success';

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpState, setOtpState] = useState<OtpState>('idle');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-submit when all digits are entered
  useEffect(() => {
    const allFilled = otp.every((digit) => digit !== '');
    if (allFilled) {
      setOtpState('filled');
    }
  }, [otp]);

  // Auto-navigate on success
  useEffect(() => {
    if (otpState === 'success') {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpState, router]);

  function handleChangeText(text: string, index: number) {
    // Clear error state when user starts typing again
    if (otpState === 'error') {
      setOtpState('idle');
    }

    const newOtp = [...otp];

    // Handle paste of full code
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      digits.forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single digit input
    const digit = text.replace(/\D/g, '');
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleContinue() {
    if (otpState === 'lockout') return;

    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    // Mock verification: "123456" succeeds, anything else fails
    if (code === '123456') {
      setOtpState('success');
    } else {
      setOtpState('error');
    }
  }

  function handleResend() {
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpState('idle');
    inputRefs.current[0]?.focus();
  }

  function handleBack() {
    router.back();
  }

  function getBoxBorderColor(index: number): string {
    if (otpState === 'error') return '#FF3B30';
    if (otpState === 'success') return Colors.success;
    if (focusedIndex === index) return '#007AFF';
    return '#E5E5EA';
  }

  function getBoxBorderWidth(index: number): number {
    if (otpState === 'error') return 2;
    if (otpState === 'success') return 2;
    if (focusedIndex === index) return 2;
    return 1.5;
  }

  const displayPhone = phone || '+995 XXX XXX XXX';
  const isButtonDisabled =
    otpState === 'lockout' || otp.some((digit) => digit === '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Title and subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.phoneTitle}>{displayPhone}</Text>
            <Text style={styles.subtitle}>
              {t('otp.subtitle')}
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  {
                    borderColor: getBoxBorderColor(index),
                    borderWidth: getBoxBorderWidth(index),
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(event) => handleKeyPress(event, index)}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                selectTextOnFocus
                editable={otpState !== 'lockout' && otpState !== 'success'}
              />
            ))}
          </View>

          {/* Error / Lockout / Success messages */}
          {otpState === 'error' && (
            <Text style={styles.errorText}>{t('otp.invalidCode')}</Text>
          )}
          {otpState === 'lockout' && (
            <Text style={styles.lockoutText}>{t('otp.tooManyAttempts')}</Text>
          )}
          {otpState === 'success' && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.successText}>{t('otp.success')}</Text>
            </View>
          )}

          {/* Resend link */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendPrompt}>{t('otp.resendPrompt')} </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('otp.resend')}</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer to push button to bottom */}
          <View style={styles.spacer} />

          {/* Continue button pinned to bottom */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isButtonDisabled && styles.continueButtonDisabled,
              { marginBottom: insets.bottom > 0 ? 0 : Spacing.lg },
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isButtonDisabled}
          >
            <Text
              style={[
                styles.continueButtonText,
                isButtonDisabled && styles.continueButtonTextDisabled,
              ]}
            >
              {t('otp.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  phoneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  otpBox: {
    width: 44,
    height: 56,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  lockoutText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resendPrompt: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  resendLink: {
    ...Typography.caption,
    color: '#007AFF',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  continueButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#A0A0A0',
  },
});
