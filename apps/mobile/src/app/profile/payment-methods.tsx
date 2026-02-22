import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const MOCK_CARDS: PaymentMethod[] = [
  { id: '1', brand: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
  { id: '2', brand: 'Mastercard', last4: '8888', expiry: '03/27', isDefault: false },
];

function getCardIcon(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'visa': return 'card-outline';
    case 'mastercard': return 'card-outline';
    default: return 'card-outline';
  }
}

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [cards] = useState<PaymentMethod[]>(MOCK_CARDS);

  function handleAddCard() {
    Alert.alert(t('paymentMethods.addCard'), t('paymentMethods.addCardMessage'));
  }

  function handleDelete(card: PaymentMethod) {
    Alert.alert(
      t('paymentMethods.deleteCard'),
      t('paymentMethods.deleteCardConfirm', { last4: card.last4 }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => {} },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('paymentMethods.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {cards.map((card) => (
          <View key={card.id} style={styles.cardItem}>
            <Ionicons name={getCardIcon(card.brand) as any} size={28} color={Colors.text} />
            <View style={{ flex: 1 }}>
              <View style={styles.cardRow}>
                <Text style={styles.cardBrand}>{card.brand}</Text>
                {card.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>{t('paymentMethods.default')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardNumber}>**** **** **** {card.last4}</Text>
              <Text style={styles.cardExpiry}>{t('paymentMethods.expires')} {card.expiry}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(card)}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={handleAddCard}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.secondary} />
          <Text style={styles.addBtnText}>{t('paymentMethods.addCard')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  cardItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardBrand: { ...Typography.bodyBold, color: Colors.text },
  defaultBadge: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.sm,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  defaultText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
  cardNumber: { ...Typography.bodyRegular, color: Colors.textSecondary, fontSize: 14 },
  cardExpiry: { ...Typography.caption, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
  },
  addBtnText: { ...Typography.bodyMedium, color: Colors.secondary },
});
