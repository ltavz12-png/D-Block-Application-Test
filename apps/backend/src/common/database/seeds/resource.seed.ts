import { DataSource } from 'typeorm';
import { Resource, ResourceType, MeasurementUnit, PricingModel } from '../entities/resource.entity';
import { Location } from '../entities/location.entity';

export async function seedResources(dataSource: DataSource): Promise<void> {
  const resourceRepo = dataSource.getRepository(Resource);
  const locationRepo = dataSource.getRepository(Location);

  const locations = await locationRepo.find();
  if (locations.length === 0) {
    console.warn('No locations found, skipping resource seed');
    return;
  }

  const locationMap = new Map<string, string>();
  for (const loc of locations) {
    locationMap.set(loc.name, loc.id);
  }

  // Default resources for each location
  const defaultResources = [
    { name: 'Meeting Room A', type: ResourceType.MEETING_ROOM, capacity: 8, size: 20, floor: '1', pricingModel: PricingModel.HOURLY, price: 50 },
    { name: 'Meeting Room B', type: ResourceType.MEETING_ROOM, capacity: 12, size: 30, floor: '1', pricingModel: PricingModel.HOURLY, price: 75 },
    { name: 'Hot Desk Zone', type: ResourceType.HOT_DESK, capacity: 1, size: 4, floor: '2', pricingModel: PricingModel.DAILY, price: 25 },
    { name: 'Hot Desk Premium', type: ResourceType.HOT_DESK, capacity: 1, size: 6, floor: '2', pricingModel: PricingModel.DAILY, price: 35 },
    { name: 'Fixed Desk 1', type: ResourceType.FIXED_DESK, capacity: 1, size: 6, floor: '2', pricingModel: PricingModel.MONTHLY, price: 450 },
    { name: 'Fixed Desk 2', type: ResourceType.FIXED_DESK, capacity: 1, size: 6, floor: '2', pricingModel: PricingModel.MONTHLY, price: 450 },
    { name: 'Private Office S', type: ResourceType.OFFICE, capacity: 4, size: 16, floor: '3', pricingModel: PricingModel.MONTHLY, price: 1800 },
    { name: 'Private Office M', type: ResourceType.OFFICE, capacity: 8, size: 30, floor: '3', pricingModel: PricingModel.MONTHLY, price: 3200 },
    { name: 'Private Office L', type: ResourceType.OFFICE, capacity: 16, size: 50, floor: '3', pricingModel: PricingModel.MONTHLY, price: 5500 },
    { name: 'Phone Booth 1', type: ResourceType.PHONE_BOOTH, capacity: 1, size: 2, floor: '1', pricingModel: PricingModel.HOURLY, price: 15 },
    { name: 'Event Space', type: ResourceType.EVENT_SPACE, capacity: 50, size: 100, floor: '1', pricingModel: PricingModel.HOURLY, price: 200 },
    { name: 'Parking Spot', type: ResourceType.PARKING, capacity: 1, size: 12, floor: 'B1', pricingModel: PricingModel.MONTHLY, price: 200 },
  ];

  let created = 0;
  let skipped = 0;

  for (const loc of locations) {
    for (const res of defaultResources) {
      const existing = await resourceRepo.findOne({
        where: { name: res.name, locationId: loc.id },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await resourceRepo.save(
        resourceRepo.create({
          name: res.name,
          locationId: loc.id,
          resourceType: res.type,
          floor: res.floor,
          size: res.size,
          measurementUnit: MeasurementUnit.SQM,
          capacity: res.capacity,
          pricingModel: res.pricingModel,
          pricingDetails: {
            basePrice: res.price,
            currency: 'GEL',
          },
          isActive: true,
          isBookable: true,
          amenities: res.type === ResourceType.MEETING_ROOM
            ? ['WiFi', 'Whiteboard', 'TV Screen', 'Video Conferencing']
            : res.type === ResourceType.OFFICE
              ? ['WiFi', 'Air Conditioning', 'Printer Access']
              : ['WiFi'],
          imageUrls: [],
        }),
      );
      created++;
    }
  }

  console.log(`Resources: ${created} created, ${skipped} skipped`);
}
