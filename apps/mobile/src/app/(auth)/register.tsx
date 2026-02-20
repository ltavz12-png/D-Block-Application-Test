import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Language = 'en' | 'ka';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (i18n.language as Language) || 'en',
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), 'Please fill in all required fields');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(t('common.error'), 'Please agree to the terms and conditions');
      return;
    }

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        preferredLanguage: selectedLanguage,
      });
    } catch {
      Alert.alert(t('common.error'), 'Registration failed. Please try again.');
    }
  }

  function handleLogin() {
    router.back();
  }

  function handleLanguageSelect(lang: Language) {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleLogin} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('auth.registerTitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={t('auth.firstName')}
              placeholder={t('auth.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              leftIcon="person-outline"
            />

            <Input
              label={t('auth.lastName')}
              placeholder={t('auth.lastName')}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              leftIcon="person-outline"
            />

            <Input
              label={t('auth.email')}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
            />

            <Input
              label={`${t('auth.phone')} (${t('common.cancel').toLowerCase()})`}
              placeholder={t('auth.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            {/* Language Selector */}
            <View style={styles.languageSection}>
              <Text style={styles.languageLabel}>{t('profile.language')}</Text>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    selectedLanguage === 'en' && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect('en')}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === 'en' &&
                        styles.languageOptionTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    selectedLanguage === 'ka' && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect('ka')}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguage === 'ka' &&
                        styles.languageOptionTextActive,
                    ]}
                  >
                    KA
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={Colors.white} />
                )}
              </View>
              <Text style={styles.termsText}>
                {t('auth.termsAndConditions')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('auth.register')}
              onPress={handleRegister}
              loading={isLoading}
              variant="primary"
              size="lg"
              disabled={!agreedToTerms}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  form: {
    gap: Spacing.md,
  },
  languageSection: {
    gap: Spacing.sm,
  },
  languageLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  languageOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  languageOptionActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
  },
  languageOptionText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  languageOptionTextActive: {
    color: Colors.white,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  termsText: {
    ...Typography.bodyRegular,
    color: Colors.text,
    flex: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.bodyMedium,
    color: Colors.secondary,
  },
});
