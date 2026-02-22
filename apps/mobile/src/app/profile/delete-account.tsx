import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const REASONS = [
  'I no longer use the service',
  'I found a better alternative',
  'Privacy concerns',
  'Too expensive',
  'Other',
];

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  function handleDelete() {
    Alert.alert(
      t('deleteAccount.confirmTitle'),
      t('deleteAccount.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('deleteAccount.deleteForever'),
          style: 'destructive',
          onPress: () => {
            // Backend endpoint not yet implemented
            Alert.alert(
              t('deleteAccount.requestSent'),
              t('deleteAccount.requestSentMessage'),
              [{ text: t('common.ok'), onPress: () => logout() }],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('deleteAccount.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={32} color={Colors.error} />
          <Text style={styles.warningTitle}>{t('deleteAccount.warningTitle')}</Text>
          <Text style={styles.warningText}>{t('deleteAccount.warningMessage')}</Text>
        </View>

        <Text style={styles.reasonLabel}>{t('deleteAccount.reason')}</Text>
        {REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[styles.reasonItem, selectedReason === reason && styles.reasonItemActive]}
            onPress={() => setSelectedReason(reason)}
          >
            <Ionicons
              name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedReason === reason ? Colors.secondary : Colors.textSecondary}
            />
            <Text style={styles.reasonText}>{reason}</Text>
          </TouchableOpacity>
        ))}

        {selectedReason === 'Other' && (
          <TextInput
            style={[styles.input, styles.textarea]}
            value={otherReason}
            onChangeText={setOtherReason}
            placeholder={t('deleteAccount.otherReasonPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.white} />
          <Text style={styles.deleteBtnText}>{t('deleteAccount.deleteAccount')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  content: { padding: Spacing.lg },
  warningBox: {
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: '#FECACA',
  },
  warningTitle: { ...Typography.h3, color: Colors.error, marginTop: Spacing.sm },
  warningText: {
    ...Typography.bodyRegular, color: Colors.text,
    textAlign: 'center', marginTop: Spacing.sm,
  },
  reasonLabel: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.md },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  reasonItemActive: { borderWidth: 1, borderColor: Colors.secondary },
  reasonText: { ...Typography.bodyRegular, color: Colors.text },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    ...Typography.bodyRegular, color: Colors.text,
    marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 80 },
  footer: {
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  deleteBtn: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  deleteBtnText: { ...Typography.bodyBold, color: Colors.white },
});
