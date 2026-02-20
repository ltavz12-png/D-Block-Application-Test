import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { B2bService } from './b2b.service';
import { Company, CompanyStatus } from '@/common/database/entities/company.entity';
import { User, UserRole, UserStatus } from '@/common/database/entities/user.entity';
import { Contract, ContractStatus } from '@/common/database/entities/contract.entity';
import { CreditPackageStatus } from '@/common/database/entities/credit-package.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockCreatorId = 'user-admin-0001-0001-000000000001';
const COMPANY_ID = 'comp-0001-0001-0001-000000000001';
const EMPLOYEE_ID = 'user-emp-01-0001-0001-000000000001';
const LOCATION_ID = 'loc-stamba-0001-0001-000000000001';

function createMockCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: COMPANY_ID,
    name: 'TechCo Georgia',
    taxId: 'GE-1234567',
    registrationNumber: 'REG-2025-001',
    contactEmail: 'contact@techco.ge',
    contactPersonName: 'Giorgi Beridze',
    contactPhone: '+995555111222',
    locationId: LOCATION_ID,
    status: CompanyStatus.ACTIVE,
    employees: [],
    contracts: [],
    createdBy: mockCreatorId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as Company;
}

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: EMPLOYEE_ID,
    email: 'emp1@techco.ge',
    firstName: 'Nino',
    lastName: 'Kapanadze',
    phone: '+995555333444',
    companyId: COMPANY_ID,
    role: UserRole.COMPANY_EMPLOYEE,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as User;
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

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('B2bService', () => {
  let service: B2bService;
  let companyRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let contractRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    companyRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || COMPANY_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    (companyRepo as any).manager = {
      createQueryBuilder: jest.fn(),
    };

    userRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || EMPLOYEE_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
    };

    contractRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        B2bService,
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Contract), useValue: contractRepo },
      ],
    }).compile();

    service = module.get<B2bService>(B2bService);
  });

  // =========================================================================
  // createCompany
  // =========================================================================

  describe('createCompany', () => {
    it('should create a company and set createdBy', async () => {
      const dto = {
        name: 'TechCo Georgia',
        contactEmail: 'contact@techco.ge',
        contactPersonName: 'Giorgi Beridze',
      };

      companyRepo.save.mockResolvedValueOnce({
        ...dto,
        id: COMPANY_ID,
        createdBy: mockCreatorId,
      });

      const result = await service.createCompany(dto as any, mockCreatorId);

      expect(companyRepo.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: mockCreatorId,
      });
      expect(result.name).toBe('TechCo Georgia');
    });
  });

  // =========================================================================
  // updateCompany
  // =========================================================================

  describe('updateCompany', () => {
    it('should update company fields', async () => {
      const company = createMockCompany();
      companyRepo.findOne.mockResolvedValueOnce({ ...company });
      companyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.updateCompany(COMPANY_ID, {
        name: 'TechCo Updated',
      } as any);

      expect(result.name).toBe('TechCo Updated');
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateCompany('non-existent', { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      const companies = [createMockCompany()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([companies, 1]);
      companyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: companies,
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      companyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ status: CompanyStatus.ACTIVE } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'company.status = :status',
        { status: CompanyStatus.ACTIVE },
      );
    });

    it('should filter by locationId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      companyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ locationId: LOCATION_ID } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'company.locationId = :locationId',
        { locationId: LOCATION_ID },
      );
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      companyRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'TechCo' } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        '(company.name ILIKE :search OR company.contactEmail ILIKE :search OR company.contactPersonName ILIKE :search)',
        { search: '%TechCo%' },
      );
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return company with employees and contracts relations', async () => {
      const company = createMockCompany();
      companyRepo.findOne.mockResolvedValueOnce(company);

      const result = await service.findById(COMPANY_ID);

      expect(result).toEqual(company);
      expect(companyRepo.findOne).toHaveBeenCalledWith({
        where: { id: COMPANY_ID },
        relations: ['employees', 'contracts'],
      });
    });

    it('should throw NotFoundException when company is not found', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // Company Status Management
  // =========================================================================

  describe('suspendCompany', () => {
    it('should set status to SUSPENDED', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      companyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.suspendCompany(COMPANY_ID);

      expect(result.status).toBe(CompanyStatus.SUSPENDED);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.suspendCompany('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activateCompany', () => {
    it('should set status to ACTIVE', async () => {
      companyRepo.findOne.mockResolvedValueOnce(
        createMockCompany({ status: CompanyStatus.SUSPENDED }),
      );
      companyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.activateCompany(COMPANY_ID);

      expect(result.status).toBe(CompanyStatus.ACTIVE);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.activateCompany('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateCompany', () => {
    it('should set status to INACTIVE', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      companyRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.deactivateCompany(COMPANY_ID);

      expect(result.status).toBe(CompanyStatus.INACTIVE);
    });
  });

  // =========================================================================
  // Employee Management
  // =========================================================================

  describe('addEmployee', () => {
    it('should create a new employee linked to the company', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      userRepo.findOne.mockResolvedValueOnce(null); // no existing user
      userRepo.save.mockResolvedValueOnce(createMockUser());

      const dto = {
        email: 'emp1@techco.ge',
        firstName: 'Nino',
        lastName: 'Kapanadze',
        phone: '+995555333444',
      };

      const result = await service.addEmployee(COMPANY_ID, dto as any);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          companyId: COMPANY_ID,
          role: UserRole.COMPANY_EMPLOYEE,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result.email).toBe('emp1@techco.ge');
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.addEmployee('non-existent', {
          email: 'test@test.com',
          firstName: 'T',
          lastName: 'T',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      userRepo.findOne.mockResolvedValueOnce(createMockUser()); // existing user

      await expect(
        service.addEmployee(COMPANY_ID, {
          email: 'emp1@techco.ge',
          firstName: 'Nino',
          lastName: 'Kapanadze',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should use custom role when provided', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      userRepo.findOne.mockResolvedValueOnce(null);
      userRepo.save.mockResolvedValueOnce(
        createMockUser({ role: UserRole.COMPANY_ADMIN }),
      );

      await service.addEmployee(COMPANY_ID, {
        email: 'admin@techco.ge',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.COMPANY_ADMIN,
      } as any);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.COMPANY_ADMIN }),
      );
    });
  });

  describe('removeEmployee', () => {
    it('should detach employee from company and set role to MEMBER', async () => {
      const user = createMockUser();
      userRepo.findOne.mockResolvedValueOnce(user);
      userRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.removeEmployee(COMPANY_ID, EMPLOYEE_ID);

      expect(user.companyId).toBeNull();
      expect(user.role).toBe(UserRole.MEMBER);
    });

    it('should throw NotFoundException when employee is not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.removeEmployee(COMPANY_ID, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEmployeeRole', () => {
    it('should update the role of an employee', async () => {
      const user = createMockUser();
      userRepo.findOne.mockResolvedValueOnce(user);
      userRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateEmployeeRole(
        COMPANY_ID,
        EMPLOYEE_ID,
        { role: UserRole.COMPANY_ADMIN } as any,
      );

      expect(result.role).toBe(UserRole.COMPANY_ADMIN);
    });

    it('should throw NotFoundException when employee is not in company', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateEmployeeRole(COMPANY_ID, 'non-existent', {
          role: UserRole.COMPANY_ADMIN,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEmployees', () => {
    it('should return paginated employees', async () => {
      const employees = [createMockUser()];
      userRepo.findAndCount.mockResolvedValueOnce([employees, 1]);

      const result = await service.getEmployees(COMPANY_ID);

      expect(result).toEqual({
        data: employees,
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should accept custom page and limit', async () => {
      userRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.getEmployees(COMPANY_ID, 2, 5);

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  // =========================================================================
  // getCompanyStats
  // =========================================================================

  describe('getCompanyStats', () => {
    it('should return employee count, active contracts, and credit balance', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      userRepo.count.mockResolvedValueOnce(15);
      contractRepo.count.mockResolvedValueOnce(3);

      const qb = createMockQueryBuilder();
      qb['getRawOne'].mockResolvedValueOnce({ creditBalance: 2000 });
      (companyRepo as any).manager.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getCompanyStats(COMPANY_ID);

      expect(result).toEqual({
        employeeCount: 15,
        activeContractCount: 3,
        creditBalance: 2000,
      });
    });

    it('should return 0 credit balance when no active packages', async () => {
      companyRepo.findOne.mockResolvedValueOnce(createMockCompany());
      userRepo.count.mockResolvedValueOnce(0);
      contractRepo.count.mockResolvedValueOnce(0);

      const qb = createMockQueryBuilder();
      qb['getRawOne'].mockResolvedValueOnce({ creditBalance: null });
      (companyRepo as any).manager.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getCompanyStats(COMPANY_ID);

      expect(result.creditBalance).toBe(0);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getCompanyStats('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
