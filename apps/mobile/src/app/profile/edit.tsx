import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useUpdateProfile } from '@/hooks/api';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  async function handleSave() {
    updateProfile.mutate(
      { firstName, lastName, phone: phone || undefined },
      {
        onSuccess: () => {
          refresh();
          Alert.alert('', t('profile.saved'));
          router.back();
        },
        onError: (error: any) => {
          Alert.alert(
            t('common.error'),
            error?.response?.data?.message ?? 'Failed to update profile',
          );
        },
      },
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('profile.editProfile') }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('profile.firstName')}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('profile.lastName')}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.email')}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email ?? ''}
            editable={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('profile.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+995 XXX XXX XXX"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, updateProfile.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
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
  inputDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
});
