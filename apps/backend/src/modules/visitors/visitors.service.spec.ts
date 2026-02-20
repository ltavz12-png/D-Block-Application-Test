import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { Visitor, VisitorStatus } from '@/common/database/entities/visitor.entity';
import { EmailsService } from '@/modules/emails/emails.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { QueryVisitorsDto } from './dto/query-visitors.dto';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUuid = () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const mockHostUserId = 'host-0001-0001-0001-000000000001';
const mockLocationId = 'loc-00001-0001-0001-000000000001';

function createMockVisitor(overrides: Partial<Visitor> = {}): Visitor {
  return {
    id: mockUuid(),
    hostUserId: mockHostUserId,
    locationId: mockLocationId,
    visitorName: 'Jane Smith',
    visitorEmail: 'jane@example.com',
    visitorPhone: '+995555123456',
    visitorCompany: 'Acme Corp',
    purpose: 'Business meeting',
    expectedDate: new Date('2025-06-15'),
    expectedTime: '14:00',
    status: VisitorStatus.EXPECTED,
    checkedInAt: null,
    checkedOutAt: null,
    tempAccessKeyId: null,
    notificationSent: false,
    metadata: null,
    hostUser: undefined as any,
    location: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as Visitor;
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
    'insert',
    'into',
    'values',
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

describe('VisitorsService', () => {
  let service: VisitorsService;
  let visitorRepo: Record<string, jest.Mock>;
  let emailsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    visitorRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || mockUuid() })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    emailsService = {
      sendVisitorInvitation: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: getRepositoryToken(Visitor), useValue: visitorRepo },
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
  });

  // =========================================================================
  // inviteVisitor
  // =========================================================================

  describe('inviteVisitor', () => {
    const dto: CreateVisitorDto = {
      locationId: mockLocationId,
      visitorName: 'Jane Smith',
      visitorEmail: 'jane@example.com',
      visitorPhone: '+995555123456',
      visitorCompany: 'Acme Corp',
      purpose: 'Business meeting',
      expectedDate: '2025-06-15',
      expectedTime: '14:00',
    };

    it('should create a visitor with EXPECTED status', async () => {
      const savedVisitor = createMockVisitor();
      visitorRepo.save.mockResolvedValueOnce(savedVisitor);
      visitorRepo.findOne.mockResolvedValueOnce({
        ...savedVisitor,
        hostUser: { firstName: 'John', lastName: 'Doe' },
        location: { name: 'D Block Vake', address: '12 Chavchavadze Ave' },
      });
      // Second save after notificationSent = true
      visitorRepo.save.mockResolvedValueOnce({ ...savedVisitor, notificationSent: true });

      const result = await service.inviteVisitor(mockHostUserId, dto);

      expect(visitorRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hostUserId: mockHostUserId,
          locationId: dto.locationId,
          visitorName: dto.visitorName,
          visitorEmail: dto.visitorEmail,
          status: VisitorStatus.EXPECTED,
          notificationSent: false,
        }),
      );
      expect(visitorRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should send invitation email when visitorEmail is provided', async () => {
      const savedVisitor = createMockVisitor();
      visitorRepo.save.mockResolvedValueOnce(savedVisitor);
      visitorRepo.findOne.mockResolvedValueOnce({
        ...savedVisitor,
        hostUser: { firstName: 'John', lastName: 'Doe' },
        location: { name: 'D Block Vake', address: '12 Chavchavadze' },
      });
      visitorRepo.save.mockResolvedValueOnce({ ...savedVisitor, notificationSent: true });

      await service.inviteVisitor(mockHostUserId, dto);

      expect(emailsService.sendVisitorInvitation).toHaveBeenCalledWith(
        { email: dto.visitorEmail, name: dto.visitorName },
        expect.objectContaining({
          visitorName: dto.visitorName,
          hostName: 'John Doe',
          locationName: 'D Block Vake',
        }),
        'en',
        mockHostUserId,
      );
    });

    it('should set notificationSent to true after successful email', async () => {
      const savedVisitor = createMockVisitor();
      visitorRepo.save
        .mockResolvedValueOnce(savedVisitor)
        .mockResolvedValueOnce({ ...savedVisitor, notificationSent: true });
      visitorRepo.findOne.mockResolvedValueOnce({
        ...savedVisitor,
        hostUser: { firstName: 'John', lastName: 'Doe' },
        location: { name: 'D Block', address: 'Tbilisi' },
      });

      await service.inviteVisitor(mockHostUserId, dto);

      // Second save call should include notificationSent = true
      expect(visitorRepo.save).toHaveBeenCalledTimes(2);
      expect(visitorRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ notificationSent: true }),
      );
    });

    it('should handle email failure gracefully (not throw)', async () => {
      const savedVisitor = createMockVisitor();
      visitorRepo.save.mockResolvedValueOnce(savedVisitor);
      visitorRepo.findOne.mockResolvedValueOnce({
        ...savedVisitor,
        hostUser: { firstName: 'John', lastName: 'Doe' },
        location: { name: 'D Block', address: 'Tbilisi' },
      });
      emailsService.sendVisitorInvitation.mockRejectedValueOnce(
        new Error('SMTP connection failed'),
      );

      const result = await service.inviteVisitor(mockHostUserId, dto);

      // Should not throw; should return the saved visitor
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should NOT send email when visitorEmail is not provided', async () => {
      const dtoNoEmail: CreateVisitorDto = {
        locationId: mockLocationId,
        visitorName: 'Walk-in Visitor',
        expectedDate: '2025-06-15',
      };

      const savedVisitor = createMockVisitor({ visitorEmail: null });
      visitorRepo.save.mockResolvedValueOnce(savedVisitor);

      await service.inviteVisitor(mockHostUserId, dtoNoEmail);

      expect(emailsService.sendVisitorInvitation).not.toHaveBeenCalled();
    });

    it('should use fallback hostName when hostUser relation is missing', async () => {
      const savedVisitor = createMockVisitor();
      visitorRepo.save.mockResolvedValueOnce(savedVisitor);
      visitorRepo.findOne.mockResolvedValueOnce({
        ...savedVisitor,
        hostUser: null,
        location: null,
      });
      visitorRepo.save.mockResolvedValueOnce({ ...savedVisitor, notificationSent: true });

      await service.inviteVisitor(mockHostUserId, dto);

      expect(emailsService.sendVisitorInvitation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          hostName: 'Your host',
          locationName: 'D Block Workspace',
          locationAddress: 'Tbilisi, Georgia',
        }),
        'en',
        mockHostUserId,
      );
    });
  });

  // =========================================================================
  // updateVisitor
  // =========================================================================

  describe('updateVisitor', () => {
    it('should update visitor fields when host and status are valid', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const dto: UpdateVisitorDto = { visitorName: 'Updated Name', purpose: 'New purpose' };
      const result = await service.updateVisitor(visitor.id, mockHostUserId, dto);

      expect(result.visitorName).toBe('Updated Name');
      expect(result.purpose).toBe('New purpose');
    });

    it('should throw NotFoundException if visitor does not exist', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateVisitor('non-existent-id', mockHostUserId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the host', async () => {
      const visitor = createMockVisitor({ hostUserId: 'different-host-id' });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(
        service.updateVisitor(visitor.id, mockHostUserId, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status is not EXPECTED', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_IN });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(
        service.updateVisitor(visitor.id, mockHostUserId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should only apply fields that are present in the DTO', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const dto: UpdateVisitorDto = { visitorName: 'Only Name' };
      const result = await service.updateVisitor(visitor.id, mockHostUserId, dto);

      expect(result.visitorName).toBe('Only Name');
      // Original values should remain
      expect(result.visitorEmail).toBe('jane@example.com');
    });
  });

  // =========================================================================
  // cancelVisitor
  // =========================================================================

  describe('cancelVisitor', () => {
    it('should set status to CANCELLED', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.cancelVisitor(visitor.id, mockHostUserId);

      expect(result.status).toBe(VisitorStatus.CANCELLED);
    });

    it('should throw NotFoundException if visitor does not exist', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.cancelVisitor('non-existent', mockHostUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the host', async () => {
      const visitor = createMockVisitor({ hostUserId: 'other-host' });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(
        service.cancelVisitor(visitor.id, mockHostUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status is not EXPECTED', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_IN });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(
        service.cancelVisitor(visitor.id, mockHostUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // checkInVisitor
  // =========================================================================

  describe('checkInVisitor', () => {
    it('should set status to CHECKED_IN and set checkedInAt', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.checkInVisitor(visitor.id);

      expect(result.status).toBe(VisitorStatus.CHECKED_IN);
      expect(result.checkedInAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if visitor does not exist', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.checkInVisitor('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if status is not EXPECTED', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CANCELLED });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(service.checkInVisitor(visitor.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if status is CHECKED_IN (already checked in)', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_IN });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(service.checkInVisitor(visitor.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // checkOutVisitor
  // =========================================================================

  describe('checkOutVisitor', () => {
    it('should set status to CHECKED_OUT and set checkedOutAt', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_IN });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.checkOutVisitor(visitor.id);

      expect(result.status).toBe(VisitorStatus.CHECKED_OUT);
      expect(result.checkedOutAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if visitor does not exist', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.checkOutVisitor('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if status is not CHECKED_IN', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.EXPECTED });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(service.checkOutVisitor(visitor.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if already CHECKED_OUT', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_OUT });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(service.checkOutVisitor(visitor.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // markNoShow
  // =========================================================================

  describe('markNoShow', () => {
    it('should set status to NO_SHOW', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);
      visitorRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.markNoShow(visitor.id);

      expect(result.status).toBe(VisitorStatus.NO_SHOW);
    });

    it('should throw NotFoundException if visitor does not exist', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.markNoShow('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if status is not EXPECTED', async () => {
      const visitor = createMockVisitor({ status: VisitorStatus.CHECKED_IN });
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      await expect(service.markNoShow(visitor.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const visitors = [createMockVisitor()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([visitors, 1]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: visitors,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(qb['skip']).toHaveBeenCalledWith(0);
      expect(qb['take']).toHaveBeenCalledWith(20);
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ page: 3, limit: 10 });

      expect(qb['skip']).toHaveBeenCalledWith(20); // (3-1)*10
      expect(qb['take']).toHaveBeenCalledWith(10);
    });

    it('should apply status filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ status: VisitorStatus.EXPECTED });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.status = :status',
        { status: VisitorStatus.EXPECTED },
      );
    });

    it('should apply locationId filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ locationId: mockLocationId });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.locationId = :locationId',
        { locationId: mockLocationId },
      );
    });

    it('should apply hostUserId filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ hostUserId: mockHostUserId });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.hostUserId = :hostUserId',
        { hostUserId: mockHostUserId },
      );
    });

    it('should apply dateFrom and dateTo filters', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ dateFrom: '2025-06-01', dateTo: '2025-06-30' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.expectedDate >= :dateFrom',
        { dateFrom: '2025-06-01' },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.expectedDate <= :dateTo',
        { dateTo: '2025-06-30' },
      );
    });

    it('should apply search filter with ILIKE', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'jane' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        '(visitor.visitorName ILIKE :search OR visitor.visitorEmail ILIKE :search OR visitor.visitorCompany ILIKE :search)',
        { search: '%jane%' },
      );
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return visitor with relations', async () => {
      const visitor = createMockVisitor();
      visitorRepo.findOne.mockResolvedValueOnce(visitor);

      const result = await service.findById(visitor.id);

      expect(result).toEqual(visitor);
      expect(visitorRepo.findOne).toHaveBeenCalledWith({
        where: { id: visitor.id },
        relations: ['hostUser', 'location'],
      });
    });

    it('should throw NotFoundException when visitor is not found', async () => {
      visitorRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findMyVisitors
  // =========================================================================

  describe('findMyVisitors', () => {
    it('should return paginated visitors for a given host', async () => {
      const visitors = [createMockVisitor()];
      visitorRepo.findAndCount.mockResolvedValueOnce([visitors, 1]);

      const result = await service.findMyVisitors(mockHostUserId);

      expect(result).toEqual({
        data: visitors,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(visitorRepo.findAndCount).toHaveBeenCalledWith({
        where: { hostUserId: mockHostUserId },
        relations: ['location'],
        order: { expectedDate: 'DESC', createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should accept custom page and limit', async () => {
      visitorRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.findMyVisitors(mockHostUserId, 2, 5);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(visitorRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  // =========================================================================
  // findTodaysVisitors
  // =========================================================================

  describe('findTodaysVisitors', () => {
    it('should query visitors for today with EXPECTED and CHECKED_IN statuses', async () => {
      const qb = createMockQueryBuilder();
      qb['getMany'].mockResolvedValueOnce([createMockVisitor()]);
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findTodaysVisitors(mockLocationId);

      expect(result).toHaveLength(1);
      expect(qb['where']).toHaveBeenCalledWith(
        'visitor.locationId = :locationId',
        { locationId: mockLocationId },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'visitor.status IN (:...statuses)',
        { statuses: [VisitorStatus.EXPECTED, VisitorStatus.CHECKED_IN] },
      );
    });
  });

  // =========================================================================
  // getVisitorStats
  // =========================================================================

  describe('getVisitorStats', () => {
    it('should return correct stats structure', async () => {
      // Each call to createQueryBuilder returns a fresh builder
      // Order: expectedToday, checkedInToday, totalThisWeek, totalPastVisitors, noShowCount
      const qb1 = createMockQueryBuilder();
      qb1['getCount'].mockResolvedValueOnce(5);
      const qb2 = createMockQueryBuilder();
      qb2['getCount'].mockResolvedValueOnce(3);
      const qb3 = createMockQueryBuilder();
      qb3['getCount'].mockResolvedValueOnce(20);
      const qb4 = createMockQueryBuilder();
      qb4['getCount'].mockResolvedValueOnce(100);
      const qb5 = createMockQueryBuilder();
      qb5['getCount'].mockResolvedValueOnce(10);

      visitorRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2)
        .mockReturnValueOnce(qb3)
        .mockReturnValueOnce(qb4)
        .mockReturnValueOnce(qb5);

      const result = await service.getVisitorStats(mockLocationId);

      expect(result).toEqual({
        expectedToday: 5,
        checkedInToday: 3,
        totalThisWeek: 20,
        noShowRate: 10, // (10 / 100) * 10000 / 100 = 10
      });
    });

    it('should return noShowRate 0 when no past visitors', async () => {
      const qb1 = createMockQueryBuilder();
      qb1['getCount'].mockResolvedValueOnce(2);
      const qb2 = createMockQueryBuilder();
      qb2['getCount'].mockResolvedValueOnce(1);
      const qb3 = createMockQueryBuilder();
      qb3['getCount'].mockResolvedValueOnce(5);
      const qb4 = createMockQueryBuilder();
      qb4['getCount'].mockResolvedValueOnce(0); // totalPastVisitors = 0
      const qb5 = createMockQueryBuilder();
      qb5['getCount'].mockResolvedValueOnce(0);

      visitorRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2)
        .mockReturnValueOnce(qb3)
        .mockReturnValueOnce(qb4)
        .mockReturnValueOnce(qb5);

      const result = await service.getVisitorStats(mockLocationId);

      expect(result.noShowRate).toBe(0);
    });
  });

  // =========================================================================
  // checkNoShowVisitors
  // =========================================================================

  describe('checkNoShowVisitors', () => {
    it('should mark old EXPECTED visitors as NO_SHOW and return count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 3 });
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkNoShowVisitors();

      expect(result).toBe(3);
      expect(qb['update']).toHaveBeenCalledWith(Visitor);
      expect(qb['set']).toHaveBeenCalledWith({ status: VisitorStatus.NO_SHOW });
      expect(qb['andWhere']).toHaveBeenCalledWith('status = :status', {
        status: VisitorStatus.EXPECTED,
      });
    });

    it('should return 0 when no visitors need to be marked', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      visitorRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkNoShowVisitors();

      expect(result).toBe(0);
    });
  });
});
