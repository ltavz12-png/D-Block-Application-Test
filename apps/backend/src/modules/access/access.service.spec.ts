import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessService } from './access.service';
import {
  AccessKey,
  AccessKeyStatus,
  AccessLevel,
} from '@/common/database/entities/access-key.entity';
import { AccessLog } from '@/common/database/entities/access-log.entity';
import { SaltoKsGateway } from './gateways/salto-ks.gateway';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const LOCATION_ID = 'loc-stamba-0001-0001-000000000001';
const KEY_ID = 'key-0001-0001-0001-000000000001';
const SALTO_KEY_ID = 'salto-key-001';
const BOOKING_ID = 'booking-0001-0001-000000000001';
const VISITOR_ID = 'visitor-0001-0001-000000000001';

function createMockAccessKey(overrides: Partial<AccessKey> = {}): AccessKey {
  return {
    id: KEY_ID,
    userId: mockUserId,
    saltoKeyId: SALTO_KEY_ID,
    accessLevel: AccessLevel.COMMON_AREAS,
    locationId: LOCATION_ID,
    resourceIds: [],
    status: AccessKeyStatus.ACTIVE,
    validFrom: new Date('2025-06-01'),
    validUntil: new Date('2025-07-01'),
    sourceType: 'booking',
    sourceId: BOOKING_ID,
    isVisitorKey: false,
    timeRestrictions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as AccessKey;
}

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
    'skip',
    'take',
    'select',
    'addSelect',
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

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AccessService', () => {
  let service: AccessService;
  let accessKeyRepo: Record<string, jest.Mock>;
  let accessLogRepo: Record<string, jest.Mock>;
  let saltoKsGateway: Record<string, jest.Mock>;

  beforeEach(async () => {
    accessKeyRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || KEY_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    accessLogRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: 'log-001' }),
      ),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    saltoKsGateway = {
      listAccessGroups: jest.fn().mockResolvedValue([
        { id: 'group-common', name: 'Stamba Common Areas' },
        { id: 'group-all', name: 'Stamba All Areas' },
      ]),
      issueKey: jest.fn().mockResolvedValue({ id: SALTO_KEY_ID }),
      revokeKey: jest.fn().mockResolvedValue(undefined),
      getRecentEvents: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessService,
        { provide: getRepositoryToken(AccessKey), useValue: accessKeyRepo },
        { provide: getRepositoryToken(AccessLog), useValue: accessLogRepo },
        { provide: SaltoKsGateway, useValue: saltoKsGateway },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock') },
        },
      ],
    }).compile();

    service = module.get<AccessService>(AccessService);
  });

  // =========================================================================
  // grantAccess
  // =========================================================================

  describe('grantAccess', () => {
    it('should create an access key with ACTIVE status', async () => {
      const dto = {
        userId: mockUserId,
        locationId: LOCATION_ID,
        accessLevel: AccessLevel.COMMON_AREAS,
        sourceType: 'booking',
        sourceId: BOOKING_ID,
        validFrom: '2025-06-01T00:00:00Z',
        validUntil: '2025-07-01T00:00:00Z',
      };

      const result = await service.grantAccess(dto);

      expect(saltoKsGateway.listAccessGroups).toHaveBeenCalled();
      expect(saltoKsGateway.issueKey).toHaveBeenCalled();
      expect(accessKeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          saltoKeyId: SALTO_KEY_ID,
          status: AccessKeyStatus.ACTIVE,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should resolve ALL_AREAS access group for OFFICE access level', async () => {
      const dto = {
        userId: mockUserId,
        locationId: LOCATION_ID,
        accessLevel: AccessLevel.OFFICE,
        sourceType: 'contract',
        sourceId: 'contract-001',
        validFrom: '2025-06-01T00:00:00Z',
      };

      await service.grantAccess(dto);

      // Should pick the "All Areas" group
      expect(saltoKsGateway.issueKey).toHaveBeenCalledWith(
        mockUserId,
        'group-all',
        expect.any(Date),
        undefined,
      );
    });

    it('should resolve COMMON_AREAS access group for COMMON_AREAS level', async () => {
      const dto = {
        userId: mockUserId,
        locationId: LOCATION_ID,
        accessLevel: AccessLevel.COMMON_AREAS,
        sourceType: 'pass',
        sourceId: 'pass-001',
        validFrom: '2025-06-01T00:00:00Z',
      };

      await service.grantAccess(dto);

      expect(saltoKsGateway.issueKey).toHaveBeenCalledWith(
        mockUserId,
        'group-common',
        expect.any(Date),
        undefined,
      );
    });

    it('should throw BadRequestException when no access groups are available', async () => {
      saltoKsGateway.listAccessGroups.mockResolvedValueOnce([]);

      const dto = {
        userId: mockUserId,
        locationId: LOCATION_ID,
        accessLevel: AccessLevel.COMMON_AREAS,
        sourceType: 'pass',
        sourceId: 'pass-001',
        validFrom: '2025-06-01T00:00:00Z',
      };

      await expect(service.grantAccess(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // revokeAccess
  // =========================================================================

  describe('revokeAccess', () => {
    it('should revoke an active access key', async () => {
      const key = createMockAccessKey();
      accessKeyRepo.findOne.mockResolvedValueOnce(key);
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.revokeAccess(KEY_ID, 'Pass cancelled');

      expect(result.status).toBe(AccessKeyStatus.REVOKED);
      expect(saltoKsGateway.revokeKey).toHaveBeenCalledWith(SALTO_KEY_ID);
    });

    it('should throw NotFoundException when key does not exist', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.revokeAccess('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when key is already revoked', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(
        createMockAccessKey({ status: AccessKeyStatus.REVOKED }),
      );

      await expect(service.revokeAccess(KEY_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should continue local revocation even if SaltoKS revocation fails', async () => {
      const key = createMockAccessKey();
      accessKeyRepo.findOne.mockResolvedValueOnce(key);
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      saltoKsGateway.revokeKey.mockRejectedValueOnce(
        new Error('SaltoKS unavailable'),
      );

      const result = await service.revokeAccess(KEY_ID);

      expect(result.status).toBe(AccessKeyStatus.REVOKED);
    });
  });

  // =========================================================================
  // suspendAccess
  // =========================================================================

  describe('suspendAccess', () => {
    it('should suspend an active access key', async () => {
      const key = createMockAccessKey();
      accessKeyRepo.findOne.mockResolvedValueOnce(key);
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.suspendAccess(KEY_ID);

      expect(result.status).toBe(AccessKeyStatus.SUSPENDED);
    });

    it('should throw NotFoundException when key does not exist', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.suspendAccess('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when key is not ACTIVE', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(
        createMockAccessKey({ status: AccessKeyStatus.REVOKED }),
      );

      await expect(service.suspendAccess(KEY_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // reactivateAccess
  // =========================================================================

  describe('reactivateAccess', () => {
    it('should reactivate a suspended access key', async () => {
      const key = createMockAccessKey({ status: AccessKeyStatus.SUSPENDED });
      accessKeyRepo.findOne.mockResolvedValueOnce(key);
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.reactivateAccess(KEY_ID);

      expect(result.status).toBe(AccessKeyStatus.ACTIVE);
    });

    it('should throw BadRequestException when key is not SUSPENDED', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(
        createMockAccessKey({ status: AccessKeyStatus.ACTIVE }),
      );

      await expect(service.reactivateAccess(KEY_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // grantBookingAccess
  // =========================================================================

  describe('grantBookingAccess', () => {
    it('should grant access for a booking with BOOKED_ROOMS level', async () => {
      const start = new Date('2025-06-15T10:00:00Z');
      const end = new Date('2025-06-15T12:00:00Z');

      await service.grantBookingAccess(
        BOOKING_ID,
        mockUserId,
        'resource-001',
        LOCATION_ID,
        start,
        end,
      );

      expect(accessKeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          accessLevel: AccessLevel.BOOKED_ROOMS,
          sourceType: 'booking',
          sourceId: BOOKING_ID,
          resourceIds: ['resource-001'],
        }),
      );
    });
  });

  // =========================================================================
  // grantVisitorAccess
  // =========================================================================

  describe('grantVisitorAccess', () => {
    it('should grant visitor access with COMMON_AREAS level and isVisitorKey=true', async () => {
      const validFrom = new Date('2025-06-15T09:00:00Z');
      const validUntil = new Date('2025-06-15T18:00:00Z');

      await service.grantVisitorAccess(
        VISITOR_ID,
        LOCATION_ID,
        validFrom,
        validUntil,
      );

      expect(accessKeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: VISITOR_ID,
          accessLevel: AccessLevel.COMMON_AREAS,
          isVisitorKey: true,
          sourceType: 'visitor',
          sourceId: VISITOR_ID,
        }),
      );
    });
  });

  // =========================================================================
  // revokeBookingAccess
  // =========================================================================

  describe('revokeBookingAccess', () => {
    it('should find and revoke the access key for a booking', async () => {
      const key = createMockAccessKey({
        sourceType: 'booking',
        sourceId: BOOKING_ID,
      });
      accessKeyRepo.findOne
        .mockResolvedValueOnce(key) // first find for revokeBookingAccess
        .mockResolvedValueOnce(key); // second find inside revokeAccess
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.revokeBookingAccess(BOOKING_ID);

      expect(saltoKsGateway.revokeKey).toHaveBeenCalled();
    });

    it('should not throw when no active key exists for booking', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(null);

      // Should complete without error
      await expect(
        service.revokeBookingAccess('non-existent-booking'),
      ).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // revokeVisitorAccess
  // =========================================================================

  describe('revokeVisitorAccess', () => {
    it('should find and revoke the visitor access key', async () => {
      const key = createMockAccessKey({
        sourceType: 'visitor',
        sourceId: VISITOR_ID,
        isVisitorKey: true,
      });
      accessKeyRepo.findOne
        .mockResolvedValueOnce(key)
        .mockResolvedValueOnce(key);
      accessKeyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.revokeVisitorAccess(VISITOR_ID);

      expect(saltoKsGateway.revokeKey).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // findAccessKeys
  // =========================================================================

  describe('findAccessKeys', () => {
    it('should return paginated access keys', async () => {
      const keys = [createMockAccessKey()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([keys, 1]);
      accessKeyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAccessKeys({ page: 1, limit: 20 } as any);

      expect(result).toEqual({ data: keys, total: 1, page: 1, limit: 20 });
    });

    it('should filter by userId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      accessKeyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAccessKeys({
        userId: mockUserId,
        page: 1,
        limit: 20,
      } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith('ak.userId = :userId', {
        userId: mockUserId,
      });
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      accessKeyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAccessKeys({
        status: AccessKeyStatus.ACTIVE,
        page: 1,
        limit: 20,
      } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith('ak.status = :status', {
        status: AccessKeyStatus.ACTIVE,
      });
    });
  });

  // =========================================================================
  // findAccessKeyById
  // =========================================================================

  describe('findAccessKeyById', () => {
    it('should return the access key', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(createMockAccessKey());

      const result = await service.findAccessKeyById(KEY_ID);

      expect(result.id).toBe(KEY_ID);
    });

    it('should throw NotFoundException when key is not found', async () => {
      accessKeyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findAccessKeyById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // getUserActiveKeys
  // =========================================================================

  describe('getUserActiveKeys', () => {
    it('should return active keys for a user', async () => {
      accessKeyRepo.find.mockResolvedValueOnce([createMockAccessKey()]);

      const result = await service.getUserActiveKeys(mockUserId);

      expect(result).toHaveLength(1);
      expect(accessKeyRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, status: AccessKeyStatus.ACTIVE },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // =========================================================================
  // checkExpiredKeys
  // =========================================================================

  describe('checkExpiredKeys', () => {
    it('should expire active keys past validUntil and return count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 3 });
      accessKeyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredKeys();

      expect(result).toBe(3);
      expect(qb['update']).toHaveBeenCalledWith(AccessKey);
      expect(qb['set']).toHaveBeenCalledWith({
        status: AccessKeyStatus.EXPIRED,
      });
    });

    it('should return 0 when no keys have expired', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      accessKeyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredKeys();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // syncSaltoEvents
  // =========================================================================

  describe('syncSaltoEvents', () => {
    it('should sync new events and return count', async () => {
      saltoKsGateway.getRecentEvents.mockResolvedValueOnce([
        {
          id: 'evt-001',
          userId: mockUserId,
          doorId: 'door-stamba-main',
          method: 'ble',
          direction: 'entry',
          granted: true,
        },
      ]);
      accessLogRepo.findOne.mockResolvedValueOnce(null); // not yet synced

      const result = await service.syncSaltoEvents();

      expect(result).toBe(1);
      expect(accessLogRepo.save).toHaveBeenCalled();
    });

    it('should skip already-synced events', async () => {
      saltoKsGateway.getRecentEvents.mockResolvedValueOnce([
        {
          id: 'evt-001',
          userId: mockUserId,
          doorId: 'door-stamba-main',
          method: 'ble',
          direction: 'entry',
          granted: true,
        },
      ]);
      accessLogRepo.findOne.mockResolvedValueOnce({ id: 'existing-log' }); // already synced

      const result = await service.syncSaltoEvents();

      expect(result).toBe(0);
    });

    it('should return 0 when no new events', async () => {
      saltoKsGateway.getRecentEvents.mockResolvedValueOnce([]);

      const result = await service.syncSaltoEvents();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // getAccessStats
  // =========================================================================

  describe('getAccessStats', () => {
    it('should return access stats for a location', async () => {
      accessKeyRepo.count.mockResolvedValueOnce(25);

      const qb = createMockQueryBuilder();
      qb['getRawOne'].mockResolvedValueOnce({
        totalEntries: '150',
        uniqueUsers: '42',
      });
      accessLogRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getAccessStats(LOCATION_ID);

      expect(result).toEqual({
        activeKeys: 25,
        totalEntriesToday: 150,
        uniqueUsersToday: 42,
      });
    });

    it('should return zeros when no activity', async () => {
      accessKeyRepo.count.mockResolvedValueOnce(0);

      const qb = createMockQueryBuilder();
      qb['getRawOne'].mockResolvedValueOnce(null);
      accessLogRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getAccessStats(LOCATION_ID);

      expect(result).toEqual({
        activeKeys: 0,
        totalEntriesToday: 0,
        uniqueUsersToday: 0,
      });
    });
  });
});
