import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import {
  Invoice,
  InvoiceStatus,
} from '@/common/database/entities/invoice.entity';
import {
  Contract,
  ContractStatus,
  ContractType,
} from '@/common/database/entities/contract.entity';
import { Company } from '@/common/database/entities/company.entity';
import { Booking } from '@/common/database/entities/booking.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const COMPANY_ID = 'comp-0001-0001-0001-000000000001';
const INVOICE_ID = 'inv-0001-0001-0001-000000000001';

function createMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: INVOICE_ID,
    invoiceNumber: 'INV-20250615-ABC1',
    userId: mockUserId,
    companyId: null,
    lineItems: [
      {
        description: 'Meeting Room A (2 hours)',
        descriptionKa: null,
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        taxRate: 18,
        taxAmount: 18,
        productId: null,
      },
    ],
    subtotal: 100,
    taxAmount: 18,
    totalAmount: 118,
    currency: 'GEL',
    status: InvoiceStatus.DRAFT,
    issueDate: new Date('2025-06-15'),
    dueDate: new Date('2025-06-30'),
    paidDate: null,
    paymentId: null,
    periodStart: null,
    periodEnd: null,
    language: 'en',
    metadata: null,
    createdBy: mockUserId,
    user: undefined as any,
    company: undefined as any,
    createdAt: new Date('2025-06-15'),
    updatedAt: new Date('2025-06-15'),
    deletedAt: null as any,
    ...overrides,
  } as Invoice;
}

function createMockContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-001',
    contractNumber: 'CTR-20250101-ABCD',
    companyId: COMPANY_ID,
    locationId: 'loc-001',
    contractType: ContractType.RENTAL,
    status: ContractStatus.ACTIVE,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    monthlyAmount: 5000,
    currency: 'GEL',
    ...overrides,
  } as Contract;
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
    'groupBy',
    'update',
    'set',
    'clone',
  ];

  for (const method of methods) {
    qb[method] = jest.fn().mockReturnThis();
  }

  // clone returns a new qb-like object with its own chaining
  qb['clone'] = jest.fn().mockImplementation(() => {
    const cloned: Record<string, jest.Mock> = {};
    for (const method of methods) {
      cloned[method] = jest.fn().mockReturnThis();
    }
    cloned['clone'] = jest.fn().mockReturnThis();
    cloned['getRawOne'] = jest.fn().mockResolvedValue({ total: '0' });
    cloned['getRawMany'] = jest.fn().mockResolvedValue([]);
    cloned['select'] = jest.fn().mockReturnValue(cloned);
    cloned['addSelect'] = jest.fn().mockReturnValue(cloned);
    cloned['andWhere'] = jest.fn().mockReturnValue(cloned);
    cloned['groupBy'] = jest.fn().mockReturnValue(cloned);
    return cloned;
  });

  qb['getManyAndCount'] = jest.fn().mockResolvedValue(returnData ?? [[], 0]);
  qb['getMany'] = jest.fn().mockResolvedValue(returnData?.[0] ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['execute'] = jest.fn().mockResolvedValue(returnData ?? { affected: 0 });
  qb['getRawOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['getRawMany'] = jest.fn().mockResolvedValue(returnData ?? []);

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepo: Record<string, jest.Mock>;
  let contractRepo: Record<string, jest.Mock>;
  let companyRepo: Record<string, jest.Mock>;
  let bookingRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    invoiceRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || INVOICE_ID }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    contractRepo = {
      find: jest.fn(),
    };

    companyRepo = {};
    bookingRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(Contract), useValue: contractRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  // =========================================================================
  // create
  // =========================================================================

  describe('create', () => {
    it('should create an invoice with calculated totals', async () => {
      const dto = {
        userId: mockUserId,
        issueDate: '2025-06-15',
        dueDate: '2025-06-30',
        lineItems: [
          {
            description: 'Meeting Room A (2 hours)',
            quantity: 2,
            unitPrice: 50,
            taxRate: 18,
          },
        ],
      };

      invoiceRepo.save.mockResolvedValueOnce(
        createMockInvoice({ invoiceNumber: 'INV-20250615-XXXX' }),
      );

      const result = await service.create(dto as any, mockUserId);

      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 100, // 2 * 50
          taxAmount: 18, // (100 * 18) / 100
          totalAmount: 118, // 100 + 18
          status: InvoiceStatus.DRAFT,
          createdBy: mockUserId,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should generate an invoice number with INV- prefix', async () => {
      const dto = {
        userId: mockUserId,
        issueDate: '2025-06-15',
        dueDate: '2025-06-30',
        lineItems: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 100,
            taxRate: 0,
          },
        ],
      };

      invoiceRepo.save.mockImplementation((entity) => {
        expect(entity.invoiceNumber).toMatch(/^INV-\d{8}-[A-Z0-9]{4}$/);
        return Promise.resolve({ ...entity, id: INVOICE_ID });
      });

      await service.create(dto as any, mockUserId);
    });

    it('should throw BadRequestException when neither userId nor companyId is provided', async () => {
      const dto = {
        issueDate: '2025-06-15',
        dueDate: '2025-06-30',
        lineItems: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 100,
            taxRate: 0,
          },
        ],
      };

      await expect(service.create(dto as any, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle multiple line items', async () => {
      const dto = {
        companyId: COMPANY_ID,
        issueDate: '2025-06-15',
        dueDate: '2025-06-30',
        lineItems: [
          { description: 'Room A', quantity: 2, unitPrice: 50, taxRate: 18 },
          { description: 'Room B', quantity: 1, unitPrice: 100, taxRate: 18 },
        ],
      };

      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: INVOICE_ID }),
      );

      await service.create(dto as any, mockUserId);

      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 200, // (2*50) + (1*100)
          taxAmount: 36, // (100*18/100) + (100*18/100)
          totalAmount: 236,
        }),
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe('update', () => {
    it('should update invoice when status is DRAFT', async () => {
      const invoice = createMockInvoice();
      invoiceRepo.findOne.mockResolvedValueOnce(invoice);
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(INVOICE_ID, {
        dueDate: '2025-07-15',
      } as any);

      expect(result.dueDate).toEqual(new Date('2025-07-15'));
    });

    it('should recalculate totals when lineItems are updated', async () => {
      const invoice = createMockInvoice();
      invoiceRepo.findOne.mockResolvedValueOnce(invoice);
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(INVOICE_ID, {
        lineItems: [
          { description: 'New Item', quantity: 3, unitPrice: 100, taxRate: 18 },
        ],
      } as any);

      expect(result.subtotal).toBe(300);
      expect(result.taxAmount).toBe(54);
      expect(result.totalAmount).toBe(354);
    });

    it('should throw NotFoundException for non-existent invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invoice is not DRAFT', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.SENT }),
      );

      await expect(
        service.update(INVOICE_ID, { dueDate: '2025-08-01' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const invoices = [createMockInvoice()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([invoices, 1]);
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({ data: invoices, total: 1, page: 1, limit: 20 });
    });

    it('should filter by userId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ userId: mockUserId } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'invoice.userId = :userId',
        { userId: mockUserId },
      );
    });

    it('should filter by companyId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ companyId: COMPANY_ID } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'invoice.companyId = :companyId',
        { companyId: COMPANY_ID },
      );
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ status: InvoiceStatus.PAID } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'invoice.status = :status',
        { status: InvoiceStatus.PAID },
      );
    });

    it('should apply search on invoiceNumber', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'INV-2025' } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'invoice.invoiceNumber ILIKE :search',
        { search: '%INV-2025%' },
      );
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return invoice with user and company relations', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(createMockInvoice());

      const result = await service.findById(INVOICE_ID);

      expect(result.id).toBe(INVOICE_ID);
      expect(invoiceRepo.findOne).toHaveBeenCalledWith({
        where: { id: INVOICE_ID },
        relations: ['user', 'company'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findByUser / findByCompany
  // =========================================================================

  describe('findByUser', () => {
    it('should return paginated invoices for a user', async () => {
      invoiceRepo.findAndCount.mockResolvedValueOnce([
        [createMockInvoice()],
        1,
      ]);

      const result = await service.findByUser(mockUserId, 1, 20);

      expect(result).toEqual(
        expect.objectContaining({ total: 1, page: 1, limit: 20 }),
      );
    });
  });

  describe('findByCompany', () => {
    it('should return paginated invoices for a company', async () => {
      invoiceRepo.findAndCount.mockResolvedValueOnce([
        [createMockInvoice({ companyId: COMPANY_ID })],
        1,
      ]);

      const result = await service.findByCompany(COMPANY_ID, 1, 20);

      expect(result.total).toBe(1);
    });
  });

  // =========================================================================
  // Status transitions
  // =========================================================================

  describe('sendInvoice', () => {
    it('should set status to SENT from DRAFT', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(createMockInvoice());
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.sendInvoice(INVOICE_ID);

      expect(result.status).toBe(InvoiceStatus.SENT);
    });

    it('should throw BadRequestException when status is not DRAFT', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.PAID }),
      );

      await expect(service.sendInvoice(INVOICE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markPaid', () => {
    it('should mark SENT invoice as PAID', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.SENT }),
      );
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.markPaid(INVOICE_ID, 'pay-001');

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidDate).toBeInstanceOf(Date);
      expect(result.paymentId).toBe('pay-001');
    });

    it('should mark OVERDUE invoice as PAID', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.OVERDUE }),
      );
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.markPaid(INVOICE_ID);

      expect(result.status).toBe(InvoiceStatus.PAID);
    });

    it('should throw BadRequestException for DRAFT invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.DRAFT }),
      );

      await expect(service.markPaid(INVOICE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelInvoice', () => {
    it('should cancel DRAFT invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(createMockInvoice());
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.cancelInvoice(INVOICE_ID);

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should cancel SENT invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.SENT }),
      );
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.cancelInvoice(INVOICE_ID);

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });

    it('should throw BadRequestException for PAID invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.PAID }),
      );

      await expect(service.cancelInvoice(INVOICE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('creditInvoice', () => {
    it('should credit a PAID invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.PAID }),
      );
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.creditInvoice(INVOICE_ID);

      expect(result.status).toBe(InvoiceStatus.CREDITED);
    });

    it('should throw BadRequestException for non-PAID invoice', async () => {
      invoiceRepo.findOne.mockResolvedValueOnce(
        createMockInvoice({ status: InvoiceStatus.SENT }),
      );

      await expect(service.creditInvoice(INVOICE_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // generateMonthlyB2BInvoices
  // =========================================================================

  describe('generateMonthlyB2BInvoices', () => {
    it('should generate invoices for all active contracts', async () => {
      const contracts = [
        createMockContract({ monthlyAmount: 5000 }),
        createMockContract({
          id: 'contract-002',
          companyId: 'comp-002',
          monthlyAmount: 3000,
        }),
      ];

      contractRepo.find.mockResolvedValueOnce(contracts);
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'inv-new' }),
      );

      const result = await service.generateMonthlyB2BInvoices(
        new Date('2025-06-01'),
      );

      expect(result.invoicesGenerated).toBe(2);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(invoiceRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should apply 18% tax rate to monthly amount', async () => {
      contractRepo.find.mockResolvedValueOnce([
        createMockContract({ monthlyAmount: 1000 }),
      ]);
      invoiceRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'inv-new' }),
      );

      const result = await service.generateMonthlyB2BInvoices(
        new Date('2025-06-01'),
      );

      expect(result.totalAmount).toBe(1180); // 1000 + 18%
    });

    it('should return zero when no active contracts exist', async () => {
      contractRepo.find.mockResolvedValueOnce([]);

      const result = await service.generateMonthlyB2BInvoices(
        new Date('2025-06-01'),
      );

      expect(result.invoicesGenerated).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  // =========================================================================
  // checkOverdueInvoices
  // =========================================================================

  describe('checkOverdueInvoices', () => {
    it('should mark overdue SENT invoices and return count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 5 });
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkOverdueInvoices();

      expect(result).toBe(5);
      expect(qb['set']).toHaveBeenCalledWith({
        status: InvoiceStatus.OVERDUE,
      });
      expect(qb['andWhere']).toHaveBeenCalledWith('due_date < :today', expect.objectContaining({
        today: expect.any(Date),
      }));
    });

    it('should return 0 when no overdue invoices', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkOverdueInvoices();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // getInvoiceSummary
  // =========================================================================

  describe('getInvoiceSummary', () => {
    it('should return aggregated invoice summary', async () => {
      const qb = createMockQueryBuilder();

      // Each clone() returns a fresh qb that resolves differently
      let cloneCallCount = 0;
      qb['clone'] = jest.fn().mockImplementation(() => {
        cloneCallCount++;
        const cloned: Record<string, jest.Mock> = {};
        const cloneMethods = [
          'select',
          'addSelect',
          'andWhere',
          'groupBy',
        ];
        for (const m of cloneMethods) {
          cloned[m] = jest.fn().mockReturnValue(cloned);
        }

        if (cloneCallCount === 1) {
          // totalInvoiced
          cloned['getRawOne'] = jest.fn().mockResolvedValue({ total: '50000' });
        } else if (cloneCallCount === 2) {
          // totalPaid
          cloned['getRawOne'] = jest.fn().mockResolvedValue({ total: '30000' });
        } else if (cloneCallCount === 3) {
          // totalOverdue
          cloned['getRawOne'] = jest.fn().mockResolvedValue({ total: '10000' });
        } else if (cloneCallCount === 4) {
          // totalDraft
          cloned['getRawOne'] = jest.fn().mockResolvedValue({ total: '10000' });
        } else if (cloneCallCount === 5) {
          // countByStatus
          cloned['getRawMany'] = jest.fn().mockResolvedValue([
            { status: 'draft', count: '5' },
            { status: 'paid', count: '10' },
            { status: 'overdue', count: '3' },
          ]);
        }

        return cloned;
      });

      invoiceRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getInvoiceSummary();

      expect(result.totalInvoiced).toBe(50000);
      expect(result.totalPaid).toBe(30000);
      expect(result.totalOverdue).toBe(10000);
      expect(result.totalDraft).toBe(10000);
      expect(result.countByStatus).toEqual({
        draft: 5,
        paid: 10,
        overdue: 3,
      });
    });
  });
});
