import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location } from '@/common/database/entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';

const STAMBA_ID = 'loc-stamba-0001-0001-000000000001';
const RADIO_CITY_ID = 'loc-radio-0001-0001-000000000002';
const ROOMS_BATUMI_ID = 'loc-batumi-0001-0001-000000000003';

function createMockLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: STAMBA_ID,
    name: 'D Block Stamba',
    city: 'Tbilisi',
    address: '14 Merab Kostava St, Tbilisi',
    timezone: 'Asia/Tbilisi',
    currency: 'GEL',
    latitude: 41.715138,
    longitude: 44.788596,
    phone: '+995322123456',
    email: 'stamba@dblock.ge',
    operatingHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
    },
    imageUrl: 'https://cdn.dblock.ge/locations/stamba.jpg',
    isActive: true,
    resources: [],
    metadata: null,
    createdBy: mockUserId,
    updatedBy: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as Location;
}

const stambaLocation = createMockLocation();
const radioCityLocation = createMockLocation({
  id: RADIO_CITY_ID,
  name: 'D Block Radio City',
  address: '3 Al. Kazbegi Ave, Tbilisi',
  email: 'radiocity@dblock.ge',
});
const roomsBatumiLocation = createMockLocation({
  id: ROOMS_BATUMI_ID,
  name: 'D Block Rooms Batumi',
  city: 'Batumi',
  address: '15 Rustaveli St, Batumi',
  email: 'batumi@dblock.ge',
});

const allLocations = [stambaLocation, radioCityLocation, roomsBatumiLocation];

// ---------------------------------------------------------------------------
// Query builder mock factory
// ---------------------------------------------------------------------------

function createMockQueryBuilder(returnData?: any) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'select',
    'addSelect',
    'groupBy',
    'addGroupBy',
    'limit',
    'update',
    'set',
    'from',
  ];

  for (const method of methods) {
    qb[method] = jest.fn().mockReturnThis();
  }

  qb['getManyAndCount'] = jest.fn().mockResolvedValue(returnData ?? [[], 0]);
  qb['getMany'] = jest.fn().mockResolvedValue(returnData?.[0] ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['getCount'] = jest.fn().mockResolvedValue(returnData ?? 0);
  qb['execute'] = jest.fn().mockResolvedValue(returnData ?? { affected: 0 });
  qb['getRawOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['getRawMany'] = jest.fn().mockResolvedValue(returnData ?? []);

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    locationRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || STAMBA_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    (locationRepo as any).manager = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: locationRepo },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([allLocations, 3]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: allLocations,
        total: 3,
        page: 1,
        limit: 20,
      });
      expect(qb['skip']).toHaveBeenCalledWith(0);
      expect(qb['take']).toHaveBeenCalledWith(20);
      expect(qb['orderBy']).toHaveBeenCalledWith('location.createdAt', 'DESC');
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ page: 2, limit: 10 });

      expect(qb['skip']).toHaveBeenCalledWith(10); // (2-1)*10
      expect(qb['take']).toHaveBeenCalledWith(10);
    });

    it('should filter by city', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[roomsBatumiLocation], 1]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ city: 'Batumi' });

      expect(qb['andWhere']).toHaveBeenCalledWith('location.city = :city', {
        city: 'Batumi',
      });
    });

    it('should filter by isActive', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([allLocations, 3]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ isActive: true });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'location.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should apply search filter with ILIKE on name, city, address', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[stambaLocation], 1]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'stamba' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        '(location.name ILIKE :search OR location.city ILIKE :search OR location.address ILIKE :search)',
        { search: '%stamba%' },
      );
    });

    it('should not apply city filter when city is undefined', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      locationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({});

      // andWhere should not have been called with city param
      const calls = qb['andWhere'].mock.calls;
      const hasCityFilter = calls.some(
        (call: any[]) => call[0] === 'location.city = :city',
      );
      expect(hasCityFilter).toBe(false);
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return Stamba location with resources relation', async () => {
      locationRepo.findOne.mockResolvedValueOnce(stambaLocation);

      const result = await service.findById(STAMBA_ID);

      expect(result).toEqual(stambaLocation);
      expect(locationRepo.findOne).toHaveBeenCalledWith({
        where: { id: STAMBA_ID },
        relations: ['resources'],
      });
    });

    it('should return Radio City location', async () => {
      locationRepo.findOne.mockResolvedValueOnce(radioCityLocation);

      const result = await service.findById(RADIO_CITY_ID);

      expect(result.name).toBe('D Block Radio City');
    });

    it('should return Rooms Batumi location', async () => {
      locationRepo.findOne.mockResolvedValueOnce(roomsBatumiLocation);

      const result = await service.findById(ROOMS_BATUMI_ID);

      expect(result.city).toBe('Batumi');
    });

    it('should throw NotFoundException when location is not found', async () => {
      locationRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include the ID in the error message', async () => {
      locationRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('bad-id')).rejects.toThrow(
        'Location with ID "bad-id" not found',
      );
    });
  });

  // =========================================================================
  // findActive
  // =========================================================================

  describe('findActive', () => {
    it('should return only active locations sorted by name ASC', async () => {
      locationRepo.find.mockResolvedValueOnce(allLocations);

      const result = await service.findActive();

      expect(result).toEqual(allLocations);
      expect(locationRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no active locations exist', async () => {
      locationRepo.find.mockResolvedValueOnce([]);

      const result = await service.findActive();

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe('create', () => {
    it('should create Stamba location with all fields', async () => {
      const dto: CreateLocationDto = {
        name: 'D Block Stamba',
        city: 'Tbilisi',
        address: '14 Merab Kostava St, Tbilisi',
        timezone: 'Asia/Tbilisi',
        currency: 'GEL',
        latitude: 41.715138,
        longitude: 44.788596,
        phone: '+995322123456',
        email: 'stamba@dblock.ge',
        isActive: true,
      };

      locationRepo.save.mockResolvedValueOnce({ ...dto, id: STAMBA_ID, createdBy: mockUserId });

      const result = await service.create(dto, mockUserId);

      expect(locationRepo.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: mockUserId,
      });
      expect(locationRepo.save).toHaveBeenCalled();
      expect(result.createdBy).toBe(mockUserId);
    });

    it('should create Radio City location', async () => {
      const dto: CreateLocationDto = {
        name: 'D Block Radio City',
        city: 'Tbilisi',
        address: '3 Al. Kazbegi Ave, Tbilisi',
      };

      locationRepo.save.mockResolvedValueOnce({
        ...dto,
        id: RADIO_CITY_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(result.name).toBe('D Block Radio City');
    });

    it('should create Rooms Batumi location', async () => {
      const dto: CreateLocationDto = {
        name: 'D Block Rooms Batumi',
        city: 'Batumi',
        address: '15 Rustaveli St, Batumi',
      };

      locationRepo.save.mockResolvedValueOnce({
        ...dto,
        id: ROOMS_BATUMI_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(result.city).toBe('Batumi');
    });

    it('should set createdBy to the provided userId', async () => {
      const dto: CreateLocationDto = {
        name: 'Test Location',
        city: 'Tbilisi',
      };

      await service.create(dto, mockUserId);

      expect(locationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: mockUserId }),
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe('update', () => {
    it('should update location fields and set updatedBy', async () => {
      locationRepo.findOne.mockResolvedValueOnce({ ...stambaLocation });
      locationRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const dto: UpdateLocationDto = {
        name: 'D Block Stamba Updated',
        phone: '+995322999999',
      };

      const result = await service.update(STAMBA_ID, dto, mockUserId);

      expect(result.name).toBe('D Block Stamba Updated');
      expect(result.phone).toBe('+995322999999');
      expect(result.updatedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException when updating non-existent location', async () => {
      locationRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should preserve existing fields when only partial update is provided', async () => {
      locationRepo.findOne.mockResolvedValueOnce({ ...stambaLocation });
      locationRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const dto: UpdateLocationDto = { isActive: false };
      const result = await service.update(STAMBA_ID, dto, mockUserId);

      expect(result.isActive).toBe(false);
      expect(result.name).toBe('D Block Stamba'); // preserved
      expect(result.city).toBe('Tbilisi'); // preserved
    });
  });

  // =========================================================================
  // remove
  // =========================================================================

  describe('remove', () => {
    it('should soft-remove an existing location', async () => {
      locationRepo.findOne.mockResolvedValueOnce(stambaLocation);

      await service.remove(STAMBA_ID);

      expect(locationRepo.softRemove).toHaveBeenCalledWith(stambaLocation);
    });

    it('should throw NotFoundException when removing non-existent location', async () => {
      locationRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // getResourceCounts
  // =========================================================================

  describe('getResourceCounts', () => {
    it('should return resource counts grouped by type', async () => {
      const mockResult = [
        { type: 'meeting_room', count: 5 },
        { type: 'hot_desk', count: 20 },
        { type: 'office', count: 3 },
      ];

      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockResult);
      (locationRepo as any).manager.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getResourceCounts(STAMBA_ID);

      expect(result).toEqual(mockResult);
      expect(qb['where']).toHaveBeenCalledWith(
        'resource.location_id = :locationId',
        { locationId: STAMBA_ID },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.deleted_at IS NULL',
      );
      expect(qb['groupBy']).toHaveBeenCalledWith('resource.resource_type');
    });

    it('should return empty array when location has no resources', async () => {
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce([]);
      (locationRepo as any).manager.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getResourceCounts(ROOMS_BATUMI_ID);

      expect(result).toEqual([]);
    });
  });
});
