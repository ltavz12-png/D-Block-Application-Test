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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { useResources } from '@/hooks/api';
import type { Resource } from '@/services/resources';

const RESOURCE_ICONS: Record<string, string> = {
  meeting_room: 'people-outline',
  hot_desk: 'laptop-outline',
  fixed_desk: 'desktop-outline',
  private_office: 'business-outline',
  phone_booth: 'call-outline',
  event_space: 'calendar-outline',
  parking: 'car-outline',
};

function ResourceItem({ resource }: { resource: Resource }) {
  const { t } = useTranslation();
  const router = useRouter();

  const icon = RESOURCE_ICONS[resource.resourceType] ?? 'cube-outline';
  const price = resource.pricingDetails?.perHour ?? resource.pricingDetails?.basePrice ?? 0;
  const currency = resource.pricingDetails?.currency ?? 'GEL';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/booking/select-datetime',
          params: {
            resourceId: resource.id,
            resourceName: resource.name,
            resourceType: resource.resourceType,
            pricePerHour: String(price),
            currency,
          },
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={24} color={Colors.accent} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{resource.name}</Text>
            <Text style={styles.type}>
              {t(`booking.resourceType.${resource.resourceType}`, resource.resourceType)}
            </Text>
            <View style={styles.metaRow}>
              {resource.capacity > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{resource.capacity}</Text>
                </View>
              )}
              {resource.floor && (
                <View style={styles.metaItem}>
                  <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {t('booking.floor')} {resource.floor}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.priceCurrency}>{currency}{t('booking.perHour')}</Text>
          </View>
        </View>

        {resource.amenities.length > 0 && (
          <View style={styles.amenities}>
            {resource.amenities.slice(0, 4).map((amenity) => (
              <View key={amenity} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {resource.amenities.length > 4 && (
              <Text style={styles.moreAmenities}>+{resource.amenities.length - 4}</Text>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function SelectResourceScreen() {
  const { t } = useTranslation();
  const { locationId, locationName } = useLocalSearchParams<{
    locationId: string;
    locationName: string;
  }>();

  const { data: resources, isLoading } = useResources({
    locationId: locationId,
  });

  const bookableResources = (resources ?? []).filter((r) => r.isBookable && r.isActive);

  return (
    <>
      <Stack.Screen
        options={{
          title: locationName || t('booking.selectResource'),
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={bookableResources}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ResourceItem resource={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color={Colors.border} />
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
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
  type: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    ...Typography.bodyBold,
    color: Colors.accent,
    fontSize: 18,
  },
  priceCurrency: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  amenityTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  amenityText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  moreAmenities: {
    ...Typography.caption,
    color: Colors.secondary,
    alignSelf: 'center',
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
