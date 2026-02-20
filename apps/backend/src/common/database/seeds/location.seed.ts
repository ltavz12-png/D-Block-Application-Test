import { DataSource } from 'typeorm';
import { Location } from '../entities/location.entity';

export async function seedLocations(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Location);

  const locations = [
    {
      name: 'Stamba Workspace',
      city: 'Tbilisi',
      address: '14 Merab Kostava St, Tbilisi 0108, Georgia',
      timezone: 'Asia/Tbilisi',
      currency: 'GEL',
      latitude: 41.7103,
      longitude: 44.7929,
      operatingHours: {
        monday: { open: '09:00', close: '20:00' },
        tuesday: { open: '09:00', close: '20:00' },
        wednesday: { open: '09:00', close: '20:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '10:00', close: '18:00' },
        sunday: { open: '00:00', close: '00:00' },
      },
      isActive: true,
    },
    {
      name: 'Radio City',
      city: 'Tbilisi',
      address: 'Tbilisi, Georgia',
      timezone: 'Asia/Tbilisi',
      currency: 'GEL',
      latitude: 41.7069,
      longitude: 44.7919,
      operatingHours: {
        monday: { open: '09:00', close: '20:00' },
        tuesday: { open: '09:00', close: '20:00' },
        wednesday: { open: '09:00', close: '20:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '10:00', close: '18:00' },
        sunday: { open: '00:00', close: '00:00' },
      },
      isActive: true,
    },
    {
      name: 'Batumi Workspace',
      city: 'Batumi',
      address: 'Rooms Batumi, Batumi, Georgia',
      timezone: 'Asia/Tbilisi',
      currency: 'GEL',
      latitude: 41.6458,
      longitude: 41.6416,
      operatingHours: {
        monday: { open: '09:00', close: '20:00' },
        tuesday: { open: '09:00', close: '20:00' },
        wednesday: { open: '09:00', close: '20:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '10:00', close: '18:00' },
        sunday: { open: '00:00', close: '00:00' },
      },
      isActive: true,
    },
  ];

  for (const loc of locations) {
    const existing = await repo.findOne({ where: { name: loc.name } });
    if (!existing) {
      await repo.save(repo.create(loc));
    }
  }
}
