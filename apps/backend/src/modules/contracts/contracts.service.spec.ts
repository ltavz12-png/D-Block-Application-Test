import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import {
  Contract,
  ContractStatus,
  ContractType,
} from '@/common/database/entities/contract.entity';
import { Company } from '@/common/database/entities/company.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const COMPANY_ID = 'comp-0001-0001-0001-000000000001';
const LOCATION_ID = 'loc-stamba-0001-0001-000000000001';
const CONTRACT_ID = 'ctr-0001-0001-0001-000000000001';
const CONTRACT_2_ID = 'ctr-0002-0001-0001-000000000002';

function createMockContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: CONTRACT_ID,
    contractNumber: 'CTR-20250101-ABCD',
    companyId: COMPANY_ID,
    locationId: LOCATION_ID,
    contractType: ContractType.RENTAL,
    status: ContractStatus.DRAFT,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    monthlyAmount: 5000,
    currency: 'GEL',
    autoRenew: false,
    noticePeriodDays: 30,
    areaSqm: 50,
    pricePerSqm: 100,
    resourceIds: ['res-001', 'res-002'],
    terms: 'Standard terms and conditions',
    signedAt: null,
    signedByCompany: null,
    signedByDblock: null,
    documentUrl: null,
    docusignEnvelopeId: null,
    metadata: null,
    company: undefined as any,
    location: undefined as any,
    createdBy: mockUserId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as Contract;
}

function createMockCompany(): Company {
  return {
    id: COMPANY_ID,
    name: 'TechCo Georgia',
  } as Company;
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
  qb['execute'] = jest.fn().mockResolvedValue(returnData ?? { affected: 0 });
  qb['getRawOne'] = jest.fn().mockResolvedValue(returnData ?? null);

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ContractsService', () => {
  let service: ContractsService;
  let contractRepo: Record<string, jest.Mock>;
  let companyRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    contractRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || CONTRACT_ID }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    companyRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: getRepositoryToken(Contract), useValue: contractRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  // =========================================================================
  // create
  // =========================================================================

  describe('create', () => {
    it('should create a contract in DRAFT status', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      contractRepo.save.mockResolvedValueOnce({ id: CONTRACT_ID });
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());

      const dto = {
        companyId: COMPANY_ID,
        locationId: LOCATION_ID,
        contractType: ContractType.RENTAL,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        monthlyAmount: 5000,
      };

      const result = await service.create(dto as any, mockUserId);

      expect(contractRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          status: ContractStatus.DRAFT,
          createdBy: mockUserId,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should generate a contract number with CTR- prefix', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      contractRepo.save.mockImplementation((entity) => {
        expect(entity.contractNumber).toMatch(/^CTR-\d{8}-[A-Z0-9]{4}$/);
        return Promise.resolve({ ...entity, id: CONTRACT_ID });
      });
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());

      await service.create(
        {
          companyId: COMPANY_ID,
          locationId: LOCATION_ID,
          contractType: ContractType.RENTAL,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          monthlyAmount: 5000,
        } as any,
        mockUserId,
      );
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create(
          {
            companyId: 'non-existent',
            contractType: ContractType.RENTAL,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            monthlyAmount: 5000,
          } as any,
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set defaults for optional fields', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      contractRepo.save.mockResolvedValueOnce({ id: CONTRACT_ID });
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());

      await service.create(
        {
          companyId: COMPANY_ID,
          contractType: ContractType.COWORKING,
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          monthlyAmount: 2000,
        } as any,
        mockUserId,
      );

      expect(contractRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'GEL',
          autoRenew: false,
          noticePeriodDays: 30,
        }),
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe('update', () => {
    it('should update a DRAFT contract', async () => {
      contractRepo.findOne
        .mockResolvedValueOnce(createMockContract()) // findById
        .mockResolvedValueOnce(
          createMockContract({ monthlyAmount: 6000 }),
        ); // return after save
      contractRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(CONTRACT_ID, {
        monthlyAmount: 6000,
      } as any);

      expect(result.monthlyAmount).toBe(6000);
    });

    it('should update an ACTIVE contract', async () => {
      contractRepo.findOne
        .mockResolvedValueOnce(
          createMockContract({ status: ContractStatus.ACTIVE }),
        )
        .mockResolvedValueOnce(createMockContract());
      contractRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.update(CONTRACT_ID, { autoRenew: true } as any);

      expect(contractRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for TERMINATED contract', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.TERMINATED }),
      );

      await expect(
        service.update(CONTRACT_ID, { monthlyAmount: 1000 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for EXPIRED contract', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.EXPIRED }),
      );

      await expect(
        service.update(CONTRACT_ID, { terms: 'new terms' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const contracts = [createMockContract()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([contracts, 1]);
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({ data: contracts, total: 1, page: 1, limit: 20 });
    });

    it('should filter by companyId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ companyId: COMPANY_ID } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'contract.companyId = :companyId',
        { companyId: COMPANY_ID },
      );
    });

    it('should filter by contractType', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ contractType: ContractType.RENTAL } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'contract.contractType = :contractType',
        { contractType: ContractType.RENTAL },
      );
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ status: ContractStatus.ACTIVE } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'contract.status = :status',
        { status: ContractStatus.ACTIVE },
      );
    });

    it('should apply search on contractNumber', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'CTR-2025' } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'contract.contractNumber ILIKE :search',
        { search: '%CTR-2025%' },
      );
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return contract with company and location', async () => {
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());

      const result = await service.findById(CONTRACT_ID);

      expect(result.id).toBe(CONTRACT_ID);
      expect(contractRepo.findOne).toHaveBeenCalledWith({
        where: { id: CONTRACT_ID },
        relations: ['company', 'location'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      contractRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findByCompany
  // =========================================================================

  describe('findByCompany', () => {
    it('should return paginated contracts for a company', async () => {
      contractRepo.findAndCount.mockResolvedValueOnce([
        [createMockContract()],
        1,
      ]);

      const result = await service.findByCompany(COMPANY_ID);

      expect(result.total).toBe(1);
    });
  });

  // =========================================================================
  // Lifecycle Methods
  // =========================================================================

  describe('sendForSignature', () => {
    it('should set status to PENDING_SIGNATURE from DRAFT', async () => {
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());
      contractRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.sendForSignature(CONTRACT_ID);

      expect(result.status).toBe(ContractStatus.PENDING_SIGNATURE);
    });

    it('should throw BadRequestException when not DRAFT', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.ACTIVE }),
      );

      await expect(service.sendForSignature(CONTRACT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markSigned', () => {
    it('should set status to ACTIVE and record signatories', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.PENDING_SIGNATURE }),
      );
      contractRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.markSigned(CONTRACT_ID, {
        signedByCompany: 'Giorgi Beridze',
        signedByDblock: 'D Block Admin',
        documentUrl: 'https://storage.dblock.ge/contracts/signed.pdf',
        docusignEnvelopeId: 'ds-env-001',
      } as any);

      expect(result.status).toBe(ContractStatus.ACTIVE);
      expect(result.signedAt).toBeInstanceOf(Date);
      expect(result.signedByCompany).toBe('Giorgi Beridze');
      expect(result.signedByDblock).toBe('D Block Admin');
      expect(result.documentUrl).toBe(
        'https://storage.dblock.ge/contracts/signed.pdf',
      );
    });

    it('should throw BadRequestException when not PENDING_SIGNATURE', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.DRAFT }),
      );

      await expect(
        service.markSigned(CONTRACT_ID, {
          signedByCompany: 'Test',
          signedByDblock: 'Test',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('terminate', () => {
    it('should set status to TERMINATED from ACTIVE', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.ACTIVE }),
      );
      contractRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.terminate(
        CONTRACT_ID,
        'Lease agreement ended',
      );

      expect(result.status).toBe(ContractStatus.TERMINATED);
      expect(result.metadata).toEqual(
        expect.objectContaining({
          terminationReason: 'Lease agreement ended',
        }),
      );
    });

    it('should throw BadRequestException when not ACTIVE', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.DRAFT }),
      );

      await expect(service.terminate(CONTRACT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('renewContract', () => {
    it('should create a new DRAFT contract and mark old as RENEWED', async () => {
      const oldContract = createMockContract({
        status: ContractStatus.ACTIVE,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      });

      contractRepo.findOne
        .mockResolvedValueOnce(oldContract) // findById
        .mockResolvedValueOnce(
          createMockContract({ id: CONTRACT_2_ID }),
        ); // return new contract

      contractRepo.save
        .mockResolvedValueOnce({ id: CONTRACT_2_ID }) // save new
        .mockResolvedValueOnce(oldContract); // save old as RENEWED

      const result = await service.renewContract(CONTRACT_ID);

      // New contract dates should continue from old end date
      expect(contractRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          status: ContractStatus.DRAFT,
          startDate: new Date('2025-12-31'),
          metadata: expect.objectContaining({
            renewedFromContractId: CONTRACT_ID,
          }),
        }),
      );

      // Old contract should be RENEWED
      expect(oldContract.status).toBe(ContractStatus.RENEWED);
    });

    it('should renew an EXPIRED contract', async () => {
      contractRepo.findOne
        .mockResolvedValueOnce(
          createMockContract({ status: ContractStatus.EXPIRED }),
        )
        .mockResolvedValueOnce(createMockContract());

      contractRepo.save
        .mockResolvedValueOnce({ id: CONTRACT_2_ID })
        .mockResolvedValueOnce({});

      await service.renewContract(CONTRACT_ID);

      expect(contractRepo.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for DRAFT contract', async () => {
      contractRepo.findOne.mockResolvedValueOnce(createMockContract());

      await expect(service.renewContract(CONTRACT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for TERMINATED contract', async () => {
      contractRepo.findOne.mockResolvedValueOnce(
        createMockContract({ status: ContractStatus.TERMINATED }),
      );

      await expect(service.renewContract(CONTRACT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // checkExpiredContracts
  // =========================================================================

  describe('checkExpiredContracts', () => {
    it('should mark expired active contracts and return count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 2 });
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredContracts();

      expect(result).toBe(2);
      expect(qb['set']).toHaveBeenCalledWith({
        status: ContractStatus.EXPIRED,
      });
    });

    it('should return 0 when no contracts have expired', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      contractRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredContracts();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // getContractSummary
  // =========================================================================

  describe('getContractSummary', () => {
    it('should return active contracts count, total monthly, and expiring count', async () => {
      const qb1 = createMockQueryBuilder();
      qb1['getRawOne'].mockResolvedValueOnce({
        count: '3',
        totalMonthly: '15000',
      });

      const qb2 = createMockQueryBuilder();
      qb2['getRawOne'].mockResolvedValueOnce({ count: '1' });

      contractRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2);

      const result = await service.getContractSummary(COMPANY_ID);

      expect(result).toEqual({
        activeContracts: 3,
        totalMonthlyValue: 15000,
        expiringWithin30Days: 1,
      });
    });
  });
});
