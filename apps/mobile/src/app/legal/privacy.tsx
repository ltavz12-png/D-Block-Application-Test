import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>{t('legal.privacyPolicy')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.bodyText}>
          {t('legal.privacyContent')}
          {'\n\n'}
          This Privacy Policy explains how D Block collects, uses, discloses, and
          safeguards your personal information when you use our mobile application and
          services. Please read this policy carefully to understand our practices regarding
          your personal data.
        </Text>

        <Text style={styles.sectionTitle}>2. Data Collection</Text>
        <Text style={styles.bodyText}>
          We collect information that you provide directly to us, including your name,
          email address, phone number, and payment information when you register for an
          account, make a booking, or purchase a membership. We also collect usage data
          such as booking history, application activity, and device information.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
        <Text style={styles.bodyText}>
          We use the information we collect to provide and improve our services, process
          bookings and payments, communicate with you about your account, send you
          notifications about your bookings and membership, and personalize your experience
          within the D Block community.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.bodyText}>
          We do not sell your personal information to third parties. We may share your
          information with trusted service providers who assist us in operating our
          application, processing payments, and delivering services. All third-party
          providers are bound by confidentiality agreements.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.bodyText}>
          We implement appropriate technical and organizational measures to protect your
          personal data against unauthorized access, alteration, disclosure, or
          destruction. This includes encryption of data in transit and at rest, regular
          security audits, and access controls.
        </Text>

        <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
        <Text style={styles.bodyText}>
          Our application may use cookies and similar tracking technologies to enhance your
          experience, analyze usage patterns, and deliver relevant content. You can manage
          your cookie preferences through your device settings.
        </Text>

        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.bodyText}>
          You have the right to access, correct, or delete your personal data at any time.
          You may also request a copy of your data or restrict its processing. To exercise
          these rights, please contact us through the application or via email at
          privacy@dblock.ge.
        </Text>

        <Text style={styles.sectionTitle}>8. Data Retention</Text>
        <Text style={styles.bodyText}>
          We retain your personal information for as long as your account is active or as
          needed to provide you with our services. We may also retain certain information
          as required by law or for legitimate business purposes.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.bodyText}>
          Our services are not intended for individuals under the age of 18. We do not
          knowingly collect personal information from children. If we become aware that we
          have collected data from a minor, we will take steps to delete that information.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.bodyText}>
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes through the application or via email. Your continued use of
          our services after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.bodyText}>
          If you have any questions about this Privacy Policy or our data practices, please
          contact us through the Help & Support section in the application or email us at
          privacy@dblock.ge.
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
