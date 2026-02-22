import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function TermsOfUseScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('legal.termsOfUse')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.bodyText}>
          {t('legal.termsContent')}
          {'\n\n'}
          By accessing or using the D Block mobile application and related services, you
          acknowledge that you have read, understood, and agree to be bound by these Terms
          of Use. If you do not agree to these terms, please do not use our services.
        </Text>

        <Text style={styles.sectionTitle}>2. Account Registration</Text>
        <Text style={styles.bodyText}>
          To access certain features of the D Block application, you must create an
          account. You agree to provide accurate, current, and complete information during
          registration and to keep your account information updated. You are responsible
          for maintaining the confidentiality of your login credentials and for all
          activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. Services</Text>
        <Text style={styles.bodyText}>
          D Block provides coworking space booking, membership management, community
          features, and event services through its application. We reserve the right to
          modify, suspend, or discontinue any part of our services at any time without
          prior notice. Service availability may vary by location.
        </Text>

        <Text style={styles.sectionTitle}>4. Bookings and Payments</Text>
        <Text style={styles.bodyText}>
          All bookings made through the application are subject to availability and our
          cancellation policy. Payments are processed securely through our payment
          partners. Refund policies vary depending on the type of booking and the
          cancellation timeframe.
        </Text>

        <Text style={styles.sectionTitle}>5. Privacy</Text>
        <Text style={styles.bodyText}>
          Your use of the D Block application is also governed by our Privacy Policy,
          which describes how we collect, use, and protect your personal information.
          Please review our Privacy Policy for more details.
        </Text>

        <Text style={styles.sectionTitle}>6. User Conduct</Text>
        <Text style={styles.bodyText}>
          You agree to use D Block spaces and services responsibly. Any misuse, including
          but not limited to property damage, harassment of other members, or violation of
          community guidelines, may result in the suspension or termination of your account.
        </Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.bodyText}>
          All content, trademarks, and materials available through the D Block application
          are the property of D Block or its licensors. You may not reproduce, distribute,
          or create derivative works without prior written consent.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.bodyText}>
          D Block shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of or inability to use our services.
          Our total liability shall not exceed the amounts paid by you in the twelve months
          preceding the claim.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.bodyText}>
          We may terminate or suspend your account and access to our services at our sole
          discretion, without prior notice, for conduct that we believe violates these
          Terms of Use or is harmful to other users, us, or third parties.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.bodyText}>
          D Block reserves the right to update these Terms of Use at any time. We will
          notify you of significant changes through the application or via email.
          Continued use of the service after changes constitutes acceptance of the updated
          terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.bodyText}>
          If you have any questions about these Terms of Use, please contact us through the
          Help & Support section in the application or email us at support@dblock.ge.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
});
