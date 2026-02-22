import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useLocations, useInviteVisitor } from '@/hooks/api';

export default function InviteVisitorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: locations } = useLocations();
  const inviteMutation = useInviteVisitor();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const canSubmit = name.trim() && selectedLocationId && date;

  function handleSubmit() {
    inviteMutation.mutate(
      {
        locationId: selectedLocationId,
        visitorName: name.trim(),
        visitorEmail: email.trim() || undefined,
        visitorPhone: phone.trim() || undefined,
        expectedDate: date,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            t('visitors.inviteSent'),
            t('visitors.inviteSentMessage'),
            [{ text: t('common.ok'), onPress: () => router.back() }],
          );
        },
        onError: () => Alert.alert(t('common.error'), t('visitors.inviteFailed')),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('visitors.inviteVisitor')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>{t('visitors.visitorName')} *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('visitors.namePlaceholder')}
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>{t('visitors.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('visitors.emailPlaceholder')}
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t('visitors.phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+995 XXX XXX XXX"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>{t('visitors.location')} *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={styles.locationsRow}>
            {(locations ?? []).map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.locationChip,
                  selectedLocationId === loc.id && styles.locationChipActive,
                ]}
                onPress={() => setSelectedLocationId(loc.id)}
              >
                <Text
                  style={[
                    styles.locationChipText,
                    selectedLocationId === loc.id && styles.locationChipTextActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>{t('visitors.date')} *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>{t('visitors.notes')}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('visitors.notesPlaceholder')}
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || inviteMutation.isPending) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || inviteMutation.isPending}
        >
          {inviteMutation.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t('visitors.sendInvitation')}</Text>
          )}
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
  label: { ...Typography.bodyMedium, color: Colors.text, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    ...Typography.bodyRegular, color: Colors.text,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { height: 80 },
  locationsRow: { flexDirection: 'row', gap: Spacing.sm },
  locationChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  locationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  locationChipText: { ...Typography.bodyMedium, color: Colors.text, fontSize: 14 },
  locationChipTextActive: { color: Colors.white },
  footer: {
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  submitBtnText: { ...Typography.bodyBold, color: Colors.white },
  btnDisabled: { opacity: 0.5 },
});
