import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function SupportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    // Mock submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);

    Alert.alert('', t('profile.ticketSubmitted'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: t('profile.supportTitle') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info */}
        <View style={styles.contactCard}>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color={Colors.accent} />
            <Text style={styles.contactText}>support@dblock.ge</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color={Colors.accent} />
            <Text style={styles.contactText}>+995 32 000 0000</Text>
          </View>
        </View>

        {/* Support Form */}
        <Text style={styles.sectionTitle}>{t('profile.submitTicket')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.supportSubject')}</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder={t('profile.supportSubject')}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.supportMessage')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder={t('profile.supportMessage')}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{t('profile.submitTicket')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  contactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactText: {
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.bodyRegular,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});
