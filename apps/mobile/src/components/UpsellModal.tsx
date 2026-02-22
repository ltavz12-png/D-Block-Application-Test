import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface UpsellModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
}

export default function UpsellModal({ visible, onClose, featureName, description }: UpsellModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  function handleUpgrade() {
    onClose();
    router.push('/plans');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={40} color={Colors.secondary} />
          </View>

          <Text style={styles.title}>
            {featureName} {t('upsell.isPremium')}
          </Text>

          <Text style={styles.description}>
            {description ?? t('upsell.defaultDescription')}
          </Text>

          <View style={styles.planPreview}>
            <View style={styles.planRow}>
              <View style={styles.planDot} />
              <Text style={styles.planText}>Starter Plan — 350 GEL/mo</Text>
            </View>
            <View style={styles.planRow}>
              <View style={[styles.planDot, { backgroundColor: '#FFD60A' }]} />
              <Text style={styles.planText}>Premium Plan — 850 GEL/mo</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Ionicons name="arrow-up-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.upgradeBtnText}>{t('upsell.upgradeNow')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissText}>{t('upsell.maybeLater')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, width: '100%', maxWidth: 400,
    alignItems: 'center', ...Shadows.lg,
  },
  closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, alignItems: 'center',
    justifyContent: 'center', marginBottom: Spacing.lg,
    borderWidth: 2, borderColor: Colors.secondary,
  },
  title: {
    ...Typography.h3, color: Colors.text, textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodyRegular, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  planPreview: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34C759' },
  planText: { ...Typography.bodyMedium, color: Colors.text, fontSize: 14 },
  upgradeBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    width: '100%', justifyContent: 'center',
  },
  upgradeBtnText: { ...Typography.bodyBold, color: Colors.white },
  dismissBtn: { marginTop: Spacing.md },
  dismissText: { ...Typography.bodyRegular, color: Colors.textSecondary },
});
