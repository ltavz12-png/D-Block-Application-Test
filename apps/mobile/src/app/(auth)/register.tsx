import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import CountrySearchSheet from '@/components/CountrySearchSheet';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [countryDial, setCountryDial] = useState('+995');
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  async function handleContinue() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (!phone.trim()) {
      Alert.alert(t('common.error'), t('auth.phoneRequired'));
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(t('common.error'), t('auth.acceptTerms'));
      return;
    }

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || `${phone.trim()}@placeholder.dblock`,
        password: password || `${countryDial}${phone.trim()}`,
        phone: `${countryDial}${phone.trim()}`,
        preferredLanguage: i18n.language as 'en' | 'ka',
      });
    } catch {
      Alert.alert(t('common.error'), t('auth.registerFailed'));
    }
  }

  function handleClose() {
    router.back();
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
          {/* Close Button */}
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1E1E1E" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{t('auth.signUpTitle')}</Text>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('auth.personalInfo')}</Text>

            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>{t('auth.firstName').toUpperCase()}</Text>
              <TextInput
                style={styles.inputValue}
                placeholder={t('auth.firstName')}
                placeholderTextColor="#C7C7CC"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>{t('auth.lastName').toUpperCase()}</Text>
              <TextInput
                style={styles.inputValue}
                placeholder={t('auth.lastName')}
                placeholderTextColor="#C7C7CC"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.helperText}>{t('auth.nameHelper')}</Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('auth.contactInfo')}</Text>

            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setCountrySheetVisible(true)}
              >
                <Text style={styles.countryCodeText}>{countryDial}</Text>
                <Ionicons name="chevron-down" size={14} color="#8E8E93" />
              </TouchableOpacity>

              <View style={[styles.inputField, { flex: 1 }]}>
                <Text style={styles.inputLabel}>{t('auth.mobileNumber').toUpperCase()}</Text>
                <TextInput
                  style={styles.inputValue}
                  placeholder="(555) 315 631"
                  placeholderTextColor="#C7C7CC"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Text style={styles.helperText}>{t('auth.phoneHelper')}</Text>
          </View>

          {/* Email (optional — backend requires it) */}
          <View style={styles.section}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>{t('auth.email').toUpperCase()}</Text>
              <TextInput
                style={styles.inputValue}
                placeholder="email@example.com"
                placeholderTextColor="#C7C7CC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.section}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>{t('auth.password').toUpperCase()}</Text>
              <TextInput
                style={styles.inputValue}
                placeholder={t('auth.password')}
                placeholderTextColor="#C7C7CC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Newsletter Card */}
          <View style={styles.newsletterCard}>
            <View style={styles.newsletterContent}>
              <Text style={styles.newsletterTitle}>{t('auth.newsletterTitle')}</Text>
              <Text style={styles.newsletterBody}>{t('auth.newsletterBody')}</Text>
              <TouchableOpacity>
                <Text style={styles.readMoreLink}>{t('auth.readMore')}</Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={newsletter}
              onValueChange={setNewsletter}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Consents */}
          <View style={styles.consentsSection}>
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.consentText}>
                {t('auth.consentTerms')}{' '}
                <Text
                  style={styles.consentLink}
                  onPress={() => router.push('/legal/terms')}
                >
                  {t('legal.termsOfUse')}
                </Text>
                {' & '}
                <Text
                  style={styles.consentLink}
                  onPress={() => router.push('/legal/privacy')}
                >
                  {t('legal.privacyPolicy')}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}>
                {agreedToPrivacy && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.consentText}>{t('auth.consentMarketing')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer — Continue button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!agreedToTerms || isLoading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!agreedToTerms || isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? t('common.loading') : t('common.next')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CountrySearchSheet
        visible={countrySheetVisible}
        onClose={() => setCountrySheetVisible(false)}
        onSelect={(country) => {
          setCountryDial(country.dial);
          setCountrySheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1E1E',
    marginTop: 24,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 12,
  },
  inputField: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1E1E1E',
    paddingVertical: 0,
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeButton: {
    width: 100,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1E1E1E',
  },
  newsletterCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  newsletterContent: {
    flex: 1,
    marginRight: 12,
  },
  newsletterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  newsletterBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4B4F55',
    lineHeight: 18,
    marginBottom: 8,
  },
  readMoreLink: {
    fontSize: 13,
    fontWeight: '400',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  consentsSection: {
    gap: 12,
    marginBottom: 24,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1E1E1E',
    borderColor: '#1E1E1E',
  },
  consentText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1E1E1E',
    flex: 1,
    lineHeight: 18,
  },
  consentLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Spacing.xl,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
