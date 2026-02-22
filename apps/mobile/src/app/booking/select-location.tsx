import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useLocations } from '@/hooks/api';
import type { Location } from '@/services/locations';

function LocationItem({ location }: { location: Location }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/booking/select-resource',
          params: { locationId: location.id, locationName: location.name },
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Ionicons name="business-outline" size={28} color={Colors.accent} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{location.name}</Text>
            <Text style={styles.city}>{location.city}</Text>
            {location.address && (
              <Text style={styles.address} numberOfLines={1}>
                {location.address}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function SelectLocationScreen() {
  const { t } = useTranslation();
  const { data: locations, isLoading } = useLocations();

  return (
    <>
      <Stack.Screen options={{ title: t('booking.selectLocation') }} />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={locations ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LocationItem location={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={64} color={Colors.border} />
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  city: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  address: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
});
