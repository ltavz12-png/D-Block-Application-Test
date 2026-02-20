import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import {
  Resource,
  ResourceType,
  PricingModel,
} from '@/common/database/entities/resource.entity';
import { Booking, BookingStatus } from '@/common/database/entities/booking.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const LOCATION_STAMBA = 'loc-stamba-0001-0001-000000000001';

const ROOM_A_ID = 'res-room-a-0001-0001-000000000001';
const DESK_1_ID = 'res-desk-1-0001-0001-000000000002';
const OFFICE_1_ID = 'res-office-0001-0001-000000000003';
const BOX_1_ID = 'res-box-01-0001-0001-000000000004';

function createMockResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: ROOM_A_ID,
    name: 'Meeting Room A',
    locationId: LOCATION_STAMBA,
    location: undefined as any,
    resourceType: ResourceType.MEETING_ROOM,
    block: 'Block A',
    floor: '3rd Floor',
    size: 25.5,
    measurementUnit: 'sqm' as any,
    capacity: 10,
    pricingModel: PricingModel.HOURLY,
    pricingDetails: { perHour: 50, currency: 'GEL' },
    availabilityRules: [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00' },
    ],
    bookingRules: {
      minDurationMinutes: 30,
      maxDurationMinutes: 480,
      bufferMinutes: 15,
      advanceBookingDays: 30,
    },
    amenities: ['wifi', 'projector', 'whiteboard'],
    imageUrls: [],
    metadata: null,
    isActive: true,
    isBookable: true,
    saltoLockId: 'salto-lock-001',
    bookings: [],
    createdBy: mockUserId,
    updatedBy: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as Resource;
}

const mockRoomA = createMockResource();
const mockDesk1 = createMockResource({
  id: DESK_1_ID,
  name: 'Hot Desk 1',
  resourceType: ResourceType.HOT_DESK,
  capacity: 1,
  pricingModel: PricingModel.DAILY,
  pricingDetails: { perDay: 25, currency: 'GEL' },
});
const mockOffice1 = createMockResource({
  id: OFFICE_1_ID,
  name: 'Office Suite 1',
  resourceType: ResourceType.OFFICE,
  capacity: 6,
  pricingModel: PricingModel.MONTHLY,
  pricingDetails: { perMonth: 3000, currency: 'GEL' },
});
const mockBox1 = createMockResource({
  id: BOX_1_ID,
  name: 'Box 1',
  resourceType: ResourceType.BOX,
  capacity: 2,
  pricingModel: PricingModel.MONTHLY,
  pricingDetails: { perMonth: 1500, currency: 'GEL' },
});

// ---------------------------------------------------------------------------
// Query builder mock factory
// ---------------------------------------------------------------------------

function createMockQueryBuilder(returnData?: any) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'leftJoinAndSelect',
    'leftJoin',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'select',
    'addSelect',
    'groupBy',
    'having',
    'limit',
    'update',
    'set',
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

describe('ResourcesService', () => {
  let service: ResourcesService;
  let resourceRepo: Record<string, jest.Mock>;
  let bookingRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    resourceRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || ROOM_A_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    bookingRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getRepositoryToken(Resource), useValue: resourceRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const allResources = [mockRoomA, mockDesk1, mockOffice1, mockBox1];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([allResources, 4]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: allResources,
        total: 4,
        page: 1,
        limit: 20,
      });
      expect(qb['skip']).toHaveBeenCalledWith(0);
      expect(qb['take']).toHaveBeenCalledWith(20);
    });

    it('should filter by locationId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[mockRoomA], 1]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ locationId: LOCATION_STAMBA });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.locationId = :locationId',
        { locationId: LOCATION_STAMBA },
      );
    });

    it('should filter by resourceType (meeting_room)', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[mockRoomA], 1]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ resourceType: ResourceType.MEETING_ROOM });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.resourceType = :resourceType',
        { resourceType: ResourceType.MEETING_ROOM },
      );
    });

    it('should filter by isActive', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ isActive: true });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should filter by isBookable', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ isBookable: true });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.isBookable = :isBookable',
        { isBookable: true },
      );
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[mockRoomA], 1]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'Meeting' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.name ILIKE :search',
        { search: '%Meeting%' },
      );
    });

    it('should filter by minCapacity', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[mockRoomA, mockOffice1], 2]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ minCapacity: 5 });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.capacity >= :minCapacity',
        { minCapacity: 5 },
      );
    });

    it('should filter by pricingModel', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[mockRoomA], 1]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ pricingModel: PricingModel.HOURLY });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.pricingModel = :pricingModel',
        { pricingModel: PricingModel.HOURLY },
      );
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ page: 3, limit: 5 });

      expect(qb['skip']).toHaveBeenCalledWith(10); // (3-1)*5
      expect(qb['take']).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return a resource with location relation', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(mockRoomA);

      const result = await service.findById(ROOM_A_ID);

      expect(result).toEqual(mockRoomA);
      expect(resourceRepo.findOne).toHaveBeenCalledWith({
        where: { id: ROOM_A_ID },
        relations: ['location'],
      });
    });

    it('should throw NotFoundException when resource is not found', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include the ID in the error message', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('bad-id')).rejects.toThrow(
        'Resource with ID "bad-id" not found',
      );
    });
  });

  // =========================================================================
  // findByLocation
  // =========================================================================

  describe('findByLocation', () => {
    it('should return active bookable resources for a location', async () => {
      resourceRepo.find.mockResolvedValueOnce([mockRoomA, mockDesk1]);

      const result = await service.findByLocation(LOCATION_STAMBA);

      expect(result).toHaveLength(2);
      expect(resourceRepo.find).toHaveBeenCalledWith({
        where: {
          locationId: LOCATION_STAMBA,
          isActive: true,
          isBookable: true,
        },
        relations: ['location'],
        order: { name: 'ASC' },
      });
    });

    it('should filter by resource type when provided', async () => {
      resourceRepo.find.mockResolvedValueOnce([mockRoomA]);

      await service.findByLocation(LOCATION_STAMBA, ResourceType.MEETING_ROOM);

      expect(resourceRepo.find).toHaveBeenCalledWith({
        where: {
          locationId: LOCATION_STAMBA,
          isActive: true,
          isBookable: true,
          resourceType: ResourceType.MEETING_ROOM,
        },
        relations: ['location'],
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no matching resources', async () => {
      resourceRepo.find.mockResolvedValueOnce([]);

      const result = await service.findByLocation(
        LOCATION_STAMBA,
        ResourceType.PARKING,
      );

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // findAvailableForTimeRange
  // =========================================================================

  describe('findAvailableForTimeRange', () => {
    it('should return resources with no conflicting bookings', async () => {
      const qb = createMockQueryBuilder();
      qb['getMany'].mockResolvedValueOnce([mockRoomA]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const start = new Date('2025-06-15T10:00:00Z');
      const end = new Date('2025-06-15T12:00:00Z');

      const result = await service.findAvailableForTimeRange(
        LOCATION_STAMBA,
        ResourceType.MEETING_ROOM,
        start,
        end,
      );

      expect(result).toEqual([mockRoomA]);
      expect(qb['where']).toHaveBeenCalledWith(
        'resource.locationId = :locationId',
        { locationId: LOCATION_STAMBA },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'resource.resourceType = :type',
        { type: ResourceType.MEETING_ROOM },
      );
      expect(qb['having']).toHaveBeenCalledWith('COUNT(booking.id) = 0');
    });

    it('should exclude CANCELLED and NO_SHOW bookings', async () => {
      const qb = createMockQueryBuilder();
      qb['getMany'].mockResolvedValueOnce([]);
      resourceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const start = new Date('2025-06-15T10:00:00Z');
      const end = new Date('2025-06-15T12:00:00Z');

      await service.findAvailableForTimeRange(
        LOCATION_STAMBA,
        ResourceType.MEETING_ROOM,
        start,
        end,
      );

      expect(qb['leftJoin']).toHaveBeenCalledWith(
        'resource.bookings',
        'booking',
        expect.stringContaining('booking.status NOT IN (:...excludedStatuses)'),
        expect.objectContaining({
          excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
        }),
      );
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe('create', () => {
    it('should create a meeting room resource', async () => {
      const dto: CreateResourceDto = {
        name: 'Meeting Room A',
        locationId: LOCATION_STAMBA,
        resourceType: ResourceType.MEETING_ROOM,
        capacity: 10,
        pricingModel: PricingModel.HOURLY,
        amenities: ['wifi', 'projector'],
      };

      resourceRepo.save.mockResolvedValueOnce({
        ...dto,
        id: ROOM_A_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(resourceRepo.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: mockUserId,
      });
      expect(result.resourceType).toBe(ResourceType.MEETING_ROOM);
    });

    it('should create a hot desk resource', async () => {
      const dto: CreateResourceDto = {
        name: 'Hot Desk 1',
        locationId: LOCATION_STAMBA,
        resourceType: ResourceType.HOT_DESK,
        capacity: 1,
        pricingModel: PricingModel.DAILY,
      };

      resourceRepo.save.mockResolvedValueOnce({
        ...dto,
        id: DESK_1_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(result.resourceType).toBe(ResourceType.HOT_DESK);
    });

    it('should create an office resource', async () => {
      const dto: CreateResourceDto = {
        name: 'Office Suite 1',
        locationId: LOCATION_STAMBA,
        resourceType: ResourceType.OFFICE,
      };

      resourceRepo.save.mockResolvedValueOnce({
        ...dto,
        id: OFFICE_1_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(result.resourceType).toBe(ResourceType.OFFICE);
    });

    it('should create a box resource', async () => {
      const dto: CreateResourceDto = {
        name: 'Box 1',
        locationId: LOCATION_STAMBA,
        resourceType: ResourceType.BOX,
      };

      resourceRepo.save.mockResolvedValueOnce({
        ...dto,
        id: BOX_1_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto, mockUserId);

      expect(result.resourceType).toBe(ResourceType.BOX);
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe('update', () => {
    it('should update resource fields and set updatedBy', async () => {
      resourceRepo.findOne.mockResolvedValueOnce({ ...mockRoomA });
      resourceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const dto: UpdateResourceDto = {
        name: 'Meeting Room A Updated',
        capacity: 12,
      };

      const result = await service.update(ROOM_A_ID, dto, mockUserId);

      expect(result.name).toBe('Meeting Room A Updated');
      expect(result.capacity).toBe(12);
      expect(result.updatedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException when updating non-existent resource', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', { name: 'X' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // remove
  // =========================================================================

  describe('remove', () => {
    it('should soft-remove an existing resource', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(mockRoomA);

      await service.remove(ROOM_A_ID);

      expect(resourceRepo.softRemove).toHaveBeenCalledWith(mockRoomA);
    });

    it('should throw NotFoundException when removing non-existent resource', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // getAvailabilitySlots
  // =========================================================================

  describe('getAvailabilitySlots', () => {
    it('should return free slots when no bookings exist', async () => {
      const resource = createMockResource({
        availabilityRules: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
        ],
        bookingRules: { bufferMinutes: 0 },
      });
      resourceRepo.findOne.mockResolvedValueOnce(resource);

      const bookingQb = createMockQueryBuilder();
      bookingQb['getMany'].mockResolvedValueOnce([]);
      bookingRepo.createQueryBuilder.mockReturnValueOnce(bookingQb);

      // Monday
      const monday = new Date('2025-06-16'); // Monday

      const result = await service.getAvailabilitySlots(ROOM_A_ID, monday);

      expect(result).toEqual([{ start: '09:00', end: '18:00' }]);
    });

    it('should return empty array when no availability rules exist', async () => {
      const resource = createMockResource({
        availabilityRules: null,
      });
      resourceRepo.findOne.mockResolvedValueOnce(resource);

      const result = await service.getAvailabilitySlots(
        ROOM_A_ID,
        new Date('2025-06-16'),
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when day has no matching rule', async () => {
      const resource = createMockResource({
        availabilityRules: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' }, // Only Monday
        ],
      });
      resourceRepo.findOne.mockResolvedValueOnce(resource);

      // Sunday = dayOfWeek 0
      const sunday = new Date('2025-06-15');

      const result = await service.getAvailabilitySlots(ROOM_A_ID, sunday);

      expect(result).toEqual([]);
    });

    it('should subtract occupied slots and return free gaps', async () => {
      const resource = createMockResource({
        availabilityRules: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
        ],
        bookingRules: { bufferMinutes: 0 },
      });
      resourceRepo.findOne.mockResolvedValueOnce(resource);

      // Simulate a booking from 10:00 to 11:00
      const booking = {
        startTime: new Date('2025-06-16T10:00:00'),
        endTime: new Date('2025-06-16T11:00:00'),
      };

      const bookingQb = createMockQueryBuilder();
      bookingQb['getMany'].mockResolvedValueOnce([booking]);
      bookingRepo.createQueryBuilder.mockReturnValueOnce(bookingQb);

      const monday = new Date('2025-06-16');
      const result = await service.getAvailabilitySlots(ROOM_A_ID, monday);

      expect(result).toEqual([
        { start: '09:00', end: '10:00' },
        { start: '11:00', end: '18:00' },
      ]);
    });

    it('should apply buffer minutes around bookings', async () => {
      const resource = createMockResource({
        availabilityRules: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
        ],
        bookingRules: { bufferMinutes: 15 },
      });
      resourceRepo.findOne.mockResolvedValueOnce(resource);

      // Booking from 10:00 to 11:00
      const booking = {
        startTime: new Date('2025-06-16T10:00:00'),
        endTime: new Date('2025-06-16T11:00:00'),
      };

      const bookingQb = createMockQueryBuilder();
      bookingQb['getMany'].mockResolvedValueOnce([booking]);
      bookingRepo.createQueryBuilder.mockReturnValueOnce(bookingQb);

      const monday = new Date('2025-06-16');
      const result = await service.getAvailabilitySlots(ROOM_A_ID, monday);

      // Buffer extends the occupied slot: 09:45 - 11:15
      expect(result).toEqual([
        { start: '09:00', end: '09:45' },
        { start: '11:15', end: '18:00' },
      ]);
    });

    it('should throw NotFoundException when resource does not exist', async () => {
      resourceRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getAvailabilitySlots('non-existent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
