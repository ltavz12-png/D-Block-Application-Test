import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ka', label: 'ქართული', flag: 'GE' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  function handleSelect(code: string) {
    i18n.changeLanguage(code);
  }

  return (
    <>
      <Stack.Screen options={{ title: t('profile.language') }} />
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('profile.languageSelect')}</Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.item, isSelected && styles.itemSelected]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.flagContainer}>
                  <Text style={styles.flagText}>{lang.flag}</Text>
                </View>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {lang.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemSelected: {
    backgroundColor: Colors.secondary + '10',
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  label: {
    ...Typography.bodyRegular,
    color: Colors.text,
    flex: 1,
  },
  labelSelected: {
    ...Typography.bodyBold,
    color: Colors.secondary,
  },
});
